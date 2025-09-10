// database/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  factoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Factory',
    required: true
  },
  productInfo: {
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
      required: true,
      enum: ['home_decor', 'furniture', 'clothing', 'accessories', 'electronics', 'toys', 'stationery', 'packaging', 'construction', 'other']
    },
    subCategory: {
      type: String
    },
    images: [{
      type: String,
      required: true
    }],
    specifications: {
      material: String,
      color: String,
      size: String,
      features: [String]
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['cm', 'inch', 'mm'],
        default: 'cm'
      }
    },
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ['g', 'kg', 'lb'],
        default: 'kg'
      }
    }
  },
  sustainability: {
    recycledMaterialPercentage: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    carbonFootprint: {
      type: Number, // kg CO2 equivalent
      default: 0
    },
    sustainabilityCertificates: [{
      name: String,
      issuer: String,
      validUntil: Date,
      documentUrl: String
    }],
    recycledFrom: [{
      type: String,
      enum: ['plastic', 'paper', 'metal', 'glass', 'electronic', 'organic', 'textile', 'rubber']
    }]
  },
  pricing: {
    costPrice: {
      type: Number,
      required: true
    },
    sellingPrice: {
      type: Number,
      required: true
    },
    ecoTokenDiscount: {
      type: Number, // max tokens applicable
      default: 0
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  inventory: {
    currentStock: {
      type: Number,
      required: true,
      min: 0
    },
    minStockLevel: {
      type: Number,
      default: 10
    },
    maxStockLevel: {
      type: Number,
      default: 1000
    },
    reorderPoint: {
      type: Number,
      default: 20
    }
  },
  sales: {
    totalSold: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  availability: {
    isActive: {
      type: Boolean,
      default: true
    },
    availableRegions: [{
      type: String
    }],
    estimatedDeliveryDays: {
      type: Number,
      default: 7
    }
  },
  seoData: {
    tags: [String],
    metaDescription: String,
    searchKeywords: [String]
  }
}, {
  timestamps: true
});

// Indexes
productSchema.index({ productId: 1 }, { unique: true });
productSchema.index({ factoryId: 1 });
productSchema.index({ 'productInfo.category': 1 });
productSchema.index({ 'productInfo.name': 'text', 'productInfo.description': 'text' });
productSchema.index({ 'pricing.sellingPrice': 1 });
productSchema.index({ 'sales.averageRating': -1 });
productSchema.index({ 'availability.isActive': 1 });

// Virtual for final price after discount
productSchema.virtual('finalPrice').get(function() {
  const discount = this.pricing.discountPercentage / 100;
  return this.pricing.sellingPrice * (1 - discount);
});

// Method to check if product is in stock
productSchema.methods.isInStock = function() {
  return this.inventory.currentStock > 0 && this.availability.isActive;
};

// Method to update stock
productSchema.methods.updateStock = async function(quantity, operation = 'subtract') {
  if (operation === 'subtract') {
    if (this.inventory.currentStock < quantity) {
      throw new Error('Insufficient stock');
    }
    this.inventory.currentStock -= quantity;
  } else if (operation === 'add') {
    this.inventory.currentStock += quantity;
  }
  await this.save();
};

// Method to update sales metrics
productSchema.methods.updateSales = async function(quantity, revenue) {
  this.sales.totalSold += quantity;
  this.sales.revenue += revenue;
  await this.save();
};

// Method to update rating
productSchema.methods.updateRating = async function(newRating) {
  const totalRatings = this.sales.totalReviews;
  const currentAverage = this.sales.averageRating;
  
  this.sales.totalReviews += 1;
  this.sales.averageRating = ((currentAverage * totalRatings) + newRating) / this.sales.totalReviews;
  
  await this.save();
};

// Static method to search products
productSchema.statics.searchProducts = async function(query, filters = {}) {
  const searchCriteria = {
    'availability.isActive': true,
    ...filters
  };

  if (query) {
    searchCriteria.$text = { $search: query };
  }

  return this.find(searchCriteria)
    .populate('factoryId', 'companyInfo.name location.city')
    .sort({ 'sales.averageRating': -1, 'sales.totalSold': -1 });
};

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
