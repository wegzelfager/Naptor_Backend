const { createClient } = require('redis');
const env = require('./env');

const redisClient = createClient({
    url: env.redis_url
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Connected Successfully!'));

(async () => {
    await redisClient.connect();
})();

module.exports = redisClient;