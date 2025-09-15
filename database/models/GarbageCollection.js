// database/models/GarbageCollection.js
const mongoose = require('mongoose');

const garbageCollectionSchema = new mongoose.Schema({
  collectionId: {
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
  collectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  factoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  collectionDetails: {
    type: {
      type: String,
      enum: ['plastic', 'paper', 'metal', 'glass', 'electronic', 'organic', 'other'],
      required: true
    },
    subType: { type: String },
    weight: { type: Number },
    quality: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent']
    },
    images: [{ type: String }],
    description: { type: String }
  },
  visionInference: {
    material_type: { type: String },
    sub_type: { type: String },
    quality_score: { type: Number },
    inferenceId: { type: String }
  },
  location: {
    pickupAddress: { type: String }
    // Completely removed coordinates to avoid GeoJSON issues
  },
  scheduling: {
    requestedDate: { type: Date },
    scheduledDate: { type: Date },
    actualPickupDate: { type: Date },
    preferredTimeSlot: { type: String }
  },
  tokenCalculation: {
    baseRate: { type: Number },
    qualityMultiplier: { type: Number },
    bonusTokens: { type: Number },
    totalTokensIssued: { type: Number }
  },
  status: {
    type: String,
    enum: ['requested', 'scheduled', 'in_progress', 'collected', 'delivered', 'verified', 'rejected', 'completed'],
    default: 'requested',
    required: true
  },
  verification: {
    collectorNotes: { type: String },
    factoryFeedback: { type: String },
    qualityImages: [{ type: String }],
    rejectionReason: { type: String }
  },
  logistics: {
    estimatedPickupTime: { type: Date },
    actualPickupTime: { type: Date },
    deliveryToFactory: { type: Date },
    transportCost: { type: Number }
  },
  payment: {
    collectorPaid: { type: Boolean, default: false },
    collectorPaymentAmount: { type: Number },
    calculatedAmount: { type: Number },
    collectorPaymentDate: { type: Date },
    collectorPaymentMethod: { type: String },
    adminNotes: { type: String },
    paymentCalculation: { type: mongoose.Schema.Types.Mixed }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
garbageCollectionSchema.index({ collectionId: 1 }, { unique: true });
garbageCollectionSchema.index({ userId: 1 });
garbageCollectionSchema.index({ collectorId: 1 });
garbageCollectionSchema.index({ factoryId: 1 });
// garbageCollectionSchema.index({ 'location.coordinates': '2dsphere' }); // Temporarily disabled
garbageCollectionSchema.index({ status: 1 });
garbageCollectionSchema.index({ 'collectionDetails.type': 1 });
garbageCollectionSchema.index({ 'scheduling.scheduledDate': 1 });

// Pre-save middleware to update timestamps
garbageCollectionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to calculate tokens based on material type, weight, and quality
garbageCollectionSchema.methods.calculateTokens = function() {
  // Get base rates from environment variables
  const baseRates = {
    plastic: parseFloat(process.env.BASE_REWARD_PLASTIC || 10),
    paper: parseFloat(process.env.BASE_REWARD_PAPER || 5),
    metal: parseFloat(process.env.BASE_REWARD_METAL || 15),
    glass: parseFloat(process.env.BASE_REWARD_GLASS || 8),
    electronic: 20, // Default values if not in env
    organic: 3,
    other: 2
  };

  // Get quality multipliers from environment variables
  const qualityMultipliers = {
    excellent: parseFloat(process.env.QUALITY_MULTIPLIER_EXCELLENT || 1.5),
    good: parseFloat(process.env.QUALITY_MULTIPLIER_GOOD || 1.2),
    fair: parseFloat(process.env.QUALITY_MULTIPLIER_FAIR || 1.0),
    poor: parseFloat(process.env.QUALITY_MULTIPLIER_POOR || 0.7)
  };

  // Calculate base tokens based on material type and weight
  const materialType = this.collectionDetails.type;
  const weight = this.collectionDetails.weight || 1; // Default to 1 if weight not provided
  const baseRate = baseRates[materialType] || baseRates.other;
  const baseTokens = baseRate * weight;

  // Apply quality multiplier
  const quality = this.collectionDetails.quality || 'fair'; // Default to fair if quality not provided
  const qualityMultiplier = qualityMultipliers[quality] || qualityMultipliers.fair;

  // Calculate bonus tokens (could be based on user's sustainability score, collection frequency, etc.)
  // For now, just a simple bonus for consistent collectors
  const bonusTokens = 0; // This would be calculated based on business rules

  // Calculate total tokens
  const totalTokens = baseTokens * qualityMultiplier + bonusTokens;

  // Update token calculation fields
  this.tokenCalculation = {
    baseRate: baseRate,
    qualityMultiplier: qualityMultiplier,
    bonusTokens: bonusTokens,
    totalTokensIssued: totalTokens
  };

  return totalTokens;
};

// Method to update collection status
garbageCollectionSchema.methods.updateStatus = async function(newStatus, notes = '') {
  const validStatusTransitions = {
    requested: ['scheduled', 'rejected'],
    scheduled: ['in_progress', 'rejected'],
    in_progress: ['collected', 'rejected'],
    collected: ['delivered', 'rejected'],
    delivered: ['verified', 'rejected'],
    verified: ['completed'],
    rejected: [],
    completed: []
  };

  // Check if the status transition is valid
  if (!validStatusTransitions[this.status].includes(newStatus)) {
    throw new Error(`Invalid status transition from ${this.status} to ${newStatus}`);
  }

  // Update status
  this.status = newStatus;

  // Add notes based on the status
  if (newStatus === 'rejected') {
    this.verification.rejectionReason = notes;
  } else if (newStatus === 'collected') {
    this.verification.collectorNotes = notes;
    this.logistics.actualPickupTime = Date.now();
  } else if (newStatus === 'verified') {
    this.verification.factoryFeedback = notes;
  }

  // Save the updated document
  await this.save();
  return this;
};

// Static method to find nearby collections for collectors
garbageCollectionSchema.statics.findNearbyCollections = async function(longitude, latitude, maxDistance = 10000) {
  return this.find({
    status: 'scheduled',
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // in meters
      }
    }
  }).populate('userId', 'personalInfo.name personalInfo.phone');
};

module.exports = mongoose.models.GarbageCollection || mongoose.model('GarbageCollection', garbageCollectionSchema);