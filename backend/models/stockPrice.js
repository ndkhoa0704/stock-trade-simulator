const mongoose = require('mongoose');

const stockPriceSchema = new mongoose.Schema({
    stockCode: { type: String, required: true, uppercase: true, trim: true },
    price: { type: Number, required: true },
    date: { type: Date, required: true },
    open: Number,
    high: Number,
    low: Number,
    close: Number,
    volume: Number,
});

stockPriceSchema.index({ stockCode: 1, date: -1 });
stockPriceSchema.index({ stockCode: 1, date: 1 }, { unique: true });

module.exports = {
    StockPrice: mongoose.model('StockPrice', stockPriceSchema)
}
