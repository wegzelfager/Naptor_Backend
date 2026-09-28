const {
    findAllIncidentsByUserAndMonitor,
    totalIncidentsByUserAndMonitor,
    findAllIncidentsByUser,
    totalIncidentsByUser
} = require('../repositories/incident.repositories');
const { calculateUptimePercentage } = require('../service/incident.service');

const getAllUserIncidents = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;

        const incidents = await findAllIncidentsByUser(userId, page, limit);
        const total = await totalIncidentsByUser(userId);
        const pages = Math.ceil(total / limit) || 1;

        res.status(200).json({
            success: true,
            message: 'User incidents retrieved successfully',
            data: incidents,
            pagination: {
                total,
                page,
                pages
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMonitorIncidents = async (req, res) => {
    try {
        const { monitorId } = req.params;
        const userId = req.user.id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;

        const incidents = await findAllIncidentsByUserAndMonitor(monitorId, userId, page, limit);
        const uptimePercentage = await calculateUptimePercentage(monitorId);
        const totalIncidents = await totalIncidentsByUserAndMonitor(monitorId, userId);
        const totalPages = Math.ceil(totalIncidents / limit) || 1;

        res.status(200).json({
            success: true,
            message: 'Incidents retrieved successfully',
            data: incidents,
            uptimePercentage: uptimePercentage,
            totalIncidents: totalIncidents,
            pagination: {
                total: totalIncidents,
                page: page,
                pages: totalPages
            }
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

const getMonitorUptimeStats = async (req, res) => {
    try {
        const { monitorId } = req.params;

        const [uptime24h, uptime7d, uptime30d] = await Promise.all([
            calculateUptimePercentage(monitorId, 1),
            calculateUptimePercentage(monitorId, 7),
            calculateUptimePercentage(monitorId, 30)
        ]);

        res.status(200).json({
            success: true,
            data: {
                '24h': uptime24h,
                '7d': uptime7d,
                '30d': uptime30d
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = {
    getAllUserIncidents,
    getMonitorIncidents,
    getMonitorUptimeStats
}