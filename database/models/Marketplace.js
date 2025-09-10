// database/models/Marketplace.js
const mongoose = require('mongoose');

// Product Schema
const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['recycled_goods', 'eco_products', 'services', 'rewards', 'other'],
    required: true
  },
  price: {
    tokenAmount: {
      type: Number,
      required: true
    },
    fiatAmount: {
      type: Number
    },
    currency: {
      type: String,
      default: 'EcoToken'
    }
  },
  images: [{
    type: String
  }],
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerType: {
    type: String,
    enum: ['factory', 'user', 'system'],
    required: true
  },
  recycledMaterial: {
    type: String,
    enum: ['plastic', 'paper', 'metal', 'glass', 'electronic', 'organic', 'mixed', 'none'],
    default: 'none'
  },
  sustainabilityScore: {
    type: Number,
    default: 0
  },
  inventory: {
    available: {
      type: Number,
      required: true,
      min: 0
    },
    reserved: {
      type: Number,
      default: 0
    },
    sold: {
      type: Number,
      default: 0
    }
  },
  specifications: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'sold_out', 'pending_approval', 'rejected'],
    default: 'pending_approval'
  },
  ratings: {
    averageRating: {
      type: Number,
      default: 0
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Order Schema
const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    pricePerUnit: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['eco_tokens', 'mixed'],
    default: 'eco_tokens'
  },
  transactionId: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  shippingAddress: {
    name: { type: String },
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String },
    phone: { type: String }
  },
  shippingMethod: {
    type: String
  },
  trackingNumber: {
    type: String
  },
  estimatedDelivery: {
    type: Date
  },
  actualDelivery: {
    type: Date
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Review Schema
const reviewSchema = new mongoose.Schema({
  reviewId: {
    type: String,
    required: true,
    unique: true
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
    ref: 'Order'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String
  },
  comment: {
    type: String
  },
  images: [{
    type: String
  }],
  verified: {
    type: Boolean,
    default: false
  },
  helpfulVotes: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for Product Schema
productSchema.index({ productId: 1 }, { unique: true });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ sellerId: 1 });
productSchema.index({ 'price.tokenAmount': 1 });
productSchema.index({ status: 1 });
productSchema.index({ recycledMaterial: 1 });
productSchema.index({ sustainabilityScore: 1 });

// Indexes for Order Schema
orderSchema.index({ orderId: 1 }, { unique: true });
orderSchema.index({ buyerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: 1 });
orderSchema.index({ 'items.productId': 1 });

// Indexes for Review Schema
reviewSchema.index({ reviewId: 1 }, { unique: true });
reviewSchema.index({ productId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ rating: 1 });

// Pre-save middleware for Product
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Pre-save middleware for Order
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Pre-save middleware for Review
reviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to update product inventory
productSchema.methods.updateInventory = async function(quantity, action) {
  if (action === 'reserve') {
    if (this.inventory.available < quantity) {
      throw new Error('Not enough inventory available');
    }
    this.inventory.available -= quantity;
    this.inventory.reserved += quantity;
  } else if (action === 'unreserve') {
    this.inventory.available += quantity;
    this.inventory.reserved -= quantity;
  } else if (action === 'sell') {
    if (this.inventory.reserved < quantity) {
      throw new Error('Not enough inventory reserved');
    }
    this.inventory.reserved -= quantity;
    this.inventory.sold += quantity;
    
    // Update status if sold out
    if (this.inventory.available === 0 && this.inventory.reserved === 0) {
      this.status = 'sold_out';
    }
  } else if (action === 'restock') {
    this.inventory.available += quantity;
    
    // Update status if previously sold out
    if (this.status === 'sold_out' && this.inventory.available > 0) {
      this.status = 'active';
    }
  }
  
  await this.save();
  return this;
};

// Method to add a review and update product rating
productSchema.methods.addReview = async function(review) {
  // Update the product's average rating
  const currentTotal = this.ratings.averageRating * this.ratings.totalRatings;
  this.ratings.totalRatings += 1;
  this.ratings.averageRating = (currentTotal + review.rating) / this.ratings.totalRatings;
  
  await this.save();
  return this;
};

// Method to update order status
orderSchema.methods.updateStatus = async function(newStatus, notes = '') {
  const validStatusTransitions = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'cancelled'],
    delivered: ['completed', 'refunded'],
    completed: ['refunded'],
    cancelled: [],
    refunded: []
  };

  // Check if the status transition is valid
  if (!validStatusTransitions[this.status].includes(newStatus)) {
    throw new Error(`Invalid status transition from ${this.status} to ${newStatus}`);
  }

  // Update status
  this.status = newStatus;
  
  // Add notes if provided
  if (notes) {
    this.notes = this.notes ? `${this.notes}\n${notes}` : notes;
  }
  
  // Set delivery date if status is delivered
  if (newStatus === 'delivered') {
    this.actualDelivery = Date.now();
  }
  
  await this.save();
  return this;
};

// Create models
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Review = mongoose.model('Review', reviewSchema);

module.exports = {
  Product,
  Order,
  Review
};