// routes/ecoTokenRoutes.js
const express = require('express');
const router = express.Router();
const { User, EcoTokenTransaction, GarbageCollection } = require('../database/models');
const { authenticate } = require('../middleware/auth');

// Get user's token balance and wallet info
router.get('/wallet', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('ecoWallet sustainabilityScore');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        wallet: user.ecoWallet,
        sustainabilityScore: user.sustainabilityScore
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get token transaction history
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    
    const filters = { userId: req.user.id };
    if (type) filters.transactionType = type;

    const transactions = await EcoTokenTransaction.getUserTransactions(
      req.user.id, 
      parseInt(page), 
      parseInt(limit)
    );
    
    const total = await EcoTokenTransaction.countDocuments(filters);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create EcoToken transaction
const createTransaction = async (req, res) => {
  try {
    const { userId, type, tokens, description, referenceId } = req.body;
    
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize ecoWallet if it doesn't exist
    if (!user.ecoWallet) {
      user.ecoWallet = {
        currentBalance: 0,
        totalEarned: 0,
        totalSpent: 0
      };
    }

    // Update wallet based on transaction type
    if (type === 'earned') {
      user.ecoWallet.currentBalance += tokens;
      user.ecoWallet.totalEarned += tokens;
    } else if (type === 'spent') {
      if (user.ecoWallet.currentBalance < tokens) {
        return res.status(400).json({ message: 'Insufficient token balance' });
      }
      user.ecoWallet.currentBalance -= tokens;
      user.ecoWallet.totalSpent += tokens;
    } else if (type === 'transfer') {
      // Handle transfers
      const { recipientId } = req.body;
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return res.status(404).json({ message: 'Recipient not found' });
      }
      
      if (user.ecoWallet.currentBalance < tokens) {
        return res.status(400).json({ message: 'Insufficient token balance' });
      }
      
      // Deduct from sender
      user.ecoWallet.currentBalance -= tokens;
      user.ecoWallet.totalSpent += tokens;
      
      // Add to recipient
      if (!recipient.ecoWallet) {
        recipient.ecoWallet = {
          currentBalance: 0,
          totalEarned: 0,
          totalSpent: 0
        };
      }
      recipient.ecoWallet.currentBalance += tokens;
      recipient.ecoWallet.totalEarned += tokens;
      
      // Save recipient
      await recipient.save();
    }

    // Save user
    await user.save();

    // Create transaction record
    const transaction = new EcoTokenTransaction({
      transactionId: 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase(),
      userId,
      transactionType: type,
      details: {
        amount: tokens,
        monetaryValue: tokens * 2, // Updated to 1 token = ₹2
        description,
        referenceId
      },
      metadata: {
        source: 'manual_transaction',
        category: 'admin_adjustment'
      },
      walletBalance: {
        beforeTransaction: user.ecoWallet.currentBalance,
        afterTransaction: type === 'earned' ? user.ecoWallet.currentBalance - tokens : user.ecoWallet.currentBalance + tokens
      }
    });

    await transaction.save();

    res.status(201).json(transaction);
  } catch (error) {
    logger.error('Error creating EcoToken transaction:', error);
    res.status(500).json({ message: 'Failed to create transaction', error: error.message });
  }
};

// Award tokens for garbage collection (Internal use)
router.post('/award', authenticate, async (req, res) => {
  try {
    if (!['admin', 'collector'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { userId, collectionId, tokens, reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const collection = await GarbageCollection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    // Award tokens
    const transactionDetails = await user.addTokens(tokens, reason);
    
    // Create transaction record
    await EcoTokenTransaction.createTransaction({
      userId: userId,
      transactionType: 'earned',
      details: {
        amount: tokens,
        monetaryValue: tokens * 2, // Updated to 1 token = ₹2
        description: reason,
        referenceId: collection.collectionId
      },
      metadata: {
        source: 'garbage_collection',
        relatedEntity: collection._id,
        entityType: 'GarbageCollection'
      },
      walletBalance: {
        beforeTransaction: transactionDetails.balanceAfter - tokens,
        afterTransaction: transactionDetails.balanceAfter
      }
    });

    // Update sustainability score
    await user.updateSustainabilityScore(Math.floor(tokens / 10));

    res.json({
      success: true,
      message: 'Tokens awarded successfully',
      data: {
        tokensAwarded: tokens,
        newBalance: user.ecoWallet.currentBalance,
        sustainabilityScore: user.sustainabilityScore
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get token earning opportunities
router.get('/opportunities', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get user's recent collections
    const recentCollections = await GarbageCollection.find({ 
      userId: req.user.id 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('collectionDetails tokenCalculation status createdAt');

    // Calculate potential earnings based on material types
    const materialRates = {
      plastic: 10,
      paper: 5,
      metal: 15,
      glass: 8,
      electronic: 20,
      organic: 3
    };

    const opportunities = [
      {
        type: 'daily_collection',
        title: 'Daily Waste Collection',
        description: 'Submit recyclable waste daily to earn consistent tokens',
        potentialTokens: '10-50 tokens',
        requirements: ['Clean, sorted waste', 'Minimum 1kg weight']
      },
      {
        type: 'quality_bonus',
        title: 'Quality Bonus',
        description: 'Get extra tokens for excellent quality waste',
        potentialTokens: '+50% bonus',
        requirements: ['Clean materials', 'Proper sorting', 'Good condition']
      },
      {
        type: 'referral',
        title: 'Refer Friends',
        description: 'Earn tokens when friends join EcoChain',
        potentialTokens: '100 tokens per referral',
        requirements: ['Friend must complete first collection']
      }
    ];

    res.json({
      success: true,
      data: {
        currentBalance: user.ecoWallet.currentBalance,
        recentCollections,
        materialRates,
        opportunities
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Calculate potential tokens for waste submission
router.post('/calculate', authenticate, async (req, res) => {
  try {
    const { materialType, weight, quality = 'fair' } = req.body;

    const baseRates = {
      plastic: 10,
      paper: 5,
      metal: 15,
      glass: 8,
      electronic: 20,
      organic: 3
    };

    const qualityMultipliers = {
      excellent: 1.5,
      good: 1.2,
      fair: 1.0,
      poor: 0.7
    };

    const baseRate = baseRates[materialType] || baseRates.plastic;
    const qualityMultiplier = qualityMultipliers[quality] || 1.0;
    const estimatedTokens = Math.floor(baseRate * weight * qualityMultiplier);

    res.json({
      success: true,
      data: {
        materialType,
        weight,
        quality,
        baseRate,
        qualityMultiplier,
        estimatedTokens,
        monetaryValue: estimatedTokens * 2 // Updated to 1 token = ₹2
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
