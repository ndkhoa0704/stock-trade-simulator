const performanceService = require('../services/performance.service');

function PerformanceController() {
    return {
        getHistory: async (req, res, next) => {
            try {
                const { days } = req.query;
                const history = await performanceService.getPerformanceHistory(req.user.id, req.params.id, days || 90);
                res.json({ history });
            } catch (err) {
                next(err);
            }
        },

        getStatistics: async (req, res, next) => {
            try {
                const { window } = req.query;
                const statistics = await performanceService.getStatistics(req.user.id, req.params.id, window || 90);
                res.json({ statistics });
            } catch (err) {
                next(err);
            }
        },
    };
}

module.exports = PerformanceController();
