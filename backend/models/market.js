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

const marketIndexSchema = new mongoose.Schema({
    indexCode: { type: String, required: true, uppercase: true, trim: true },
    date: { type: Date, required: true },
    open: Number,
    high: Number,
    low: Number,
    close: { type: Number, required: true },
    floor: Number,
    change: Number,
    pctChange: Number,
    accumulatedVol: Number,
    accumulatedVal: Number,
    nmVolume: Number,
    nmValue: Number,
    ptVolume: Number,
    ptValue: Number,
    advances: Number,
    declines: Number,
    noTrade: Number,
    noChange: Number,
    ceilingStocks: Number,
    floorStocks: Number,
});

marketIndexSchema.index({ indexCode: 1, date: 1 }, { unique: true });
marketIndexSchema.index({ indexCode: 1, date: -1 });

module.exports = {
    StockPrice: mongoose.model('StockPrice', stockPriceSchema),
    MarketIndex: mongoose.model('MarketIndex', marketIndexSchema),
}
