const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        portfolioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        stockCode: { type: String, required: true, uppercase: true, trim: true },
        type: { type: String, enum: ['BUY', 'SELL'], required: true },
        price: { type: Number, required: true, min: 0 },
        volume: { type: Number, required: true, min: 1 },
        feeRate: { type: Number, required: true },
        taxRate: { type: Number, default: 0 },
        totalCost: { type: Number, required: true },
    },
    { timestamps: true }
);

transactionSchema.index({ portfolioId: 1, stockCode: 1 });

module.exports = {
    Transaction: mongoose.model('Transaction', transactionSchema)
}
