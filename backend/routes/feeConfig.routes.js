const express = require('express');
const feeConfigController = require('../controllers/feeConfig.controller');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, feeConfigController.get);
router.put('/', authMiddleware, feeConfigController.update);

module.exports = router;