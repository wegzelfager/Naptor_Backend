const Incident = require('../../models/incidents.model')
const { findExistingIncident, createIncident, resolveIncident } = require('../repositories/incident.repositories')
const handleMonitorDown = async (monitorId, userId, errorMessage) => {
    const existingIncident = await findExistingIncident(monitorId, userId)
    if (!existingIncident) {
        await createIncident(monitorId, userId, errorMessage)
    }

}

const handleMonitorRecovery = async (monitorId, userId) => {
    const openIncident = await resolveIncident(monitorId, userId);
    if (!openIncident) {
        return null;
    }
    else {
        const now = new Date();
        const durationInSeconds = Math.round((now - openIncident.startedAt) / 1000);
        openIncident.duration = durationInSeconds;
        openIncident.resolvedAt = now;
        openIncident.status = 'RESOLVED';
        await openIncident.save();
        return openIncident;
    }
}

const calculateUptimePercentage = async (monitorId, days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const incidents = await Incident.find({
        monitor: monitorId,
        createdAt: { $gte: startDate }
    });

    const totalTimeInSeconds = days * 24 * 60 * 60;

    const totalDowntimeInSeconds = incidents.reduce((total, inc) => {
        const endTime = inc.resolvedAt || new Date();
        const incidentDuration = Math.round((endTime - inc.startedAt) / 1000);
        return total + incidentDuration;
    }, 0);

    const uptimeSeconds = Math.max(0, totalTimeInSeconds - totalDowntimeInSeconds);
    const uptimePercentage = ((uptimeSeconds / totalTimeInSeconds) * 100).toFixed(2);

    return parseFloat(uptimePercentage);
};
module.exports = {
    handleMonitorDown,
    handleMonitorRecovery,
    calculateUptimePercentage
}