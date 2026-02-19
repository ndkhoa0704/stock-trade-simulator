const Redis = require('ioredis');
const config = require('./index');

function RedisUtil() {
    const SELF = {
        client: null,
    };

    return {
        connect: () => {
            SELF.client = new Redis(config.redisUrl, {
                lazyConnect: false,
                maxRetriesPerRequest: 3,
            });

            SELF.client.on('connect', () => console.log('[Redis] Connected'));
            SELF.client.on('error', (err) => console.error('[Redis] Error:', err.message));

            return SELF.client;
        },

        getClient: () => {
            return SELF.client;
        },
    };
};

module.exports = RedisUtil();