// database/models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
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
  orderItems: [{
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
    unitPrice: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    },
    ecoTokensUsed: {
      type: Number,
      default: 0
    }
  }],
  billing: {
    subtotal: {
      type: Number,
      required: true
    },
    ecoTokensApplied: {
      type: Number,
      default: 0
    },
    ecoTokenValue: {
      type: Number, // monetary value of tokens used
      default: 0
    },
    taxes: {
      type: Number,
      default: 0
    },
    shippingCharges: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    finalAmount: {
      type: Number,
      required: true
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['card', 'upi', 'wallet', 'cod', 'net_banking'],
      required: true
    },
    transactionId: {
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending'
    },
    paidAt: {
      type: Date
    },
    gateway: {
      type: String,
      enum: ['stripe', 'razorpay', 'paytm']
    }
  },
  shipping: {
    address: {
      name: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'India' }
    },
    method: {
      type: String,
      enum: ['standard', 'express', 'overnight'],
      default: 'standard'
    },
    estimatedDelivery: {
      type: Date
    },
    actualDelivery: {
      type: Date
    },
    trackingNumber: {
      type: String
    },
    carrier: {
      type: String
    }
  },
  status: {
    type: String,
    enum: ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'placed'
  },
  timeline: {
    placedAt: {
      type: Date,
      default: Date.now
    },
    confirmedAt: {
      type: Date
    },
    shippedAt: {
      type: Date
    },
    deliveredAt: {
      type: Date
    }
  },
  customerFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: {
      type: String
    },
    reviewDate: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ orderId: 1 }, { unique: true });
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });

// Pre-save middleware to generate orderId
orderSchema.pre('save', function(next) {
  if (!this.orderId) {
    this.orderId = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

// Method to calculate total amount
orderSchema.methods.calculateTotal = function() {
  const subtotal = this.orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const tokenValue = this.billing.ecoTokensApplied * (process.env.TOKEN_TO_MONEY_RATE || 0.1);
  const finalAmount = subtotal + this.billing.taxes + this.billing.shippingCharges - this.billing.discount - tokenValue;
  
  this.billing.subtotal = subtotal;
  this.billing.ecoTokenValue = tokenValue;
  this.billing.finalAmount = Math.max(0, finalAmount);
  
  return this.billing.finalAmount;
};

// Method to update order status
orderSchema.methods.updateStatus = async function(newStatus, notes = '') {
  const validTransitions = {
    placed: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'returned'],
    delivered: ['returned'],
    cancelled: [],
    returned: []
  };

  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Invalid status transition from ${this.status} to ${newStatus}`);
  }

  this.status = newStatus;
  
  // Update timeline
  if (newStatus === 'confirmed') {
    this.timeline.confirmedAt = Date.now();
  } else if (newStatus === 'shipped') {
    this.timeline.shippedAt = Date.now();
  } else if (newStatus === 'delivered') {
    this.timeline.deliveredAt = Date.now();
  }

  await this.save();
  return this;
};

// Static method to get user's order history
orderSchema.statics.getUserOrders = async function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({ userId })
    .populate('orderItems.productId', 'productInfo.name productInfo.images pricing.sellingPrice')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
