const { FeeConfig } = require('../models/feeConfig');

function FeeConfigService() {
    return {
        get: async (userId) => {
            let config = await FeeConfig.findOne({ userId });
            if (!config) {
                config = await FeeConfig.create({ userId });
            }
            return config;
        },

        update: async (userId, { buyFeeRate, sellFeeRate, taxRate, statisticsWindow }) => {
            const fields = {};
            if (buyFeeRate !== undefined) fields.buyFeeRate = buyFeeRate;
            if (sellFeeRate !== undefined) fields.sellFeeRate = sellFeeRate;
            if (taxRate !== undefined) fields.taxRate = taxRate;
            if (statisticsWindow !== undefined) fields.statisticsWindow = statisticsWindow;

            const config = await FeeConfig.findOneAndUpdate(
                { userId },
                fields,
                { new: true, upsert: true, runValidators: true }
            );
            return config;
        },
    };
};

module.exports = FeeConfigService();