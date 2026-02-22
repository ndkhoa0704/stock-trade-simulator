const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/portfolios', require('./portfolio.routes'));
router.use('/portfolios', require('./transaction.routes'));
router.use('/stocks', require('./stock.routes'));
router.use('/settings/fees', require('./feeConfig.routes'));
router.use('/portfolios', require('./performance.routes'));

module.exports = router;