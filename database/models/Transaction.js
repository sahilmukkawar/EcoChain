// database/models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['collection_reward', 'marketplace_purchase', 'marketplace_sale', 'referral_bonus', 'promotional', 'other'],
    required: true
  },
  relatedEntityType: {
    type: String,
    enum: ['collection', 'product', 'user', 'system', 'other']
  },
  relatedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedEntityType'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'reversed'],
    default: 'completed',
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ transactionId: 1 }, { unique: true });
transactionSchema.index({ userId: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ createdAt: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ relatedEntityId: 1, relatedEntityType: 1 });

// Static method to create a new transaction
transactionSchema.statics.createTransaction = async function(transactionData) {
  // Generate a unique transaction ID
  const timestamp = new Date().getTime();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const transactionId = `TXN-${timestamp}-${randomStr}`;
  
  // Create the transaction
  const transaction = new this({
    transactionId,
    ...transactionData
  });
  
  await transaction.save();
  return transaction;
};

// Static method to get user's transaction history
transactionSchema.statics.getUserTransactionHistory = async function(userId, limit = 10, skip = 0, filter = {}) {
  const query = { userId, ...filter };
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get transaction statistics for a user
transactionSchema.statics.getUserTransactionStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    { $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Format the results
  const result = {
    credit: { totalAmount: 0, count: 0 },
    debit: { totalAmount: 0, count: 0 }
  };
  
  stats.forEach(stat => {
    result[stat._id] = {
      totalAmount: stat.totalAmount,
      count: stat.count
    };
  });
  
  return result;
};

// Static method to get transaction statistics by category
transactionSchema.statics.getTransactionStatsByCategory = async function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    { $group: {
        _id: { type: '$type', category: '$category' },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.type': 1, '_id.category': 1 } }
  ]);
};

module.exports = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);