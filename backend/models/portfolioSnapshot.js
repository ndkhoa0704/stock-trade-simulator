const mongoose = require('mongoose');

const portfolioSnapshotSchema = new mongoose.Schema({
    portfolioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    totalMarketValue: { type: Number, required: true },
    totalCostBasis: { type: Number, required: true },
    dailyReturn: { type: Number, default: 0 },
    cumulativeTWR: { type: Number, default: 0 },
    holdings: [{
        stockCode: String,
        shares: Number,
        avgCostPerShare: Number,
        marketPrice: Number,
        marketValue: Number,
    }],
});

portfolioSnapshotSchema.index({ portfolioId: 1, date: 1 }, { unique: true });
portfolioSnapshotSchema.index({ portfolioId: 1, date: -1 });
portfolioSnapshotSchema.index({ userId: 1 });

module.exports = {
    PortfolioSnapshot: mongoose.model('PortfolioSnapshot', portfolioSnapshotSchema),
};
