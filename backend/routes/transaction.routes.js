const express = require('express');
const transactionController = require('../controllers/transaction.controller')();
const authMiddleware = require('../middleware/auth')();

module.exports = function () {
  const router = express.Router();

  router.get('/:portfolioId/transactions', authMiddleware, transactionController.list);
  router.post('/:portfolioId/transactions', authMiddleware, transactionController.create);
  router.delete('/:portfolioId/transactions/:id', authMiddleware, transactionController.delete);
  router.get('/:portfolioId/holdings', authMiddleware, transactionController.getHoldings);

  return router;
};
