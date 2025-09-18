// database/models/FactoryApplication.js
const mongoose = require('mongoose');

const factoryApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  factoryName: {
    type: String,
    required: true,
    trim: true
  },
  ownerName: {
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
  address: {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true }
  },
  gstNumber: {
    type: String,
    required: true,
    trim: true
  },
  licenseDocumentUrl: {
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
factoryApplicationSchema.index({ userId: 1 });
factoryApplicationSchema.index({ email: 1 });
factoryApplicationSchema.index({ status: 1 });
factoryApplicationSchema.index({ submittedAt: -1 });

module.exports = mongoose.models.FactoryApplication || mongoose.model('FactoryApplication', factoryApplicationSchema);