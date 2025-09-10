// database/models/Analytics.js
const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  reportDate: {
    type: Date,
    required: true
  },
  reportType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true
  },
  platformMetrics: {
    totalUsers: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    totalCollectors: { type: Number, default: 0 },
    totalFactories: { type: Number, default: 0 },
    totalGarbageCollected: { type: Number, default: 0 }, // kg
    totalTokensIssued: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 }
  },
  environmentalImpact: {
    co2Saved: { type: Number, default: 0 }, // kg CO2 equivalent
    treesEquivalent: { type: Number, default: 0 },
    energySaved: { type: Number, default: 0 }, // kWh
    waterSaved: { type: Number, default: 0 } // liters
  },
  businessMetrics: {
    ordersPlaced: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    customerRetentionRate: { type: Number, default: 0 },
    factorySatisfactionScore: { type: Number, default: 0 }
  },
  topPerformers: {
    topUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    topCollectors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    topFactories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Factory'
    }],
    topProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }]
  },
  regionalData: [{
    region: String,
    metrics: {
      users: Number,
      collections: Number,
      revenue: Number,
      tokensIssued: Number
    }
  }]
}, {
  timestamps: true
});

// Indexes
analyticsSchema.index({ reportDate: 1, reportType: 1 }, { unique: true });
analyticsSchema.index({ reportType: 1 });

module.exports = mongoose.models.Analytics || mongoose.model('Analytics', analyticsSchema);
