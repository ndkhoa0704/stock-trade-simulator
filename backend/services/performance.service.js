const { PortfolioSnapshot } = require('../models/portfolioSnapshot');
const { MarketIndex } = require('../models/market');
const { Portfolio } = require('../models/portfolio');

function PerformanceService() {
    const SELF = {
        verifyPortfolio: async (userId, portfolioId) => {
            const portfolio = await Portfolio.findOne({ _id: portfolioId, userId });
            if (!portfolio) {
                const err = new Error('Portfolio not found');
                err.status = 404;
                throw err;
            }
            return portfolio;
        },

        calcMean: (arr) => arr.reduce((s, v) => s + v, 0) / arr.length,

        calcVariance: (arr) => {
            if (arr.length < 2) return 0;
            const mean = SELF.calcMean(arr);
            return arr.reduce((s, v) => s + (v - mean) ** 2, 0) / (arr.length - 1);
        },

        calcCovariance: (arrA, arrB) => {
            if (arrA.length < 2) return 0;
            const meanA = SELF.calcMean(arrA);
            const meanB = SELF.calcMean(arrB);
            return arrA.reduce((s, v, i) => s + (v - meanA) * (arrB[i] - meanB), 0) / (arrA.length - 1);
        },
    };

    return {
        getPerformanceHistory: async (userId, portfolioId, days) => {
            await SELF.verifyPortfolio(userId, portfolioId);

            const limit = Math.min(Math.max(Number(days) || 90, 1), 3650);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - limit);

            const snapshots = await PortfolioSnapshot.find({
                portfolioId,
                userId,
                date: { $gte: startDate },
            })
                .select('date totalMarketValue totalCostBasis dailyReturn cumulativeTWR')
                .sort({ date: 1 });

            return snapshots;
        },

        getStatistics: async (userId, portfolioId, window) => {
            await SELF.verifyPortfolio(userId, portfolioId);

            const windowDays = Math.min(Math.max(Number(window) || 90, 2), 3650);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - windowDays);

            const [snapshots, marketData] = await Promise.all([
                PortfolioSnapshot.find({ portfolioId, userId, date: { $gte: startDate } })
                    .select('date dailyReturn')
                    .sort({ date: 1 }),
                MarketIndex.find({ indexCode: 'VNINDEX', date: { $gte: startDate } })
                    .select('date close')
                    .sort({ date: 1 }),
            ]);

            // Build market daily returns by date key (return[i] = change from day i-1 to day i)
            const marketReturnByDate = {};
            for (let i = 1; i < marketData.length; i++) {
                if (marketData[i - 1].close > 0) {
                    const dateKey = marketData[i].date.toISOString().split('T')[0];
                    marketReturnByDate[dateKey] = marketData[i].close / marketData[i - 1].close - 1;
                }
            }

            // Align portfolio and market returns by date
            const portfolioReturns = [];
            const marketReturns = [];

            for (const snap of snapshots) {
                const dateKey = snap.date.toISOString().split('T')[0];
                if (marketReturnByDate[dateKey] !== undefined) {
                    portfolioReturns.push(snap.dailyReturn);
                    marketReturns.push(marketReturnByDate[dateKey]);
                }
            }

            if (portfolioReturns.length < 2) {
                return { beta: null, variance: null, stdDev: null, dataPoints: portfolioReturns.length, window: windowDays };
            }

            const variance = SELF.calcVariance(portfolioReturns);
            const stdDev = Math.sqrt(variance);
            const varMarket = SELF.calcVariance(marketReturns);
            const beta = varMarket > 0
                ? SELF.calcCovariance(portfolioReturns, marketReturns) / varMarket
                : null;

            return { beta, variance, stdDev, dataPoints: portfolioReturns.length, window: windowDays };
        },
    };
}

module.exports = PerformanceService();
