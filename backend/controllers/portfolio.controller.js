const portfolioService = require('../services/portfolio.service');

function PortfolioController() {
    return {
        list: async (req, res, next) => {
            try {
                const portfolios = await portfolioService.list(req.user.id);
                res.json({ portfolios });
            } catch (err) {
                next(err);
            }
        },

        create: async (req, res, next) => {
            try {
                const portfolio = await portfolioService.create(req.user.id, req.body);
                res.status(201).json({ portfolio });
            } catch (err) {
                next(err);
            }
        },

        getOne: async (req, res, next) => {
            try {
                const portfolio = await portfolioService.getOne(req.user.id, req.params.id);
                res.json({ portfolio });
            } catch (err) {
                next(err);
            }
        },

        update: async (req, res, next) => {
            try {
                const portfolio = await portfolioService.update(req.user.id, req.params.id, req.body);
                res.json({ portfolio });
            } catch (err) {
                next(err);
            }
        },

        delete: async (req, res, next) => {
            try {
                await portfolioService.delete(req.user.id, req.params.id);
                res.json({ message: 'Portfolio deleted' });
            } catch (err) {
                next(err);
            }
        },
    };
};

module.exports = PortfolioController();