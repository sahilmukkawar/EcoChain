// database/models/CollectorApplication.js
const mongoose = require('mongoose');

const collectorApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  contactName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  serviceArea: [{
    type: String,
    trim: true
  }],
  idDocumentUrl: {
    type: String,
    trim: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
collectorApplicationSchema.index({ userId: 1 });
collectorApplicationSchema.index({ email: 1 });
collectorApplicationSchema.index({ status: 1 });
collectorApplicationSchema.index({ submittedAt: -1 });

module.exports = mongoose.models.CollectorApplication || mongoose.model('CollectorApplication', collectorApplicationSchema);