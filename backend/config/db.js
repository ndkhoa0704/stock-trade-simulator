const mongoose = require('mongoose');
const config = require('./index');

module.exports = function DBUtil() {
  const SELF = {
    connected: false,
  };

  return {
    connect: async () => {
      try {
        await mongoose.connect(config.mongoUri);
        SELF.connected = true;
        console.log('[DB] MongoDB connected');
      } catch (err) {
        console.error('[DB] Connection error:', err.message);
        process.exit(1);
      }
    },
  };
};
