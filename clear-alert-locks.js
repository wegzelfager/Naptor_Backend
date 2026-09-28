/**
 * Run once: node clear-alert-locks.js
 * Clears all Naptor alert lock keys from Redis so the next DOWN event
 * will immediately trigger an email alert.
 */
require('dotenv').config();
const { createClient } = require('redis');

(async () => {
    const client = createClient({ url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' });
    await client.connect();

    const keys = await client.keys('naptor:signal:alert:*');
    if (keys.length === 0) {
        console.log('No alert locks found in Redis.');
    } else {
        await client.del(keys);
        console.log(`Cleared ${keys.length} alert lock(s):`, keys);
    }

    await client.disconnect();
})();
