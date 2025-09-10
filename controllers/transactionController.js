// controllers/transactionController.js
const Transaction = require('../database/models/Transaction');
const User = require('../database/models/User');
const logger = require('../utils/logger');

/**
 * Create a new transaction
 */
const createTransaction = async (req, res) => {
  try {
    const { type, amount, recipient, description, metadata } = req.body;
    const senderId = req.user.id;

    // Validate transaction
    if (type === 'transfer' && (!recipient || !amount)) {
      return res.status(400).json({ message: 'Recipient and amount are required for transfers' });
    }

    // Check if sender has sufficient balance for transfers
    if (type === 'transfer') {
      const sender = await User.findById(senderId);
      if (!sender || sender.tokenBalance < amount) {
        return res.status(400).json({ message: 'Insufficient token balance' });
      }

      // Update sender's balance
      await User.findByIdAndUpdate(senderId, { $inc: { tokenBalance: -amount } });
      
      // Update recipient's balance
      await User.findByIdAndUpdate(recipient, { $inc: { tokenBalance: amount } });
    }

    // Create transaction record
    const transaction = new Transaction({
      transactionType: type,
      amount,
      senderId,
      recipientId: recipient,
      description,
      metadata
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    logger.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Failed to create transaction', error: error.message });
  }
};

/**
 * Get all transactions for the authenticated user
 */
const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find transactions where user is either sender or recipient
    const transactions = await Transaction.find({
      $or: [{ senderId: userId }, { recipientId: userId }]
    }).sort({ createdAt: -1 });
    
    res.status(200).json(transactions);
  } catch (error) {
    logger.error('Error fetching user transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
};

/**
 * Get a single transaction by ID
 */
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Check if the user is part of this transaction
    const userId = req.user.id;
    if (transaction.senderId.toString() !== userId && transaction.recipientId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this transaction' });
    }
    
    res.status(200).json(transaction);
  } catch (error) {
    logger.error('Error fetching transaction:', error);
    res.status(500).json({ message: 'Failed to fetch transaction', error: error.message });
  }
};

/**
 * Get transaction history with pagination
 */
const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, type } = req.query;
    
    const query = {
      $or: [{ senderId: userId }, { recipientId: userId }]
    };
    
    // Filter by transaction type if provided
    if (type) {
      query.transactionType = type;
    }
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 }
    };
    
    const transactions = await Transaction.find(query)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .sort(options.sort);
    
    const total = await Transaction.countDocuments(query);
    
    res.status(200).json({
      transactions,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      totalTransactions: total
    });
  } catch (error) {
    logger.error('Error fetching transaction history:', error);
    res.status(500).json({ message: 'Failed to fetch transaction history', error: error.message });
  }
};

module.exports = {
  createTransaction,
  getUserTransactions,
  getTransactionById,
  getTransactionHistory
};