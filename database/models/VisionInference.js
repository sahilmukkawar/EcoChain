// database/models/VisionInference.js
const mongoose = require('mongoose');

const visionInferenceSchema = new mongoose.Schema({
  inferenceId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GarbageCollection',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalImages: [{
    type: String,
    required: true
  }],
  processedImages: [{
    type: String
  }],
  results: {
    material_type: {
      type: String,
      enum: ['plastic', 'paper', 'metal', 'glass', 'electronic', 'organic', 'other'],
      required: true
    },
    sub_type: {
      type: String
    },
    quality_score: {
      type: Number,
      min: 0,
      max: 100
    },
    confidence_score: {
      type: Number,
      min: 0,
      max: 1
    },
    estimated_weight: {
      type: Number
    },
    recyclability_score: {
      type: Number,
      min: 0,
      max: 100
    },
    detected_objects: [{
      label: { type: String },
      confidence: { type: Number },
      bounding_box: {
        x: { type: Number },
        y: { type: Number },
        width: { type: Number },
        height: { type: Number }
      }
    }],
    contaminants: [{
      type: { type: String },
      severity: { type: String, enum: ['low', 'medium', 'high'] }
    }],
    additional_metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  modelVersion: {
    type: String,
    required: true
  },
  processingTime: {
    type: Number // in milliseconds
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  errorDetails: {
    message: { type: String },
    code: { type: String },
    timestamp: { type: Date }
  },
  verifiedByHuman: {
    type: Boolean,
    default: false
  },
  humanVerificationDetails: {
    verifierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date },
    notes: { type: String },
    adjustments: { type: mongoose.Schema.Types.Mixed }
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
visionInferenceSchema.index({ inferenceId: 1 }, { unique: true });
visionInferenceSchema.index({ collectionId: 1 });
visionInferenceSchema.index({ userId: 1 });
visionInferenceSchema.index({ 'results.material_type': 1 });
visionInferenceSchema.index({ status: 1 });
visionInferenceSchema.index({ createdAt: 1 });
visionInferenceSchema.index({ verifiedByHuman: 1 });

// Pre-save middleware to update timestamps
visionInferenceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to update inference status
visionInferenceSchema.methods.updateStatus = async function(newStatus, errorDetails = null) {
  this.status = newStatus;
  
  if (newStatus === 'failed' && errorDetails) {
    this.errorDetails = {
      message: errorDetails.message || 'Unknown error',
      code: errorDetails.code || 'UNKNOWN_ERROR',
      timestamp: Date.now()
    };
  }
  
  if (newStatus === 'completed') {
    // Calculate processing time if not already set
    if (!this.processingTime) {
      const startTime = this.createdAt.getTime();
      const endTime = Date.now();
      this.processingTime = endTime - startTime;
    }
  }
  
  await this.save();
  return this;
};

// Method to verify inference by human
visionInferenceSchema.methods.verifyByHuman = async function(verifierId, adjustments = {}, notes = '') {
  this.verifiedByHuman = true;
  this.humanVerificationDetails = {
    verifierId,
    timestamp: Date.now(),
    notes,
    adjustments
  };
  
  // Apply adjustments to results if provided
  if (adjustments.material_type) this.results.material_type = adjustments.material_type;
  if (adjustments.sub_type) this.results.sub_type = adjustments.sub_type;
  if (adjustments.quality_score) this.results.quality_score = adjustments.quality_score;
  if (adjustments.estimated_weight) this.results.estimated_weight = adjustments.estimated_weight;
  if (adjustments.recyclability_score) this.results.recyclability_score = adjustments.recyclability_score;
  
  await this.save();
  return this;
};

// Static method to get inference statistics
visionInferenceSchema.statics.getInferenceStats = async function(timeRange = {}) {
  const query = {};
  
  if (timeRange.start && timeRange.end) {
    query.createdAt = {
      $gte: new Date(timeRange.start),
      $lte: new Date(timeRange.end)
    };
  }
  
  return this.aggregate([
    { $match: query },
    { $group: {
        _id: '$results.material_type',
        count: { $sum: 1 },
        avgQualityScore: { $avg: '$results.quality_score' },
        avgConfidenceScore: { $avg: '$results.confidence_score' },
        avgProcessingTime: { $avg: '$processingTime' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

const VisionInference = mongoose.model('VisionInference', visionInferenceSchema);

module.exports = VisionInference;