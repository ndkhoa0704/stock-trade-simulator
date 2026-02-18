const mongoose = require('mongoose');

const feeConfigSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        buyFeeRate: { type: Number, default: 0.0015 },
        sellFeeRate: { type: Number, default: 0.0015 },
        taxRate: { type: Number, default: 0.001 },
    },
    { timestamps: true }
);

module.exports = {
    FeeConfig: mongoose.model('FeeConfig', feeConfigSchema),
}