// database/models/AdminPayment.js
const mongoose = require('mongoose');

const adminPaymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    unique: true,
    trim: true
  },
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GarbageCollection',
    required: true
  },
  collectionDisplayId: {
    type: String,
    required: true,
    index: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['approved', 'rejected'],
    required: true
  },
  paymentDetails: {
    amount: {
      type: Number,
      required: function() { return this.action === 'approved'; }
    },
    currency: {
      type: String,
      default: 'INR'
    },
    paymentMethod: {
      type: String,
      enum: ['digital_transfer', 'bank_transfer', 'cash', 'upi', 'other'],
      required: function() { return this.action === 'approved'; }
    },
    calculation: {
      baseRate: Number,
      weight: Number,
      qualityMultiplier: Number,
      bonuses: Number,
      finalAmount: Number,
      breakdown: mongoose.Schema.Types.Mixed
    }
  },
  collectionDetails: {
    wasteType: {
      type: String,
      required: true
    },
    weight: {
      type: Number,
      required: true
    },
    quality: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent'],
      required: true
    },
    pickupDate: {
      type: Date,
      required: true
    },
    location: {
      pickupAddress: String
    }
  },
  adminNotes: {
    type: String,
    maxlength: 1000
  },
  rejectionReason: {
    type: String,
    required: function() { return this.action === 'rejected'; },
    maxlength: 500
  },
  metadata: {
    processingTime: {
      type: Number // time taken to process in seconds
    },
    browserInfo: {
      userAgent: String,
      ipAddress: String
    },
    systemInfo: {
      version: String,
      environment: String
    }
  },
  status: {
    type: String,
    enum: ['processed', 'pending_confirmation', 'confirmed', 'failed'],
    default: 'processed'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  processedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
adminPaymentSchema.index({ paymentId: 1 }, { unique: true });
adminPaymentSchema.index({ adminId: 1, createdAt: -1 });
adminPaymentSchema.index({ collectorId: 1, createdAt: -1 });
adminPaymentSchema.index({ action: 1, createdAt: -1 });
adminPaymentSchema.index({ 'paymentDetails.amount': 1 });
adminPaymentSchema.index({ 'collectionDetails.wasteType': 1 });
adminPaymentSchema.index({ status: 1 });
adminPaymentSchema.index({ collectionDisplayId: 1 });

// Pre-save middleware to generate payment ID and process metadata
adminPaymentSchema.pre('save', function(next) {
  if (this.isNew && !this.paymentId) {
    // Generate unique payment ID
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.paymentId = `AP-${timestamp}-${randomStr}`;
  }
  
  // Update processedAt timestamp
  this.processedAt = new Date();
  
  next();
});

// Static method to create a new admin payment record
adminPaymentSchema.statics.createPaymentRecord = async function(paymentData) {
  const payment = new this(paymentData);
  // Ensure pre-save middleware is triggered by explicitly calling save
  await payment.save();
  return payment;
};

// Static method to get admin payment history with filters
adminPaymentSchema.statics.getPaymentHistory = async function(filters = {}, options = {}) {
  const {
    adminId,
    collectorId,
    action,
    wasteType,
    dateFrom,
    dateTo,
    status,
    minAmount,
    maxAmount
  } = filters;
  
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = -1
  } = options;
  
  // Build query
  const query = {};
  
  if (adminId) query.adminId = adminId;
  if (collectorId) query.collectorId = collectorId;
  if (action) query.action = action;
  if (wasteType) query['collectionDetails.wasteType'] = wasteType;
  if (status) query.status = status;
  
  // Date range filter
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }
  
  // Amount range filter
  if (minAmount || maxAmount) {
    query['paymentDetails.amount'] = {};
    if (minAmount) query['paymentDetails.amount'].$gte = minAmount;
    if (maxAmount) query['paymentDetails.amount'].$lte = maxAmount;
  }
  
  // Execute query with pagination
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder };
  
  const [payments, total] = await Promise.all([
    this.find(query)
      .populate('adminId', 'personalInfo.name personalInfo.email')
      .populate('collectorId', 'personalInfo.name personalInfo.email personalInfo.phone')
      .populate('userId', 'personalInfo.name personalInfo.email')
      .populate('collectionId', 'collectionId status')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    this.countDocuments(query)
  ]);
  
  return {
    payments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to get payment statistics for admin dashboard
adminPaymentSchema.statics.getPaymentStatistics = async function(adminId = null, dateRange = {}) {
  const matchStage = {};
  
  if (adminId) matchStage.adminId = mongoose.Types.ObjectId(adminId);
  
  if (dateRange.from || dateRange.to) {
    matchStage.createdAt = {};
    if (dateRange.from) matchStage.createdAt.$gte = new Date(dateRange.from);
    if (dateRange.to) matchStage.createdAt.$lte = new Date(dateRange.to);
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        approvedPayments: {
          $sum: { $cond: [{ $eq: ['$action', 'approved'] }, 1, 0] }
        },
        rejectedPayments: {
          $sum: { $cond: [{ $eq: ['$action', 'rejected'] }, 1, 0] }
        },
        totalAmountPaid: {
          $sum: {
            $cond: [
              { $eq: ['$action', 'approved'] },
              '$paymentDetails.amount',
              0
            ]
          }
        },
        avgPaymentAmount: {
          $avg: {
            $cond: [
              { $eq: ['$action', 'approved'] },
              '$paymentDetails.amount',
              null
            ]
          }
        }
      }
    }
  ]);
  
  // Waste type breakdown
  const wasteTypeStats = await this.aggregate([
    { $match: { ...matchStage, action: 'approved' } },
    {
      $group: {
        _id: '$collectionDetails.wasteType',
        count: { $sum: 1 },
        totalAmount: { $sum: '$paymentDetails.amount' },
        avgAmount: { $avg: '$paymentDetails.amount' },
        totalWeight: { $sum: '$collectionDetails.weight' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
  
  return {
    overview: stats[0] || {
      totalPayments: 0,
      approvedPayments: 0,
      rejectedPayments: 0,
      totalAmountPaid: 0,
      avgPaymentAmount: 0
    },
    wasteTypeBreakdown: wasteTypeStats
  };
};

// Instance method to format payment record for display
adminPaymentSchema.methods.toDisplayFormat = function() {
  return {
    paymentId: this.paymentId,
    collectionId: this.collectionDisplayId,
    adminName: this.adminId?.personalInfo?.name || 'Unknown Admin',
    collectorName: this.collectorId?.personalInfo?.name || 'Unknown Collector',
    userName: this.userId?.personalInfo?.name || 'Unknown User',
    action: this.action,
    amount: this.action === 'approved' ? this.paymentDetails.amount : null,
    currency: this.paymentDetails.currency,
    wasteType: this.collectionDetails.wasteType,
    weight: this.collectionDetails.weight,
    quality: this.collectionDetails.quality,
    adminNotes: this.adminNotes,
    rejectionReason: this.rejectionReason,
    processedAt: this.processedAt,
    status: this.status
  };
};

module.exports = mongoose.models.AdminPayment || mongoose.model('AdminPayment', adminPaymentSchema);