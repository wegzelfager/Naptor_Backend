const axios = require("axios");
const HeartbeatRepository = require("../repositories/heartbeat.repository");
const MonitorRepository = require("../repositories/monitor.repository");
const SignalCacheService = require("./signalCache.service");
const { sendDownAlert, sendUpAlert } = require("../../services/email.service");
const { handleMonitorDown, handleMonitorRecovery } = require("../../incidents/service/incident.service");
const { createAndEmitAlert } = require("../../../alerts/services/alert.service");

class PingerService {
    static async ping(monitor) {
        const startTime = process.hrtime();
        let status = 'DOWN';
        let statusCode = null;
        let responseTime = 0;
        let errorMessage = null;

        try {
            const response = await axios.get(monitor.url, {
                timeout: monitor.timeout || 5000,
                headers: {
                    "User-Agent": 'Naptor-Signal-Uptime-Bot/1.0',
                    "Accept": monitor.type === 'API' ? 'application/json' : '*/*'
                },
                validateStatus: (s) => s >= 200 && s < 300
            });

            const contentType = (response.headers['content-type'] || '').toLowerCase();
            if (contentType.includes('text/html') && monitor.type === 'API') {
                status = "DOWN";
                statusCode = 418;
                errorMessage = "API Monitor received HTML content";
            } else {
                status = "UP";
                statusCode = response.status;
            }

            const endTime = process.hrtime(startTime);
            responseTime = Math.round((endTime[0] * 1000) + (endTime[1] / 1e6));
            console.log(`[DEBUG PING] URL: ${monitor.url} | Status Code Received: ${response.status}`);

        } catch (err) {
            const endTime = process.hrtime(startTime);
            responseTime = Math.round((endTime[0] * 1000) + (endTime[1] / 1e6));
            status = "DOWN";
            statusCode = err.response ? err.response.status : null;
            errorMessage = err.code ? `${err.code}: ${err.message}` : err.message;
        }


        await HeartbeatRepository.create({
            monitor: monitor._id,
            status,
            statusCode: (statusCode && !isNaN(Number(statusCode))) ? Number(statusCode) : null,
            responseTime: (responseTime && !isNaN(Number(responseTime))) ? Number(responseTime) : 0,
            error: errorMessage || null
        });


        await MonitorRepository.updateStatus(monitor._id, {
            status,
            lastResponseTime: responseTime,
        });


        const cacheData = {
            monitorId: monitor._id,
            status,
            statusCode,
            responseTime,
            lastChecked: new Date()
        };

        await SignalCacheService.setMonitorStatus(monitor._id, cacheData);
        await SignalCacheService.pushRecentLatency(monitor._id, responseTime);

        console.log(`[PINGER DEBUG] Monitor: ${monitor.name} | Status: ${status} | User: ${JSON.stringify(monitor.user)}`);

        if (status === "DOWN") {
            const userId = monitor.user?._id || monitor.user;
            
            await handleMonitorDown(monitor._id, userId, errorMessage);

            const userEmail = monitor.user?.email || monitor.userEmail;
            console.log(`[NOTIF CHECK] Status: "${status}" | User Email: "${userEmail}"`);
            
            const canSendAlert = await SignalCacheService.shouldSendAlert(monitor._id);
            console.log(`[ALERT LOCK] canSendAlert = ${canSendAlert} for monitor ${monitor._id}`);
            
            if (canSendAlert) {
                console.log(`[ALERT] Monitor ${monitor.name} (${monitor.url}) is DOWN!`);

                if (userId) {
                    await createAndEmitAlert({
                        userId,
                        monitorId: monitor._id,
                        type: 'DOWN',
                        message: errorMessage || 'Service unavailable or health check failed',
                        status: 'SENT',
                        statusCode,
                        responseTime
                    });
                }

                if (monitor.user?.email) {
                    await sendDownAlert({
                        userEmail: monitor.user.email,
                        monitorName: monitor.name,
                        monitorUrl: monitor.url,
                        error: errorMessage,
                        time: new Date().toISOString()
                    });
                }
            }
        } else {
            const userId = monitor.user?._id || monitor.user;
            await handleMonitorRecovery(monitor._id, userId);

            const wasDown = await SignalCacheService.clearAlertLock(monitor._id);
            if (wasDown) {
                console.log(`[RECOVERED] Monitor ${monitor.name} (${monitor.url}) is back UP!`);

                if (userId) {
                    await createAndEmitAlert({
                        userId,
                        monitorId: monitor._id,
                        type: 'UP',
                        message: 'Service recovered and responding within thresholds',
                        status: 'SENT',
                        statusCode: statusCode || 200,
                        responseTime
                    });
                }

                if (monitor.user?.email && monitor.user?.sendEmail) {
                    await sendUpAlert({
                        userEmail: monitor.user.email,
                        monitorName: monitor.name,
                        monitorUrl: monitor.url,
                        time: new Date().toISOString()
                    });
                }
            }
        }

        return {
            monitorId: monitor._id,
            status,
            statusCode,
            responseTime,
            error: errorMessage,
            timestamp: new Date()
        };
    }
}

module.exports = PingerService;
