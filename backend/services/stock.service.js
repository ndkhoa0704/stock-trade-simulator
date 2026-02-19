const { StockPrice } = require('../models/market');
const redisCache = require('../utils/redisCache');

module.exports = function StockService() {
    const SELF = {
        priceCacheKey: (code) => {
            return `stock:price:${code}`;
        },
    };

    return {
        getPrice: async (code) => {
            const stockCode = code.toUpperCase();
            const cacheKey = SELF.priceCacheKey(stockCode);

            const cached = await redisCache.get(cacheKey);
            if (cached) return cached;

            const record = await StockPrice.findOne({ stockCode }).sort({ date: -1 });
            if (!record) {
                const err = new Error(`No price data found for ${stockCode}`);
                err.status = 404;
                throw err;
            }

            const result = {
                stockCode: record.stockCode,
                price: record.price,
                date: record.date,
                open: record.open,
                high: record.high,
                low: record.low,
                close: record.close,
                volume: record.volume,
            };

            await redisCache.set(cacheKey, result, 60);

            return result;
        },

        search: async (q) => {
            if (!q || q.trim().length === 0) return [];

            const regex = new RegExp(q.trim(), 'i');
            const results = await StockPrice.aggregate([
                { $match: { stockCode: regex } },
                { $group: { _id: '$stockCode' } },
                { $sort: { _id: 1 } },
                { $limit: 20 },
                { $project: { _id: 0, stockCode: '$_id' } },
            ]);

            return results.map((r) => r.stockCode);
        },
    };
};
