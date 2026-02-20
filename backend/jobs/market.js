const { StockPrice } = require('../models/market');


function MarketJob() {
    const SELF = {
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
    };
}

module.exports = MarketJob();