const EventEmitter = require('events');
const { getAlertsHistory, createAlert } = require('../repositories/alerts.repositories');

const alertEmitter = new EventEmitter();
alertEmitter.setMaxListeners(200);

const catchAllAlerts = async (userId) => {
    try {
        const alerts = await getAlertsHistory(userId);
        return alerts || [];
    } catch (error) {
        console.error('[ALERT SERVICE ERROR]:', error.message);
        throw error;
    }
};

const createAndEmitAlert = async ({ userId, monitorId, type, message, status = 'SENT', statusCode, responseTime }) => {
    try {
        const savedAlert = await createAlert({
            userId,
            monitorId,
            type,
            message,
            status,
            statusCode: statusCode && !isNaN(Number(statusCode)) ? Number(statusCode) : undefined,
            responseTime: responseTime && !isNaN(Number(responseTime)) ? Number(responseTime) : 0
        });

        if (!savedAlert) return null;

        const payload = {
            _id: savedAlert._id,
            id: savedAlert._id,
            userId: savedAlert.userId,
            monitorId: savedAlert.monitorId,
            monitor: savedAlert.monitorId,
            monitorName: savedAlert.monitorId?.name || 'Monitor',
            targetUrl: savedAlert.monitorId?.url || '',
            type: savedAlert.type,
            status: savedAlert.type === 'UP' ? 'RECOVERED' : (savedAlert.type === 'LATENCY_HIGH' ? 'DEGRADED' : savedAlert.type),
            message: savedAlert.message,
            statusCode: savedAlert.statusCode,
            responseTime: savedAlert.responseTime,
            timestamp: savedAlert.createdAt,
            createdAt: savedAlert.createdAt
        };

        alertEmitter.emit('new_alert', payload);
        console.log(`[ALERT EMITTED] Emitted ${payload.type} alert for monitor: ${payload.monitorName}`);
        return savedAlert;
    } catch (error) {
        console.error('[ALERT SERVICE ERROR] Failed to create and emit alert:', error.message);
        return null;
    }
};

module.exports = { catchAllAlerts, createAndEmitAlert, alertEmitter };
