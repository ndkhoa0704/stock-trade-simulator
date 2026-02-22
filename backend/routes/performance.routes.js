const express = require('express');
const performanceController = require('../controllers/performance.controller');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/:id/performance', authMiddleware, performanceController.getHistory);
router.get('/:id/statistics', authMiddleware, performanceController.getStatistics);

module.exports = router;
