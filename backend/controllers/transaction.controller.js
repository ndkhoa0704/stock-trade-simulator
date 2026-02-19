const transactionService = require('../services/transaction.service');

function TransactionController() {
    return {
        list: async (req, res, next) => {
            try {
                const { stockCode, type, page, limit } = req.query;
                const result = await transactionService.list(req.user.id, req.params.portfolioId, {
                    stockCode,
                    type,
                    page: Number(page) || 1,
                    limit: Number(limit) || 20,
                });
                res.json(result);
            } catch (err) {
                next(err);
            }
        },

        create: async (req, res, next) => {
            try {
                const tx = await transactionService.create(req.user.id, req.params.portfolioId, req.body);
                res.status(201).json({ transaction: tx });
            } catch (err) {
                next(err);
            }
        },

        delete: async (req, res, next) => {
            try {
                await transactionService.delete(req.user.id, req.params.portfolioId, req.params.id);
                res.json({ message: 'Transaction deleted' });
            } catch (err) {
                next(err);
            }
        },

        getHoldings: async (req, res, next) => {
            try {
                const holdings = await transactionService.getHoldings(req.user.id, req.params.portfolioId);
                res.json({ holdings });
            } catch (err) {
                next(err);
            }
        },
    };
};

module.exports = TransactionController();