# Plan: Portfolio Performance Tracking & Analytics Charts

## Context

Cần thêm tính năng theo dõi hiệu suất portfolio theo thời gian (Time-Weighted Return) và hiển thị các chỉ số phân tích rủi ro (Beta, Standard Deviation, Variance) trên giao diện chart. Dữ liệu benchmark (VN-Index) sẽ được lưu trong một collection riêng.

---

## Phase 1: Backend - Model & Data Layer

### 1.1 Thêm MarketIndex model vào `backend/models/market.js`

Thêm schema `MarketIndex` cùng file với `StockPrice`:

```js
const marketIndexSchema = new mongoose.Schema({
    indexCode: { type: String, required: true, uppercase: true, trim: true }, // e.g. 'VNINDEX'
    date: { type: Date, required: true },
    open: Number,
    high: Number,
    low: Number,
    close: { type: Number, required: true },
    volume: Number,
});
marketIndexSchema.index({ indexCode: 1, date: 1 }, { unique: true });
marketIndexSchema.index({ indexCode: 1, date: -1 });
```

Export cả `StockPrice` và `MarketIndex` từ file này.

### 1.2 Tạo model `PortfolioSnapshot` - file mới `backend/models/portfolioSnapshot.js`

```js
{
    portfolioId: ObjectId -> Portfolio,
    userId: ObjectId -> User,
    date: Date,
    totalMarketValue: Number,     // tổng giá trị thị trường
    totalCostBasis: Number,       // tổng giá vốn
    dailyReturn: Number,          // TWR daily return (sub-period return)
    cumulativeTWR: Number,        // cumulative TWR tính đến ngày này
    holdings: [{                  // snapshot holdings tại thời điểm
        stockCode: String,
        shares: Number,
        avgCostPerShare: Number,
        marketPrice: Number,
        marketValue: Number,
    }]
}
// Index unique: { portfolioId, date }
```

### 1.3 Thêm `statisticsWindow` vào FeeConfig model (`backend/models/feeConfig.js`)

Thêm field:
```js
statisticsWindow: { type: Number, default: 90 }  // số ngày để tính beta, std, variance
```

---

## Phase 2: Backend - Scheduled Job

### 2.1 Tạo job file `backend/jobs/portfolio.js`

Job `jobSavePortfolioPerformance`:
1. Lấy tất cả portfolios
2. Với mỗi portfolio, lấy holdings hiện tại (dùng `costCalculator.calcHoldings`)
3. Lấy giá hiện tại của từng mã từ StockPrice (latest date)
4. Tính `totalMarketValue = Σ(shares × currentPrice)`
5. Lấy snapshot ngày hôm trước (nếu có) để tính daily return theo TWR:
   - `dailyReturn = (todayValue / yesterdayValue) - 1` (nếu không có cash flow)
   - Khi có BUY/SELL trong ngày: dùng sub-period method
6. Tính `cumulativeTWR = (1 + prevTWR) × (1 + dailyReturn) - 1`
7. Lưu `PortfolioSnapshot`

### 2.2 Thêm job fetch index vào `backend/jobs/market.js`

Thêm function `jobSaveMarketIndex` vào MarketJob:
- Fetch dữ liệu VNINDEX từ VNDirect API
- Lưu vào collection `MarketIndex`

### 2.3 Đăng ký jobs trong `backend/services/scheduler.service.js`

```js
// Thêm 2 job mới
{
    cron: '0 23 * * 1-5',  // 11PM Mon-Fri
    name: 'portfolio_performance',
    func: PortfolioJob.jobSavePortfolioPerformance
},
{
    cron: '0 18 * * 1-5',  // 6PM Mon-Fri (sau khi thị trường đóng)
    name: 'market_index',
    func: MarketJob.jobSaveMarketIndex
}
```

---

## Phase 3: Backend - API Endpoints

### 3.1 Tạo `backend/services/performance.service.js`

