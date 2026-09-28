const corn = require('node-cron');
const { checkAllActiveMonitors } = require('../signals/service/signal.service');

const startMonitorWorker = () => {
    console.log('[Naptor Signal] Background Worker Initialized...');
    corn.schedule('* * * * * ', async () => {
        try {
            await checkAllActiveMonitors();
        } catch (error) {
            console.error('[Signal Worker Error]:', error.message);
        }
    })
}

module.exports = { startMonitorWorker };