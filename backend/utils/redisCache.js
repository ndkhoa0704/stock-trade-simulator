const redisConfig = require('../config/redis')();

module.exports = function RedisUtil() {
    const SELF = {
        getClient: () => {
            return redisConfig.getClient();
        },
    };

    return {
        get: async (key) => {
            const client = SELF.getClient();
            if (!client) return null;
            const value = await client.get(key);
            return value ? JSON.parse(value) : null;
        },

        set: async (key, value, ttlSeconds = 60) => {
            const client = SELF.getClient();
            if (!client) return;
            await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        },

        del: async (key) => {
            const client = SELF.getClient();
            if (!client) return;
            await client.del(key);
        },

        delPattern: async (pattern) => {
            const client = SELF.getClient();
            if (!client) return;
            const keys = await client.keys(pattern);
            if (keys.length > 0) {
                await client.del(...keys);
            }
        },
    };
};
