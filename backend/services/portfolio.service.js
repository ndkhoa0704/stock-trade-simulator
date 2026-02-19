const { Portfolio } = require('../models/Portfolio');
const { Transaction } = require('../models/Transaction');

function PortfolioService() {
    return {
        list: async (userId) => {
            return Portfolio.find({ userId }).sort({ createdAt: -1 });
        },

        create: async (userId, { name }) => {
            if (!name) {
                const err = new Error('name is required');
                err.status = 400;
                throw err;
            }
            try {
                return await Portfolio.create({ userId, name });
            } catch (err) {
                if (err.code === 11000) {
                    const e = new Error('Portfolio name already exists');
                    e.status = 409;
                    throw e;
                }
                throw err;
            }
        },

        getOne: async (userId, portfolioId) => {
            const portfolio = await Portfolio.findOne({ _id: portfolioId, userId });
            if (!portfolio) {
                const err = new Error('Portfolio not found');
                err.status = 404;
                throw err;
            }
            return portfolio;
        },

        update: async (userId, portfolioId, { name }) => {
            const portfolio = await Portfolio.findOneAndUpdate(
                { _id: portfolioId, userId },
                { name },
                { new: true, runValidators: true }
            );
            if (!portfolio) {
                const err = new Error('Portfolio not found');
                err.status = 404;
                throw err;
            }
            return portfolio;
        },

        delete: async (userId, portfolioId) => {
            const portfolio = await Portfolio.findOneAndDelete({ _id: portfolioId, userId });
            if (!portfolio) {
                const err = new Error('Portfolio not found');
                err.status = 404;
                throw err;
            }
            await Transaction.deleteMany({ portfolioId });
            return portfolio;
        },
    };
};

module.exports = PortfolioService();