const { StockPrice, MarketIndex } = require('../models/market');
const timeUtil = require('../utils/timeUtil');

function MarketJob() {
    const SELF = {
        INDEX_CODES: ['VNINDEX', 'HNX', 'UPCOM', 'VN30', 'HNX30'],
        FETCH_CONCURRENCY: 3,

        getUrl: async (url) => {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
            return res.json();
        },

        asyncPool: async (concurrency, items, fn) => {
            const results = [];
            const executing = new Set();
            for (const item of items) {
                const p = Promise.resolve().then(() => fn(item));
                results.push(p);
                executing.add(p);
                p.finally(() => executing.delete(p));
                if (executing.size >= concurrency) {
                    await Promise.race(executing);
                }
            }
            return Promise.all(results);
        },

        fetchAllPages: async (dateStr) => {
            const apiUrl = 'https://api-finfo.vndirect.com.vn/v4/stock_prices';
            const PAGE_SIZE = 5000;
            const MAX_PAGES = 50;
            const all = [];

            for (let page = 1; page <= MAX_PAGES; page++) {
                const url = new URL(apiUrl);
                url.searchParams.append('size', String(PAGE_SIZE));
                url.searchParams.append('page', String(page));
                url.searchParams.append('q', `date:${dateStr}`);

                const res = await fetch(url.toString());
                if (!res.ok) throw new Error(`HTTP ${res.status} fetching page ${page}`);

                const json = await res.json();
                const rows = Array.isArray(json?.data) ? json.data : [];
                all.push(...rows);

                if (rows.length < PAGE_SIZE) break;
            }

            return all;
        },
    };

    return {
        jobSaveStockPrice: async (dateStr) => {
            console.log(`[MarketJob] jobSaveStockPrice start: ${dateStr}`);

            const raw = await SELF.fetchAllPages(dateStr);

            if (!raw || raw.length === 0) {
                console.log(`[MarketJob] No stock price data for ${dateStr}`);
                return [];
            }

            const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

            const docs = raw
                .filter(d => d?.code && d?.close != null)
                .map(d => ({
                    stockCode: String(d.code).trim().toUpperCase(),
                    price: Number(d.close) * 1000,
                    date: targetDate,
                    open: d.open != null ? Number(d.open) * 1000 : undefined,
                    high: d.high != null ? Number(d.high) * 1000 : undefined,
                    low: d.low != null ? Number(d.low) * 1000 : undefined,
                    close: Number(d.close) * 1000,
                    volume: d.nmVolume != null ? Math.round(Number(d.nmVolume)) : undefined,
                }));

            await StockPrice.deleteMany({ date: targetDate });
            await StockPrice.insertMany(docs, { ordered: false });

            console.log(`[MarketJob] jobSaveStockPrice done: inserted ${docs.length} records for ${dateStr}`);
            return docs;
        },

        jobSaveMarketIndex: async (dateStr) => {
            if (!dateStr || typeof dateStr !== 'string') {
                dateStr = timeUtil.convertDateToStr(new Date(), 'YYYY-MM-DD');
            }
            console.log(`[MarketJob] jobSaveMarketIndex start: ${dateStr}`);

            try {
                const codes = SELF.INDEX_CODES;

                const results = await SELF.asyncPool(SELF.FETCH_CONCURRENCY, codes, async (code) => {
                    const url = `https://api-finfo.vndirect.com.vn/v4/vnmarket_prices?q=code:${code}~date:${dateStr}&size=9999&sort=date`;
                    try {
                        const data = await SELF.getUrl(url);
                        return { code, rows: Array.isArray(data?.data) ? data.data : [] };
                    } catch (e) {
                        console.error(`[MarketJob] Failed to get index ${code}: ${e.message}`);
                        return { code, rows: [] };
                    }
                });

                const allData = results.flatMap(r => r.rows);

                if (allData.length === 0) {
                    console.log(`[MarketJob] No market index data for date ${dateStr} (skip upsert)`);
                    return [];
                }

                // Dedupe by (date, code)
                const byKey = new Map();
                for (const d of allData) {
                    if (!d?.date || !d?.code) continue;
                    byKey.set(`${d.date}|${d.code}`, d);
                }
                const uniqueData = [...byKey.values()];

                const ops = uniqueData.map(d => {
                    const targetDate = new Date(`${d.date}T00:00:00.000Z`);
                    const doc = {
                        indexCode: String(d.code).trim().toUpperCase(),
                        date: targetDate,
                        open: d.open != null ? Number(d.open) : undefined,
                        high: d.high != null ? Number(d.high) : undefined,
                        low: d.low != null ? Number(d.low) : undefined,
                        close: Number(d.close),
                        floor: d.floor != null ? Number(d.floor) : undefined,
                        change: d.change != null ? Number(d.change) : undefined,
                        pctChange: d.pctChange != null ? Number(d.pctChange) : undefined,
                        accumulatedVol: d.accumulatedVol != null ? Number(d.accumulatedVol) : undefined,
                        accumulatedVal: d.accumulatedVal != null ? Number(d.accumulatedVal) : undefined,
                        nmVolume: d.nmVolume != null ? Number(d.nmVolume) : undefined,
                        nmValue: d.nmValue != null ? Number(d.nmValue) : undefined,
                        ptVolume: d.ptVolume != null ? Number(d.ptVolume) : undefined,
                        ptValue: d.ptValue != null ? Number(d.ptValue) : undefined,
                        advances: d.advances != null ? Number(d.advances) : undefined,
                        declines: d.declines != null ? Number(d.declines) : undefined,
                        noTrade: d.noTrade != null ? Number(d.noTrade) : undefined,
                        noChange: d.noChange != null ? Number(d.noChange) : undefined,
                        ceilingStocks: d.ceilingStocks != null ? Number(d.ceilingStocks) : undefined,
                        floorStocks: d.floorStocks != null ? Number(d.floorStocks) : undefined,
                    };
                    return {
                        updateOne: {
                            filter: { indexCode: doc.indexCode, date: targetDate },
                            update: { $set: doc },
                            upsert: true,
                        },
                    };
                });

                await MarketIndex.bulkWrite(ops, { ordered: false });

                const failedCount = results.filter(r => r.rows.length === 0).length;
                if (failedCount > 0) {
                    console.warn(`[MarketJob] jobSaveMarketIndex: ${failedCount}/${codes.length} codes returned empty or failed for ${dateStr}`);
                }
                console.log(`[MarketJob] jobSaveMarketIndex done: upserted ${uniqueData.length} records for ${dateStr}`);
                return uniqueData;
            } catch (error) {
                console.error(`[MarketJob] jobSaveMarketIndex error: ${error.stack}`);
                return Promise.reject(error);
            }
        },
    };
}

module.exports = MarketJob();