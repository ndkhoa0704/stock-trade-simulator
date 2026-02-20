const { Transaction } = require('../models/transaction');
const { Portfolio } = require('../models/portfolio');
const { FeeConfig } = require('../models/feeConfig');
const costCalculator = require('../utils/costCalculator');
const redisCache = require('../utils/redisCache');

function TransactionService() {
    const SELF = {
        cacheKey: (portfolioId) => {
            return `holdings:${portfolioId}`;
        },

        verifyPortfolio: async (userId, portfolioId) => {
            const portfolio = await Portfolio.findOne({ _id: portfolioId, userId });
            if (!portfolio) {
                const err = new Error('Portfolio not found');
                err.status = 404;
                throw err;
            }
            return portfolio;
        },
    };

    return {
        list: async (userId, portfolioId, { stockCode, type, page = 1, limit = 20 }) => {
            await SELF.verifyPortfolio(userId, portfolioId);

            const filter = { portfolioId, userId };
            if (stockCode) filter.stockCode = stockCode.toUpperCase();
            if (type) filter.type = type;

            const skip = (page - 1) * limit;
            const [transactions, total] = await Promise.all([
                Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
                Transaction.countDocuments(filter),
            ]);

            return { transactions, total, page, limit };
        },

        create: async (userId, portfolioId, { stockCode, type, price, volume }) => {
            await SELF.verifyPortfolio(userId, portfolioId);

            if (!stockCode || !type || price == null || volume == null) {
                const err = new Error('stockCode, type, price, volume are required');
                err.status = 400;
                throw err;
            }

            if (!['BUY', 'SELL'].includes(type)) {
                const err = new Error('type must be BUY or SELL');
                err.status = 400;
                throw err;
            }

            const feeConfig = await FeeConfig.findOne({ userId });
            const buyFeeRate = feeConfig ? feeConfig.buyFeeRate : 0.0015;
            const sellFeeRate = feeConfig ? feeConfig.sellFeeRate : 0.0015;
            const taxRate = feeConfig ? feeConfig.taxRate : 0.001;

            let totalCost;
            let feeRate;
            let appliedTaxRate = 0;

            if (type === 'BUY') {
                feeRate = buyFeeRate;
                const calc = costCalculator.calcBuy({ price, volume, buyFeeRate });
                totalCost = calc.totalCost;
            } else {
                feeRate = sellFeeRate;
                appliedTaxRate = taxRate;
                const calc = costCalculator.calcSell({ price, volume, sellFeeRate, taxRate });
                totalCost = calc.netProceeds;
            }

            const tx = await Transaction.create({
                portfolioId,
                userId,
                stockCode: stockCode.toUpperCase(),
                type,
                price,
                volume,
                feeRate,
                taxRate: appliedTaxRate,
                totalCost,
            });

            await redisCache.del(SELF.cacheKey(portfolioId));

            return tx;
        },

        delete: async (userId, portfolioId, transactionId) => {
            await SELF.verifyPortfolio(userId, portfolioId);

            const tx = await Transaction.findOneAndDelete({ _id: transactionId, portfolioId, userId });
            if (!tx) {
                const err = new Error('Transaction not found');
                err.status = 404;
                throw err;
            }

            await redisCache.del(SELF.cacheKey(portfolioId));

            return tx;
        },

        getHoldings: async (userId, portfolioId) => {
            await SELF.verifyPortfolio(userId, portfolioId);

            const cacheKey = SELF.cacheKey(portfolioId);
            const cached = await redisCache.get(cacheKey);
            if (cached) return cached;

            const transactions = await Transaction.find({ portfolioId, userId }).sort({ createdAt: 1 });
            const holdings = costCalculator.calcHoldings(transactions);

            await redisCache.set(cacheKey, holdings, 300);

            return holdings;
        },
    };
};

module.exports = TransactionService();