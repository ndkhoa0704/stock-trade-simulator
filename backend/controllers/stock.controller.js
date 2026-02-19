const stockService = require('../services/stock.service');

function StockController() {
    return {
        getPrice: async (req, res, next) => {
            try {
                const result = await stockService.getPrice(req.params.code);
                res.json(result);
            } catch (err) {
                next(err);
            }
        },

        search: async (req, res, next) => {
            try {
                const results = await stockService.search(req.query.q);
                res.json({ stocks: results });
            } catch (err) {
                next(err);
            }
        },
    };
}

module.exports = StockController();