Functions:
- `getPerformanceHistory(userId, portfolioId, days)` - trả về danh sách PortfolioSnapshot
- `getStatistics(userId, portfolioId, window)` - tính và trả về:
  - **Beta**: `Cov(Rp, Rm) / Var(Rm)` so với VNINDEX
  - **Variance**: `Var(dailyReturn)`
  - **Std Dev**: `√Variance`
  - Lấy daily returns từ PortfolioSnapshot và MarketIndex trong `window` ngày

### 3.2 Tạo `backend/controllers/performance.controller.js`

- `getHistory(req, res)` - GET `/api/portfolios/:id/performance`
- `getStatistics(req, res)` - GET `/api/portfolios/:id/statistics?window=90`

### 3.3 Tạo `backend/routes/performance.routes.js`

```
GET /api/portfolios/:id/performance?days=90
GET /api/portfolios/:id/statistics?window=90
```

Mount trong `backend/routes/index.js`.

### 3.4 Cập nhật FeeConfig API

Cập nhật `feeConfig.service.js` và `feeConfig.controller.js` để hỗ trợ read/write `statisticsWindow`.

---

## Phase 4: Frontend - Chart Library & Components

### 4.1 Cài đặt Chart.js

```bash
npm install chart.js vue-chartjs
```

### 4.2 Tạo component `frontend/src/components/PerformanceChart.vue`

- Line chart hiển thị cumulative TWR theo thời gian
- X axis: date, Y axis: return %
- Có thể chọn khoảng thời gian (30d, 90d, 180d, 1y, all)

### 4.3 Tạo component `frontend/src/components/StatisticsPanel.vue`

- Hiển thị 3 card/metric: Beta, Std Dev, Variance
- Fetch data từ API `/api/portfolios/:id/statistics?window=X`
- Window lấy từ settings (statisticsWindow)

### 4.4 Tạo view `frontend/src/views/PerformanceView.vue`

- Route: `/portfolio/:id/performance`
- Bao gồm: PerformanceChart + StatisticsPanel
- Thêm link từ PortfolioView sang PerformanceView

### 4.5 Cập nhật SettingsView

Thêm section mới trong `SettingsView.vue` với input "Statistics Window (days)" - số ngày để tính beta, std, variance. Lưu vào FeeConfig.

### 4.6 Cập nhật Router

Thêm route `/portfolio/:id/performance` vào `frontend/src/router/index.js`.

---

## Files to Create
- `backend/models/portfolioSnapshot.js`
- `backend/jobs/portfolio.js`
- `backend/services/performance.service.js`
- `backend/controllers/performance.controller.js`
- `backend/routes/performance.routes.js`
- `frontend/src/views/PerformanceView.vue`
- `frontend/src/components/PerformanceChart.vue`
- `frontend/src/components/StatisticsPanel.vue`

## Files to Modify
- `backend/models/market.js` — thêm MarketIndex schema
- `backend/models/feeConfig.js` — thêm statisticsWindow field
- `backend/jobs/market.js` — thêm jobSaveMarketIndex
- `backend/services/scheduler.service.js` — đăng ký 2 job mới
- `backend/services/feeConfig.service.js` — hỗ trợ statisticsWindow
- `backend/controllers/feeConfig.controller.js` — hỗ trợ statisticsWindow
- `backend/routes/index.js` — mount performance routes
- `frontend/package.json` — thêm chart.js, vue-chartjs
- `frontend/src/router/index.js` — thêm route performance
- `frontend/src/views/SettingsView.vue` — thêm statistics window input
- `frontend/src/views/PortfolioView.vue` — thêm link đến performance page
- `frontend/src/components/FeeConfigForm.vue` — thêm statisticsWindow field

---

## Verification

1. Chạy `npm install` ở frontend (chart.js, vue-chartjs)
2. Restart backend, verify 2 job mới được đăng ký trong scheduler
3. Manually trigger job portfolio performance (hoặc chờ 11PM)
4. Vào Settings, verify input Statistics Window hiển thị đúng
5. Vào Portfolio → Performance, verify chart TWR hiển thị
6. Verify statistics panel hiển thị Beta, Std Dev, Variance
