const { FeeConfig } = require('../models/feeConfig');

module.exports = function FeeConfigService() {
    return {
        get: async (userId) => {
            let config = await FeeConfig.findOne({ userId });
            if (!config) {
                config = await FeeConfig.create({ userId });
            }
            return config;
        },

        update: async (userId, { buyFeeRate, sellFeeRate, taxRate }) => {
            const config = await FeeConfig.findOneAndUpdate(
                { userId },
                { buyFeeRate, sellFeeRate, taxRate },
                { new: true, upsert: true, runValidators: true }
            );
            return config;
        },
    };
};
