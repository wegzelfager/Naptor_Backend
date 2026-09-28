const alert = require('../../src/models/alerts.model');

const getAlertsHistory = async (userId) => {
    const alerts = await alert.find({ userId })
        .populate("monitorId", 'name url host')
        .sort({ createdAt: -1 })
        .limit(50);
    return alerts;
};

const createAlert = async (alertData) => {
    const newAlert = await alert.create(alertData);
    return await alert.findById(newAlert._id).populate("monitorId", 'name url host');
};

module.exports = {
    getAlertsHistory,
    createAlert,
};
