// routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const transactionController = require('../controllers/transactionController');

// Create a new transaction
router.post('/', authenticate, transactionController.createTransaction);

// Get all transactions for the authenticated user
router.get('/', authenticate, transactionController.getUserTransactions);

// Get a single transaction by ID
router.get('/:id', authenticate, transactionController.getTransactionById);

// Get transaction history
router.get('/history', authenticate, transactionController.getTransactionHistory);

module.exports = router;