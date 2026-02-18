# Stock Trading Simulator - Implementation Plan

## Context

Xây dựng từ đầu một hệ thống giả lập giao dịch cổ phiếu. Project hiện tại chỉ có file `CLAUDE.md`. Cần tạo toàn bộ backend (Node.js/Express) và frontend (Vue.js 3/Vite/Bootstrap 5) với MongoDB + Redis.

## Folder Structure

```
stock-trade-simulator/
├── .gitignore
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── server.js                       # Entry point - cluster mode
│   ├── app.js                          # Express app setup
│   ├── config/
│   │   ├── index.js                    # Load env, export config
│   │   ├── db.js                       # Mongoose connection
│   │   └── redis.js                    # Redis client
│   ├── models/
│   │   ├── User.js
│   │   ├── Portfolio.js
│   │   ├── Transaction.js
│   │   ├── StockPrice.js
│   │   └── FeeConfig.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── portfolio.controller.js
│   │   ├── transaction.controller.js
│   │   ├── stock.controller.js
│   │   └── feeConfig.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── portfolio.service.js
│   │   ├── transaction.service.js
│   │   ├── stock.service.js
│   │   └── feeConfig.service.js
│   ├── routes/
│   │   ├── index.js                    # Mount all route files
│   │   ├── auth.routes.js
│   │   ├── portfolio.routes.js
│   │   ├── transaction.routes.js
│   │   ├── stock.routes.js
│   │   └── feeConfig.routes.js
│   ├── middleware/
│   │   ├── auth.js                     # JWT verify
│   │   └── errorHandler.js
│   └── utils/
│       ├── costCalculator.js           # Tính giá vốn TB, fee, tax
│       └── redisCache.js               # Cache helpers (get/set/invalidate)
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.js
        ├── App.vue
        ├── router/index.js
        ├── stores/
        │   ├── auth.js
        │   └── portfolio.js
        ├── services/api.js             # Axios instance
        ├── views/
        │   ├── LoginView.vue
        │   ├── RegisterView.vue
        │   ├── DashboardView.vue
        │   ├── PortfolioView.vue
        │   └── SettingsView.vue
        └── components/
            ├── AppNavbar.vue
            ├── PortfolioCard.vue
            ├── TransactionForm.vue
            ├── TransactionTable.vue
            ├── HoldingSummary.vue
            └── FeeConfigForm.vue
```

## MongoDB Models

**User** - `username` (unique), `email` (unique), `passwordHash`, timestamps

**Portfolio** - `userId` (ref User), `name`, timestamps. Index unique `(userId, name)`

**Transaction** - `portfolioId` (ref Portfolio), `userId` (ref User), `stockCode` (uppercase), `type` (BUY/SELL), `price`, `volume`, `feeRate` (snapshot), `taxRate` (snapshot, chỉ SELL), `totalCost` (đã tính phí), `createdAt`. Index `(portfolioId, stockCode)`

**StockPrice** - `stockCode`, `price`, `date`, `open`, `high`, `low`, `close`, `volume`. Index unique `(stockCode, date)`

**FeeConfig** - `userId` (unique), `buyFeeRate` (default 0.15%), `sellFeeRate` (default 0.15%), `taxRate` (default 0.1%)

## Core Logic - Tính giá vốn

**Mua (BUY):**
- `grossCost = price * volume`
- `fee = grossCost * buyFeeRate`
- `totalCost = grossCost + fee`
- `avgCostPerShare = tổng totalCost các lệnh mua / tổng shares đang nắm`

**Bán (SELL):**
- `grossProceeds = price * volume`
- `fee = grossProceeds * sellFeeRate`
- `tax = grossProceeds * taxRate`
- `netProceeds = grossProceeds - fee - tax`
- Giá vốn trung bình không thay đổi khi bán, chỉ giảm số shares

**Tính holdings:** Replay toàn bộ transactions theo thời gian, cache kết quả trong Redis, invalidate khi có transaction mới.

Mỗi transaction snapshot lại `feeRate` và `taxRate` tại thời điểm giao dịch để đảm bảo lịch sử chính xác.

## API Endpoints

### Auth (`/api/auth`)
- `POST /register` - Đăng ký + tạo FeeConfig mặc định
- `POST /login` - Trả JWT trong httpOnly cookie
- `POST /logout` - Xóa cookie
- `GET /me` - Thông tin user hiện tại

