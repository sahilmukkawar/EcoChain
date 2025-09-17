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
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true },
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        validate: {
          validator: function (v) {
            // Allow null/undefined values but validate array format when present
            if (!v || v === undefined || v === null) return true;
            return Array.isArray(v) && v.length === 2 &&
              typeof v[0] === 'number' && typeof v[1] === 'number';
          },
          message: props => `${props.value} is not a valid coordinate array!`
        }
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
  collectorStats: {
    totalEarnings: {
      type: Number,
      default: 0
    },
    totalCollections: {
      type: Number,
      default: 0
    },
    paymentHistory: [{
      collectionId: String,
      amount: Number,
      currency: {
        type: String,
        default: 'INR'
      },
      paymentDate: Date,
      wasteType: String,
      weight: Number,
      calculation: {
        breakdown: Object,
        paymentSummary: Object
      }
    }],
    averageRating: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    }
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

// Pre-validate middleware to clean address data before validation
userSchema.pre('validate', function (next) {
  // Clean up address data before validation to prevent "Cast to Object failed" errors
  if (this.address) {
    // Handle the case where address.location is undefined, null, or has invalid coordinates
    if (this.address.location === undefined || 
        this.address.location === null || 
        this.address.location === '' ||
        (this.address.location && (!this.address.location.coordinates || 
         !Array.isArray(this.address.location.coordinates) ||
         this.address.location.coordinates.length !== 2 ||
         this.address.location.coordinates.some(coord => typeof coord !== 'number' || isNaN(coord))))) {
      delete this.address.location;
    }

    // If address is an empty object, remove it
    if (typeof this.address === 'object' && Object.keys(this.address).length === 0) {
      this.address = undefined;
    }
  }

  next();
});

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
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

// Pre-save middleware to clean up address data
userSchema.pre('save', function (next) {
  // Clean up address data to prevent validation errors
  if (this.address) {
    // Convert address to plain object to avoid Mongoose subdocument issues
    const addressObj = this.address.toObject ? this.address.toObject() : this.address;

    // Remove undefined, null, or empty location field that causes "Cast to Object failed" error
    if (addressObj.location === undefined || addressObj.location === null || addressObj.location === '') {
      delete addressObj.location;
    }

    // Clean up location coordinates if they're invalid
    if (addressObj.location && addressObj.location.coordinates) {
      const coords = addressObj.location.coordinates;
      if (!Array.isArray(coords) || coords.length !== 2 ||
        coords.some(coord => typeof coord !== 'number' || isNaN(coord))) {
        delete addressObj.location;
      }
    }

    // Remove empty string values from address fields
    Object.keys(addressObj).forEach(key => {
      if (key !== 'location' && (addressObj[key] === '' || addressObj[key] === null || addressObj[key] === undefined)) {
        delete addressObj[key];
      }
    });

    // If address object is empty or only has empty location, remove it entirely
    const addressKeys = Object.keys(addressObj);
    if (addressKeys.length === 0 ||
      (addressKeys.length === 1 && addressKeys[0] === 'location' && !addressObj.location)) {
      this.address = undefined;
    } else {
      // Reassign the cleaned address object
      this.address = addressObj;
    }
  }

  next();
});

// Method to check if password matches
userSchema.methods.matchPassword = async function (enteredPassword) {
  console.log('Matching password for user:', this.personalInfo.email);
  console.log('Entered password length:', enteredPassword ? enteredPassword.length : 'undefined');
  console.log('Stored password hash exists:', !!this.password);
  console.log('Stored password hash length:', this.password ? this.password.length : 'undefined');
  
  if (!this.password) {
    console.log('No password hash found in user document');
    return false;
  }
  
  if (!enteredPassword) {
    console.log('No password provided for comparison');
    return false;
  }
  
  try {
    const result = await bcrypt.compare(enteredPassword, this.password);
    console.log('Password comparison result:', result);
    return result;
  } catch (error) {
    console.error('Error during password comparison:', error);
    return false;
  }
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Method to generate refresh token
userSchema.methods.generateRefreshToken = function () {
  const refreshToken = jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );

  this.refreshToken = refreshToken;
  return refreshToken;
};

// Method to update user's last active timestamp
userSchema.methods.updateLastActive = async function () {
  this.lastActive = Date.now();
  await this.save();
};

// Method to update user's sustainability score
userSchema.methods.updateSustainabilityScore = async function (points) {
  this.sustainabilityScore += points;
  await this.save();
};

// Method to add tokens to wallet
userSchema.methods.addTokens = async function (amount, reason) {
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
userSchema.methods.spendTokens = async function (amount, reason) {
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