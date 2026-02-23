const mongoose = require('mongoose');
const config = require('./index');
const LogUtil = require('../utils/logUtil');

function DBUtil() {
    const SELF = {
        connected: false,
    };

    return {
        connect: async () => {
            try {
                await mongoose.connect(config.mongoUri);
                SELF.connected = true;
                LogUtil.info('[DB] MongoDB connected');
            } catch (err) {
                LogUtil.error(`[DB] Connection error: ${err.message}`);
                process.exit(1);
            }
        },
    };
};

module.exports = DBUtil();