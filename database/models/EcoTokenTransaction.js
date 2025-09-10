// database/models/EcoTokenTransaction.js
const mongoose = require('mongoose');

const ecoTokenTransactionSchema = new mongoose.Schema({
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
  transactionType: {
    type: String,
    enum: ['earned', 'spent', 'bonus', 'penalty', 'refund'],
    required: true
  },
  details: {
    amount: {
      type: Number,
      required: true
    },
    monetaryValue: {
      type: Number, // equivalent money value
      required: true
    },
    description: {
      type: String,
      required: true
    },
    referenceId: {
      type: String // order/collection ID
    }
  },
  metadata: {
    source: {
      type: String,
      enum: ['garbage_collection', 'purchase', 'referral', 'bonus', 'penalty', 'refund'],
      required: true
    },
    category: {
      type: String
    },
    relatedEntity: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'metadata.entityType'
    },
    entityType: {
      type: String,
      enum: ['GarbageCollection', 'Order', 'User']
    }
  },
  walletBalance: {
    beforeTransaction: {
      type: Number,
      required: true
    },
    afterTransaction: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed', 'cancelled'],
    default: 'completed'
  },
  processedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
ecoTokenTransactionSchema.index({ transactionId: 1 }, { unique: true });
ecoTokenTransactionSchema.index({ userId: 1 });
ecoTokenTransactionSchema.index({ transactionType: 1 });
ecoTokenTransactionSchema.index({ 'metadata.source': 1 });
ecoTokenTransactionSchema.index({ status: 1 });
ecoTokenTransactionSchema.index({ createdAt: -1 });

// Pre-save middleware to generate transactionId
ecoTokenTransactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

// Static method to create a transaction
ecoTokenTransactionSchema.statics.createTransaction = async function(transactionData) {
  const transaction = new this(transactionData);
  await transaction.save();
  return transaction;
};

// Static method to get user's transaction history
ecoTokenTransactionSchema.statics.getUserTransactions = async function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.models.EcoTokenTransaction || mongoose.model('EcoTokenTransaction', ecoTokenTransactionSchema);
