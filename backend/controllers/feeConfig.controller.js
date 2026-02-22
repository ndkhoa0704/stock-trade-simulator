const feeConfigService = require('../services/feeConfig.service');

function feeConfigController() {
    return {
        get: async function get(req, res, next) {
            try {
                const config = await feeConfigService.get(req.user.id);
                res.json({ feeConfig: config });
            } catch (err) {
                next(err);
            }
        },

        update: async function update(req, res, next) {
            try {
                const { buyFeeRate, sellFeeRate, taxRate, statisticsWindow } = req.body;
                const config = await feeConfigService.update(req.user.id, { buyFeeRate, sellFeeRate, taxRate, statisticsWindow });
                res.json({ feeConfig: config });
            } catch (err) {
                next(err);
            }
        },
    };
}

module.exports = feeConfigController();
