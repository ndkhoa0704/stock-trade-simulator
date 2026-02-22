const { Portfolio } = require('../models/portfolio');
const { Transaction } = require('../models/transaction');
const { StockPrice } = require('../models/market');
const { PortfolioSnapshot } = require('../models/portfolioSnapshot');
const costCalculator = require('../utils/costCalculator');
const timeUtil = require('../utils/timeUtil');

function PortfolioJob() {
    const SELF = {
        getTodayDateStr: () => {
            return timeUtil.convertDateToStr(new Date(), 'YYYY-MM-DD');
        },

        getLatestPrices: async (stockCodes) => {
            const prices = {};
            const records = await StockPrice.aggregate([
                { $match: { stockCode: { $in: stockCodes } } },
                { $sort: { date: -1 } },
                { $group: { _id: '$stockCode', price: { $first: '$price' } } },
            ]);
            for (const r of records) {
                prices[r._id] = r.price;
            }
            return prices;
        },

        calcDailyReturn: async (portfolioId, todayValue, todayDateStart, todayDateEnd) => {
            const prevSnapshot = await PortfolioSnapshot.findOne({
                portfolioId,
                date: { $lt: todayDateStart },
            }).sort({ date: -1 });

            if (!prevSnapshot || prevSnapshot.totalMarketValue === 0) {
                return 0;
            }

            const todayTxs = await Transaction.find({
                portfolioId,
                createdAt: { $gte: todayDateStart, $lt: todayDateEnd },
            });

            if (todayTxs.length === 0) {
                return (todayValue / prevSnapshot.totalMarketValue) - 1;
            }

            // Modified Dietz method for days with cash flows
            // BUY = positive contribution, SELL = negative contribution (withdrawal)
            const netCashFlow = todayTxs.reduce((sum, tx) => {
                if (tx.type === 'BUY') return sum + tx.totalCost;
                if (tx.type === 'SELL') return sum - tx.totalCost;
                return sum;
            }, 0);

            const denominator = prevSnapshot.totalMarketValue + netCashFlow * 0.5;
            if (denominator === 0) return 0;
            return (todayValue - prevSnapshot.totalMarketValue - netCashFlow) / denominator;
        },
    };

    return {
        jobSavePortfolioPerformance: async () => {
            const dateStr = SELF.getTodayDateStr();
            console.log(`[PortfolioJob] jobSavePortfolioPerformance start: ${dateStr}`);

            const todayDate = new Date(`${dateStr}T00:00:00.000Z`);
            const todayDateEnd = new Date(`${dateStr}T23:59:59.999Z`);

            const portfolios = await Portfolio.find({});
            let saved = 0;

            for (const portfolio of portfolios) {
                try {
                    const portfolioId = portfolio._id;
                    const userId = portfolio.userId;

                    const transactions = await Transaction.find({ portfolioId, userId }).sort({ createdAt: 1 });
                    if (transactions.length === 0) continue;

                    const holdings = costCalculator.calcHoldings(transactions);
                    if (holdings.length === 0) continue;

                    const stockCodes = holdings.map(h => h.stockCode);
                    const prices = await SELF.getLatestPrices(stockCodes);

                    let totalMarketValue = 0;
                    let totalCostBasis = 0;
                    const snapshotHoldings = [];

                    for (const h of holdings) {
                        const marketPrice = prices[h.stockCode] || 0;
                        const marketValue = h.shares * marketPrice;
                        totalMarketValue += marketValue;
                        totalCostBasis += h.totalCostBasis;
                        snapshotHoldings.push({
                            stockCode: h.stockCode,
                            shares: h.shares,
                            avgCostPerShare: h.avgCostPerShare,
                            marketPrice,
                            marketValue,
                        });
                    }

                    const dailyReturn = await SELF.calcDailyReturn(portfolioId, totalMarketValue, todayDate, todayDateEnd);

                    // Get the most recent snapshot before today to chain cumulative TWR
                    const prevSnapshot = await PortfolioSnapshot.findOne({
                        portfolioId,
                        date: { $lt: todayDate },
                    }).sort({ date: -1 });

                    const prevTWR = prevSnapshot ? prevSnapshot.cumulativeTWR : 0;
                    const cumulativeTWR = (1 + prevTWR) * (1 + dailyReturn) - 1;

                    await PortfolioSnapshot.findOneAndUpdate(
                        { portfolioId, date: todayDate },
                        {
                            portfolioId,
                            userId,
                            date: todayDate,
                            totalMarketValue,
                            totalCostBasis,
                            dailyReturn,
                            cumulativeTWR,
                            holdings: snapshotHoldings,
                        },
                        { upsert: true, new: true }
                    );

                    saved++;
                } catch (err) {
                    console.error(`[PortfolioJob] Error processing portfolio ${portfolio._id}:`, err.message);
                }
            }

            console.log(`[PortfolioJob] jobSavePortfolioPerformance done: saved ${saved} snapshots for ${dateStr}`);
        },
    };
}

module.exports = PortfolioJob();
