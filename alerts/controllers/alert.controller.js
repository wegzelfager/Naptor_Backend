const { catchAllAlerts, alertEmitter } = require('../services/alert.service');

const getAllAlerts = async (req, res) => {
    const userId = req.user.id || req.user._id;
    try {
        const alerts = await catchAllAlerts(userId);
        res.status(200).json({ success: true, message: 'Alerts fetched', data: alerts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

const streamAlertsController = (req, res) => {
    const userId = String(req.user.id || req.user._id);

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();

    res.write('event: connected\n');
    res.write('data: ' + JSON.stringify({ type: 'CONNECTED', userId: userId, timestamp: new Date() }) + '\n\n');

    const heartbeat = setInterval(function() {
        res.write(': heartbeat\n\n');
    }, 20000);

    function onAlert(payload) {
        const auid = String(payload.userId?._id || payload.userId || payload.user?._id || payload.user || '');
        if (!auid || auid === userId) {
            res.write('event: alert\n');
            res.write('data: ' + JSON.stringify(payload) + '\n\n');
        }
    }

    alertEmitter.on('new_alert', onAlert);
    console.log('[SSE] Client connected userId=' + userId + ' listeners=' + alertEmitter.listenerCount('new_alert'));

    req.on('close', function() {
        clearInterval(heartbeat);
        alertEmitter.off('new_alert', onAlert);
        console.log('[SSE] Client disconnected userId=' + userId);
    });
};

module.exports = { getAllAlerts, streamAlertsController };
