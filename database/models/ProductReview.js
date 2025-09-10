// database/models/ProductReview.js
const mongoose = require('mongoose');

const productReviewSchema = new mongoose.Schema({
  reviewId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  reviewText: {
    type: String,
    required: true,
    maxlength: 1000
  },
  pros: [{
    type: String,
    maxlength: 100
  }],
  cons: [{
    type: String,
    maxlength: 100
  }],
  images: [{
    type: String
  }],
  helpfulVotes: {
    type: Number,
    default: 0
  },
  verifiedPurchase: {
    type: Boolean,
    default: true
  },
  sustainabilityRating: {
    type: Number,
    min: 1,
    max: 5
  },
  wouldRecommend: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
productReviewSchema.index({ reviewId: 1 }, { unique: true });
productReviewSchema.index({ productId: 1 });
productReviewSchema.index({ userId: 1 });
productReviewSchema.index({ rating: -1 });
productReviewSchema.index({ createdAt: -1 });

// Pre-save middleware to generate reviewId
productReviewSchema.pre('save', function(next) {
  if (!this.reviewId) {
    this.reviewId = 'REV' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

module.exports = mongoose.models.ProductReview || mongoose.model('ProductReview', productReviewSchema);
