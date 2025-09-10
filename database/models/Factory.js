// database/models/Factory.js
const mongoose = require('mongoose');

const factorySchema = new mongoose.Schema({
  factoryId: {
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
  companyInfo: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true
    },
    establishedYear: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear()
    },
    website: {
      type: String,
      trim: true
    },
    logo: {
      type: String
    }
  },
  contactInfo: {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
    },
    primaryContact: {
      type: String,
      required: true
    },
    alternateContact: {
      type: String
    }
  },
  location: {
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'India'
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      }
    }
  },
  certifications: {
    environmentalCertificates: [{
      name: String,
      issuer: String,
      validUntil: Date,
      documentUrl: String
    }],
    qualityStandards: [{
      standard: String, // ISO 9001, etc.
      certifiedBy: String,
      validUntil: Date,
      documentUrl: String
    }],
    governmentLicenses: [{
      licenseType: String,
      licenseNumber: String,
      issuedBy: String,
      validUntil: Date,
      documentUrl: String
    }]
  },
  capabilities: {
    acceptedMaterials: [{
      type: String,
      enum: ['plastic', 'paper', 'metal', 'glass', 'electronic', 'organic', 'textile', 'rubber']
    }],
    processingCapacity: {
      type: Number, // tons per month
      required: true
    },
    specializations: [String],
    workingHours: {
      monday: { start: String, end: String },
      tuesday: { start: String, end: String },
      wednesday: { start: String, end: String },
      thursday: { start: String, end: String },
      friday: { start: String, end: String },
      saturday: { start: String, end: String },
      sunday: { start: String, end: String }
    }
  },
  businessMetrics: {
    totalMaterialProcessed: {
      type: Number,
      default: 0
    },
    productsManufactured: {
      type: Number,
      default: 0
    },
    sustainabilityRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    customerRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  },
  paymentInfo: {
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      accountHolderName: String
    },
    paymentTerms: {
      type: String,
      enum: ['immediate', '15_days', '30_days', '45_days'],
      default: '30_days'
    },
    creditLimit: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'verification_pending'],
    default: 'verification_pending'
  },
  subscriptionPlan: {
    type: String,
    enum: ['basic', 'premium', 'enterprise'],
    default: 'basic'
  },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  lastOrderDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
factorySchema.index({ factoryId: 1 }, { unique: true });
factorySchema.index({ userId: 1 });
factorySchema.index({ 'companyInfo.registrationNumber': 1 }, { unique: true });
factorySchema.index({ 'location.coordinates': '2dsphere' });
factorySchema.index({ status: 1 });
factorySchema.index({ 'capabilities.acceptedMaterials': 1 });

// Method to check if factory accepts a material type
factorySchema.methods.acceptsMaterial = function(materialType) {
  return this.capabilities.acceptedMaterials.includes(materialType);
};

// Method to update business metrics
factorySchema.methods.updateMetrics = async function(materialProcessed, productsManufactured) {
  this.businessMetrics.totalMaterialProcessed += materialProcessed || 0;
  this.businessMetrics.productsManufactured += productsManufactured || 0;
  await this.save();
};

// Static method to find factories by material type and location
factorySchema.statics.findByMaterialAndLocation = async function(materialType, longitude, latitude, maxDistance = 50000) {
  return this.find({
    status: 'active',
    'capabilities.acceptedMaterials': materialType,
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // in meters
      }
    }
  });
};

module.exports = mongoose.models.Factory || mongoose.model('Factory', factorySchema);
