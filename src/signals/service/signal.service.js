const { deleteIncidentsByUserAndMonitor } = require('../../incidents/repositories/incident.repositories');
const { sendToUser } = require('../../utils/sseManager');
const MonitorRepository = require('../repositories/monitor.repository');
const HeartbeatRepository = require('../repositories/heartbeat.repository');
const PingerService = require('./pinger.service');
const SignalCacheService = require('./signalCache.service');

const checkAllActiveMonitors = async () => {
  try {
    console.log(`[Signal Worker]: Fetching active monitors...`);
    const activeMonitors = await MonitorRepository.findActiveMonitors();

    if (!activeMonitors.length) {
      console.log(`[Signal Worker]: No active monitors found.`);
      return;
    }

    console.log(
      `[Signal Worker]: Found ${activeMonitors.length} active monitors.`
    );

    const checks = activeMonitors.map(monitor => {
      return PingerService.ping(monitor)
        .then(result => {
          const codeInfo = result.statusCode
            ? ` | Code: ${result.statusCode}`
            : '';
          const errorInfo = result.error ? ` | Error: ${result.error}` : '';

          console.log(
            `[Signal Worker] Heartbeat -> Monitor: ${result.monitorId} | Status: ${result.status}${codeInfo} | Time: ${result.responseTime}ms${errorInfo}`
          );


          const userId = monitor.user?._id || monitor.user || result.userId;

          if (userId) {
            sendToUser(userId, 'heartbeat', {
              monitorId: result.monitorId,
              status: result.status,
              responseTime: result.responseTime,
              statusCode: result.statusCode,
              error: result.error,
              timestamp: new Date()
            });
          }

          return result;
        })
        .catch(err => {
          console.error(`[Signal Worker]: Failed to ping ${monitor.url}`, err);

          const errorPayload = {
            monitorId: monitor._id,
            status: 'DOWN',
            responseTime: 0,
            error: err.message,
            timestamp: new Date()
          };

          const userId = monitor.user?._id || monitor.user;
          if (userId) {
            sendToUser(userId, 'heartbeat', errorPayload);
          }

          return errorPayload;
        });
    });

    await Promise.allSettled(checks);
    console.log(`[Signal Worker]: All active monitor checks completed.`);
  } catch (err) {
    console.error(`[Signal Worker]: Failed to check active monitors`, err);
  }
};

const createMonitor = async (userId, monitorData) => {
  const monitor = await MonitorRepository.create(userId, monitorData)
  PingerService.ping(monitor).catch(err => {
    console.error(`[Initial Ping Error]: Failed to ping ${monitor.url}`, err)
  })
  return monitor
}

const updateMonitor = async (userId, monitorId, monitorData) => {
  const monitor = await MonitorRepository.update(userId, monitorId, monitorData)
  if (monitor.status === 'DOWN') {
    PingerService.ping(monitor).catch(err => {
      console.error(`[Initial Ping Error]: Failed to ping ${monitor.url}`, err)
    })
  }
  return monitor
}

const deleteMonitor = async (monitorId, userId) => {
  const deletedMonitor = await MonitorRepository.deleteMonitorById(monitorId, userId)
  if (!deletedMonitor) throw new Error("Monitor not found or unauthorized")

  await Promise.allSettled([
    HeartbeatRepository.deleteMany({ monitor: monitorId }),
    SignalCacheService.clearMonitorCache(monitorId),
    deleteIncidentsByUserAndMonitor(monitorId, userId)
  ])

  return deletedMonitor
}
const updateStatuesForMonitor = async (monitorId, userId, updateData) => {
  try {
    const monitor = await MonitorRepository.updateStatusForUser(
      monitorId,
      userId,
      {
        status: updateData
      }
    )
    if (!monitor) throw new Error('Monitor not found or unauthorized')
    if (updateData === 'PAUSED') {
      await SignalCacheService.clearAlertLock(monitorId)
      return monitor
    }

    if (updateData === 'PENDING') {
      await SignalCacheService.clearAlertLock(monitorId)
      return monitor
    }
  } catch (error) {
    throw error
  }
}

const getMonitorsForUser = async userId => {
  return await MonitorRepository.findAllByUser(userId)
}

const getMonitorByIdForUser = async (monitorId, userId) => {
  const monitor = await MonitorRepository.findByIdAndUser(monitorId, userId)
  if (!monitor) throw new Error('Monitor not found or unauthorized')
  return monitor
}

const updateGlobalStatuesMonitor = async (userId, monitorId, monitorData) => {
  const monitor = await MonitorRepository.globalUpdateMoitor(userId, monitorId, monitorData)
  if (!monitor) throw new Error('Monitor not found or unauthorized')
  if (monitor.status === 'PAUSED' || monitor.status === 'PENDING') {
    await SignalCacheService.clearAlertLock(monitorId)
    return monitor
  }
}


module.exports = {
  checkAllActiveMonitors,
  createMonitor,
  updateMonitor,
  updateStatuesForMonitor,
  getMonitorsForUser,
  getMonitorByIdForUser,
  deleteMonitor,
  updateGlobalStatuesMonitor
}
