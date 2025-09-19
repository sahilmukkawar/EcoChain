// database/models/FactoryApplication.js
const mongoose = require('mongoose');

const factoryApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  factoryName: {
    type: String,
    required: true,
    trim: true
  },
  gstNumber: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'India' }
  },
  contactPerson: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  businessDetails: {
    establishedYear: { type: Number },
    website: { type: String },
    description: { type: String }
  },
  documents: {
    gstCertificate: { type: String }, // URL to uploaded document
    businessLicense: { type: String }, // URL to uploaded document
    environmentalCertificate: { type: String } // URL to uploaded document
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
factoryApplicationSchema.index({ userId: 1 });
factoryApplicationSchema.index({ gstNumber: 1 }, { unique: true });
factoryApplicationSchema.index({ status: 1 });
factoryApplicationSchema.index({ submittedAt: -1 });

module.exports = mongoose.models.FactoryApplication || mongoose.model('FactoryApplication', factoryApplicationSchema);