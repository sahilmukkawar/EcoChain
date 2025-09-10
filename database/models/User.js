// database/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  personalInfo: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    },
    phone: {
      type: String,
      trim: true
    },
    profileImage: {
      type: String
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false // Don't return password by default
  },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      }
    }
  },
  role: {
    type: String,
    enum: ['user', 'collector', 'factory', 'admin'],
    default: 'user',
    required: true
  },
  ecoWallet: {
    currentBalance: {
      type: Number,
      default: 0
    },
    totalEarned: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    }
  },
  preferences: {
    notificationSettings: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    preferredPickupTime: { type: String },
    recyclingGoals: { type: Number }
  },
  accountStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    required: true
  },
  registrationDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  sustainabilityScore: {
    type: Number,
    default: 0
  },
  refreshToken: {
    type: String,
    select: false
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ userId: 1 }, { unique: true });
userSchema.index({ 'personalInfo.email': 1 }, { unique: true });
userSchema.index({ 'address.coordinates': '2dsphere' });
userSchema.index({ role: 1 });
userSchema.index({ accountStatus: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if password matches
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Method to generate refresh token
userSchema.methods.generateRefreshToken = function() {
  const refreshToken = jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );
  
  this.refreshToken = refreshToken;
  return refreshToken;
};

// Method to update user's last active timestamp
userSchema.methods.updateLastActive = async function() {
  this.lastActive = Date.now();
  await this.save();
};

// Method to update user's sustainability score
userSchema.methods.updateSustainabilityScore = async function(points) {
  this.sustainabilityScore += points;
  await this.save();
};

// Method to add tokens to wallet
userSchema.methods.addTokens = async function(amount, reason) {
  this.ecoWallet.currentBalance += amount;
  this.ecoWallet.totalEarned += amount;
  await this.save();
  
  // Return transaction details for logging
  return {
    userId: this._id,
    amount,
    type: 'credit',
    reason,
    balanceAfter: this.ecoWallet.currentBalance
  };
};

// Method to spend tokens from wallet
userSchema.methods.spendTokens = async function(amount, reason) {
  // Check if user has enough tokens
  if (this.ecoWallet.currentBalance < amount) {
    throw new Error('Insufficient token balance');
  }
  
  this.ecoWallet.currentBalance -= amount;
  this.ecoWallet.totalSpent += amount;
  await this.save();
  
  // Return transaction details for logging
  return {
    userId: this._id,
    amount,
    type: 'debit',
    reason,
    balanceAfter: this.ecoWallet.currentBalance
  };
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);