// database/models/SystemConfiguration.js
const mongoose = require('mongoose');

const systemConfigurationSchema = new mongoose.Schema({
  configType: {
    type: String,
    enum: ['token_rates', 'commission_rates', 'system_settings', 'notification_templates'],
    required: true,
    unique: true
  },
  tokenRates: {
    plastic: {
      rate: { type: Number, default: 10 },
      qualityMultiplier: {
        excellent: { type: Number, default: 1.5 },
        good: { type: Number, default: 1.2 },
        fair: { type: Number, default: 1.0 },
        poor: { type: Number, default: 0.7 }
      }
    },
    paper: {
      rate: { type: Number, default: 5 },
      qualityMultiplier: {
        excellent: { type: Number, default: 1.5 },
        good: { type: Number, default: 1.2 },
        fair: { type: Number, default: 1.0 },
        poor: { type: Number, default: 0.7 }
      }
    },
    metal: {
      rate: { type: Number, default: 15 },
      qualityMultiplier: {
        excellent: { type: Number, default: 1.5 },
        good: { type: Number, default: 1.2 },
        fair: { type: Number, default: 1.0 },
        poor: { type: Number, default: 0.7 }
      }
    },
    glass: {
      rate: { type: Number, default: 8 },
      qualityMultiplier: {
        excellent: { type: Number, default: 1.5 },
        good: { type: Number, default: 1.2 },
        fair: { type: Number, default: 1.0 },
        poor: { type: Number, default: 0.7 }
      }
    },
    electronic: {
      rate: { type: Number, default: 20 },
      qualityMultiplier: {
        excellent: { type: Number, default: 1.5 },
        good: { type: Number, default: 1.2 },
        fair: { type: Number, default: 1.0 },
        poor: { type: Number, default: 0.7 }
      }
    },
    organic: {
      rate: { type: Number, default: 3 },
      qualityMultiplier: {
        excellent: { type: Number, default: 1.5 },
        good: { type: Number, default: 1.2 },
        fair: { type: Number, default: 1.0 },
        poor: { type: Number, default: 0.7 }
      }
    }
  },
  businessRules: {
    platformCommission: { type: Number, default: 7.5 }, // percentage
    factoryPartnershipFee: { type: Number, default: 25000 }, // monthly fee
    tokenToMoneyConversion: { type: Number, default: 0.1 }, // 1 token = 0.1 rupees
    minimumOrderValue: { type: Number, default: 100 },
    maxTokenUsagePercentage: { type: Number, default: 30 }
  },
  systemLimits: {
    maxCollectionWeight: { type: Number, default: 100 }, // kg
    maxTokensPerDay: { type: Number, default: 1000 },
    minWithdrawalAmount: { type: Number, default: 50 }
  },
  notifications: {
    emailTemplates: {
      welcome: {
        subject: String,
        body: String
      },
      collectionScheduled: {
        subject: String,
        body: String
      },
      tokensEarned: {
        subject: String,
        body: String
      },
      orderConfirmed: {
        subject: String,
        body: String
      }
    },
    smsTemplates: {
      otp: String,
      collectionReminder: String,
      deliveryUpdate: String
    },
    pushNotificationSettings: {
      enabled: { type: Boolean, default: true },
      categories: [String]
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
systemConfigurationSchema.index({ configType: 1 }, { unique: true });

module.exports = mongoose.models.SystemConfiguration || mongoose.model('SystemConfiguration', systemConfigurationSchema);
