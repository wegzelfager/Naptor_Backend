const Heartbeat = require('../../models/Heartbeat.model');
class HeartbeatRepository {
    static async create(heartbeatData) {
        return await Heartbeat.create(heartbeatData);
    }

    static async findByMonitorId(monitorId, limit = 50) {
        return await Heartbeat.find({ monitor: monitorId }).sort({ createdAt: -1 }).limit(limit).lean();
    }

    static async deleteMany(query) {
        return await Heartbeat.deleteMany(query);
    }
}
module.exports = HeartbeatRepository;