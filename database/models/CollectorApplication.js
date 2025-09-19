// database/models/CollectorApplication.js
const mongoose = require('mongoose');

const collectorApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  serviceArea: [{
    type: String,
    required: true
  }],
  vehicleDetails: {
    type: String,
    required: true
  },
  licenseNumber: {
    type: String,
    required: true
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
    licenseCertificate: { type: String }, // URL to uploaded document
    insuranceCertificate: { type: String }, // URL to uploaded document
    idProof: { type: String } // URL to uploaded document
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
collectorApplicationSchema.index({ userId: 1 });
collectorApplicationSchema.index({ licenseNumber: 1 });
collectorApplicationSchema.index({ status: 1 });
collectorApplicationSchema.index({ submittedAt: -1 });

module.exports = mongoose.models.CollectorApplication || mongoose.model('CollectorApplication', collectorApplicationSchema);