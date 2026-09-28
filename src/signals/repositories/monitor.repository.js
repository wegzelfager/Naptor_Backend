const Monitor = require('../../models/Monitor.model');

class MonitorRepository {
    static async create(userId, monitorData) {
        return await Monitor.create({
            ...monitorData,
            user: userId
        });
    }

    static async findById(id) {
        return await Monitor.findById(id);
    }


    static async findAllByUser(userId) {
        return await Monitor.find({ user: userId }).lean();
    }


    static async findByIdAndUser(monitorId, userId) {
        return await Monitor.findOne({ _id: monitorId, user: userId }).lean();
    }

    static async findActiveMonitors() {
        return await Monitor.find({
            isActive: true,
            status: { $ne: 'PAUSED' }
        })
            .populate('user', 'email')
            .lean();
    }

    static async deleteMonitorById(monitorId, userId) {
        return await Monitor.findOneAndDelete({
            _id: monitorId,
            user: userId
        });
    }


    static async updateStatus(monitorId, statusData) {
        const { status, lastResponseTime } = statusData;

        return await Monitor.findByIdAndUpdate(
            monitorId,
            {
                $set: {
                    status,
                    lastResponseTime,
                    lastChecked: new Date()
                }
            },
            { new: true }
        );
    }

    static async updateStatusForUser(monitorId, userId, updateData) {
        return await Monitor.findOneAndUpdate(
            { _id: monitorId, user: userId },
            { $set: updateData },
            { new: true }
        );
    }


    static async globalUpdateMoitor(userId, monitorId, monitorData) {
        try {
            const monitor = await Monitor.findOneAndUpdate({
                _id: monitorId,
                user: userId,
            },
                {
                    $set: {
                        ...monitorData,
                        updatedAt: new Date(),
                        user: userId
                    },
                },
                { new: true, runValidators: true })

            return monitor;
        }
        catch (error) {

        }
    }

}



module.exports = MonitorRepository; 
