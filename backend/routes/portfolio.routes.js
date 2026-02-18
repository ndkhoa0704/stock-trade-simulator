const express = require('express');
const portfolioController = require('../controllers/portfolio.controller')();
const authMiddleware = require('../middleware/auth')();

module.exports = function () {
  const router = express.Router();

  router.get('/', authMiddleware, portfolioController.list);
  router.post('/', authMiddleware, portfolioController.create);
  router.get('/:id', authMiddleware, portfolioController.getOne);
  router.put('/:id', authMiddleware, portfolioController.update);
  router.delete('/:id', authMiddleware, portfolioController.delete);

  return router;
};