### Portfolio (`/api/portfolios`) - cần auth
- `GET /` - Danh sách portfolios
- `POST /` - Tạo portfolio mới
- `GET /:id` - Chi tiết portfolio
- `PUT /:id` - Đổi tên
- `DELETE /:id` - Xóa portfolio + transactions

### Transaction (`/api/portfolios/:portfolioId/transactions`) - cần auth
- `GET /` - Danh sách transactions (filter stockCode, type, phân trang)
- `POST /` - Tạo giao dịch BUY/SELL `{ stockCode, type, price, volume }`
- `DELETE /:id` - Xóa transaction

### Holdings (`/api/portfolios/:id/holdings`) - cần auth
- `GET /` - Holdings tổng hợp: mã, số shares, giá vốn TB, giá hiện tại, lãi/lỗ

### Stock (`/api/stocks`) - cần auth
- `GET /:code/price` - Giá mới nhất (cache Redis 60s)
- `GET /search?q=` - Tìm mã cổ phiếu

### Fee Config (`/api/settings/fees`) - cần auth
- `GET /` - Lấy cấu hình phí hiện tại
- `PUT /` - Cập nhật `{ buyFeeRate, sellFeeRate, taxRate }`

## Frontend Pages

| Route | View | Mô tả |
|-------|------|-------|
| `/login` | LoginView | Form đăng nhập |
| `/register` | RegisterView | Form đăng ký |
| `/` | DashboardView | Danh sách portfolios dạng card, nút tạo mới |
| `/portfolio/:id` | PortfolioView | Holdings summary + form giao dịch + lịch sử |
| `/settings` | SettingsView | Cấu hình phí mua, phí bán, thuế |

## Authentication

- JWT lưu trong httpOnly cookie (SameSite=Strict)
- Middleware đọc `req.cookies.token`, verify JWT, gắn `req.user`
- Frontend dùng Axios với `withCredentials: true`
- Pinia store quản lý state auth

## Code Pattern

Tất cả service files tuân theo module pattern trong CLAUDE.md:
```javascript
module.exports = function () {
  const SELF = {
    // private helpers, shared variables
  };
  return {
    // public API
  };
};
```

## Implementation Order

1. **Scaffolding** - `.gitignore`, `backend/package.json` + dependencies, `frontend/` via Vite, config files
2. **Backend core** - `server.js` (cluster), `app.js` (Express), `config/` (db, redis, env), `routes/index.js`
3. **Utils** - `utils/costCalculator.js` (tính giá vốn, fee, tax), `utils/redisCache.js` (cache helpers)
4. **Models** - 5 Mongoose models
5. **Auth** - `services/auth.service.js`, `controllers/auth.controller.js`, `routes/auth.routes.js`, `middleware/auth.js`
6. **Fee Config** - `services/feeConfig.service.js`, `controllers/feeConfig.controller.js`, `routes/feeConfig.routes.js`
7. **Portfolio** - `services/portfolio.service.js`, `controllers/portfolio.controller.js`, `routes/portfolio.routes.js`
8. **Transaction** - `services/transaction.service.js`, `controllers/transaction.controller.js`, `routes/transaction.routes.js`
9. **Stock** - `services/stock.service.js`, `controllers/stock.controller.js`, `routes/stock.routes.js`
10. **Frontend foundation** - Vite config proxy, router, Axios, Pinia stores, Navbar
11. **Frontend auth** - Login + Register views
12. **Frontend core** - Dashboard, Portfolio detail (form + table + holdings), Settings

## Verification

1. Chạy `npm install` ở cả backend và frontend
2. Chạy backend: `node server.js` - verify cluster mode hoạt động
3. Chạy frontend: `npm run dev` - verify proxy tới backend
4. Test flow: Register -> Login -> Cấu hình phí -> Tạo portfolio -> Mua cổ phiếu -> Mua thêm (kiểm tra giá vốn TB) -> Bán -> Kiểm tra lãi/lỗ


## Code style
- Files are structured as modules, each files contain a function and that function is exposed
- Inside each function, there is a variable named SELF, and the function returns an object
	- The returned object contains functions exposed for external use