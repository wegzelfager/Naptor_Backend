const redisClient = require("../../config/redis");

class SignalCacheService {

    static async setMonitorStatus(monitorId, statusData) {
        const key = `naptor:signal:status:${monitorId}`;
        await redisClient.set(key, JSON.stringify(statusData), { EX: 60 * 5 })
    }

    static async getMonitorStatus(monitorId) {
        const key = `naptor:signal:status:${monitorId}`;
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    }

    static async pushRecentLatency(monitorId, responseTime) {
        const key = `naptor:signal:latency:${monitorId}`;
        await redisClient.lPush(key, String(responseTime));
        await redisClient.lTrim(key, 0, 19);
    }

    static async getRecentLatencies(monitorId) {
        const key = `naptor:signal:latency:${monitorId}`;
        const latencies = await redisClient.lRange(key, 0, -1);
        return latencies.map(Number).reverse();
    }

    static async shouldSendAlert(monitorId) {
        const key = `naptor:signal:alert:${monitorId}`;
        const exists = await redisClient.get(key);
        if (exists) return false;
        await redisClient.set(key, 'LOCKED', { EX: 60 * 30 })
        return true;
    }

    static async clearAlertLock(monitorId) {
        const key = `naptor:signal:alert:${monitorId}`;
        const existed = await redisClient.get(key);
        if (existed) {
            await redisClient.del(key);
            return true; 
        }
        return false;
    }

    static async del(monitorId) {
        const keys = [
            `naptor:signal:status:${monitorId}`,
            `naptor:signal:alert:${monitorId}`
        ];
        await Promise.all(keys.map(k => redisClient.del(k)));
    }

    static async delRecentLatency(monitorId) {
        await redisClient.del(`naptor:signal:latency:${monitorId}`);
    }

    static async clearMonitorCache(monitorId) {
        const keys = [
            `naptor:signal:status:${monitorId}`,
            `naptor:signal:latency:${monitorId}`,
            `naptor:signal:alert:${monitorId}`
        ];
        await Promise.all(keys.map(k => redisClient.del(k)));
    }
}

module.exports = SignalCacheService;