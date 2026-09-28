const Incident = require('../../models/incidents.model')
const findExistingIncident = async (monitorId, userId) => {
    return await Incident.findOne({
        monitor: monitorId,
        user: userId,
        status: 'OPEN'
    });
}
const createIncident = async (monitorId, userId, cause) => {
    return await Incident.create({
        monitor: monitorId,
        user: userId,
        cause: cause || 'Service Unavailable',
        startedAt: new Date()
    })
}

const resolveIncident = async (monitorId, userId) => {
    return await Incident.findOneAndUpdate(
        { monitor: monitorId, user: userId, status: 'OPEN' },
        { status: 'RESOLVED', resolvedAt: new Date() },
        { new: true }
    );
}

const findAllIncidentsByUserAndMonitor = async (monitorId, userId, page, limit) => {
    return await Incident.find({
        monitor: monitorId,
        user: userId
    })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
}

const totalIncidentsByUserAndMonitor = async (monitorId, userId) => {
    return await Incident.countDocuments({
        monitor: monitorId,
        user: userId
    });
}

const findAllIncidentsByUser = async (userId, page = 1, limit = 10) => {
    return await Incident.find({ user: userId })
        .populate('monitor', 'name url type status')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
}

const totalIncidentsByUser = async (userId) => {
    return await Incident.countDocuments({ user: userId });
}
const deleteIncidentsByUserAndMonitor = async (monitorId, userId) => {
    return await Incident.deleteMany({
        monitor: monitorId,
        user: userId
    });
}

module.exports = {
    findExistingIncident,
    createIncident,
    resolveIncident,
    findAllIncidentsByUserAndMonitor,
    totalIncidentsByUserAndMonitor,
    findAllIncidentsByUser,
    totalIncidentsByUser, 
    deleteIncidentsByUserAndMonitor
}
