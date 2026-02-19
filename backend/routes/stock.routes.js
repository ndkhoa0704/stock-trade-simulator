const express = require('express');
const stockController = require('../controllers/stock.controller')();
const authMiddleware = require('../middleware/auth')();

const router = express.Router();

router.get('/search', authMiddleware, stockController.search);
router.get('/:code/price', authMiddleware, stockController.getPrice);

module.exports = router;

