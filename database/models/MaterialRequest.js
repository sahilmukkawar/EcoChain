// database/models/MaterialRequest.js
const mongoose = require('mongoose');

const materialRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  factoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Factory',
    required: true
  },
  materialSpecs: {
    materialType: {
      type: String,
      enum: ['plastic', 'paper', 'metal', 'glass', 'electronic', 'organic', 'textile', 'rubber'],
      required: true
    },
    subType: {
      type: String
    },
    quantity: {
      type: Number, // in kg/tons
      required: true
    },
    qualityRequirements: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent'],
      default: 'fair'
    },
    specifications: {
      purity: Number,
      color: String,
      size: String,
      additionalRequirements: [String]
    }
  },
  timeline: {
    requestDate: {
      type: Date,
      default: Date.now
    },
    requiredBy: {
      type: Date,
      required: true
    },
    flexibilityDays: {
      type: Number,
      default: 7
    }
  },
  pricing: {
    budgetPerKg: {
      type: Number,
      required: true
    },
    totalBudget: {
      type: Number,
      required: true
    },
    paymentTerms: {
      type: String,
      enum: ['advance', 'on_delivery', '15_days', '30_days'],
      default: 'on_delivery'
    }
  },
  logistics: {
    deliveryAddress: {
      type: String,
      required: true
    },
    transportationMode: {
      type: String,
      enum: ['pickup', 'delivery', 'both'],
      default: 'pickup'
    },
    specialHandling: {
      type: String
    }
  },
  status: {
    type: String,
    enum: ['open', 'partially_filled', 'fulfilled', 'expired', 'cancelled'],
    default: 'open'
  },
  matchedCollections: [{
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GarbageCollection'
    },
    quantity: Number,
    agreedPrice: Number,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'delivered'],
      default: 'pending'
    }
  }],
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes
materialRequestSchema.index({ requestId: 1 }, { unique: true });
materialRequestSchema.index({ factoryId: 1 });
materialRequestSchema.index({ 'materialSpecs.materialType': 1 });
materialRequestSchema.index({ status: 1 });
materialRequestSchema.index({ 'timeline.requiredBy': 1 });

// Pre-save middleware to generate requestId
materialRequestSchema.pre('save', function(next) {
  if (!this.requestId) {
    this.requestId = 'MR' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

// Method to add matched collection
materialRequestSchema.methods.addMatchedCollection = async function(collectionId, quantity, agreedPrice) {
  this.matchedCollections.push({
    collectionId,
    quantity,
    agreedPrice,
    status: 'pending'
  });
  
  // Update status based on fulfillment
  const totalMatched = this.matchedCollections.reduce((sum, match) => sum + match.quantity, 0);
  if (totalMatched >= this.materialSpecs.quantity) {
    this.status = 'fulfilled';
  } else {
    this.status = 'partially_filled';
  }
  
  await this.save();
};

module.exports = mongoose.models.MaterialRequest || mongoose.model('MaterialRequest', materialRequestSchema);
