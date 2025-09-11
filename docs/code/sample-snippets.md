# EcoChain Sample Code Snippets

This document provides sample code snippets for key components of the EcoChain platform. These snippets serve as implementation examples and guidelines for developers.

## Table of Contents

1. [Authentication Service](#authentication-service)
2. [User Service](#user-service)
3. [Collection Service](#collection-service)
4. [Vision AI Service](#vision-ai-service)
5. [Wallet Service](#wallet-service)
6. [Marketplace Service](#marketplace-service)
7. [Mobile App Components](#mobile-app-components)
8. [Factory Dashboard Components](#factory-dashboard-components)
9. [Admin Dashboard Components](#admin-dashboard-components)

## Authentication Service

### JWT Authentication Middleware (Node.js/Express)

```javascript
// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const config = require('../config');
const { UnauthorizedError } = require('../errors');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = await promisify(jwt.verify)(token, config.jwt.publicKey, {
      algorithms: ['RS256']
    });
    
    // Add user info to request
    req.user = {
      userId: decoded.sub,
      role: decoded.role,
      permissions: decoded.permissions
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token expired'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid token'));
    }
    next(error);
  }
};

/**
 * Middleware to check if user has required role
 */
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('User not authenticated'));
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return next(new UnauthorizedError('Insufficient permissions'));
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
```

### User Registration Controller (Node.js/Express)

```javascript
// src/controllers/auth.controller.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user.model');
const { ValidationError, ConflictError } = require('../errors');
const config = require('../config');

/**
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role = 'user' } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      throw new ValidationError('Name, email and password are required');
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ 'personalInfo.email': email });
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const userId = `u_${uuidv4().substring(0, 8)}`;
    const newUser = new User({
      userId,
      personalInfo: {
        name,
        email,
        phone,
        profileImage: null
      },
      password: hashedPassword,
      role,
      ecoWallet: {
        currentBalance: 0,
        totalEarned: 0,
        totalSpent: 0
      },
      preferences: {
        notificationSettings: {
          email: true,
          push: true
        },
        preferredPickupTime: null,
        recyclingGoals: null
      },
      accountStatus: 'pending',
      registrationDate: new Date(),
      lastActive: new Date(),
      kycStatus: 'pending',
      sustainabilityScore: 0
    });
    
    await newUser.save();
    
    // Generate verification token
    // ... (code for email verification)
    
    // Generate JWT token
    const token = jwt.sign(
      {
        sub: userId,
        role,
        permissions: []
      },
      config.jwt.privateKey,
      {
        algorithm: 'RS256',
        expiresIn: '15m'
      }
    );
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      { sub: userId },
      config.jwt.refreshPrivateKey,
      {
        algorithm: 'RS256',
        expiresIn: '7d'
      }
    );
    
    // Return user info and tokens
    res.status(201).json({
      success: true,
      data: {
        user: {
          userId,
          name: newUser.personalInfo.name,
          email: newUser.personalInfo.email,
          role: newUser.role
        },
        tokens: {
          accessToken: token,
          refreshToken,
          expiresIn: 900 // 15 minutes in seconds
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  // Other auth methods...
};
```

## User Service

### User Model (MongoDB/Mongoose)

```javascript
// src/models/user.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  personalInfo: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      sparse: true
    },
    profileImage: {
      type: String,
      default: null
    }
  },
  password: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
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
    default: 'user'
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
    },
    lastTransaction: Date
  },
  preferences: {
    notificationSettings: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    preferredPickupTime: String,
    recyclingGoals: Number
  },
  accountStatus: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'deactivated'],
    default: 'pending'
  },
  registrationDate: {
    type: Date,
    default: Date.now
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
  }
}, {
  timestamps: true
});

// Create 2dsphere index for geospatial queries
userSchema.index({ 'address.coordinates': '2dsphere' });

const User = mongoose.model('User', userSchema);

module.exports = User;
```

### User Profile Controller (Node.js/Express)

```javascript
// src/controllers/user.controller.js
const User = require('../models/user.model');
const { NotFoundError, ValidationError } = require('../errors');

/**
 * Get user profile
 */
const getProfile = async (req, res, next) => {
  try {
    const { userId } = req.user;
    
    const user = await User.findOne({ userId }).select('-password');
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { name, phone, street, city, state, zipCode, coordinates, preferredPickupTime, recyclingGoals } = req.body;
    
    const user = await User.findOne({ userId });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Update personal info
    if (name) user.personalInfo.name = name;
    if (phone) user.personalInfo.phone = phone;
    
    // Update address
    if (street || city || state || zipCode || coordinates) {
      user.address = user.address || {};
      if (street) user.address.street = street;
      if (city) user.address.city = city;
      if (state) user.address.state = state;
      if (zipCode) user.address.zipCode = zipCode;
      if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
        user.address.coordinates = {
          type: 'Point',
          coordinates: [coordinates[0], coordinates[1]]
        };
      }
    }
    
    // Update preferences
    if (preferredPickupTime) user.preferences.preferredPickupTime = preferredPickupTime;
    if (recyclingGoals) user.preferences.recyclingGoals = recyclingGoals;
    
    // Save updated user
    await user.save();
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  // Other user methods...
};
```

## Collection Service

### Collection Model (MongoDB/Mongoose)

```javascript
// src/models/collection.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionSchema = new Schema({
  collectionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  collectorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  factoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Factory',
    index: true
  },
  collectionDetails: {
    type: {
      type: String,
      enum: ['plastic', 'paper', 'metal', 'glass', 'electronics', 'other'],
      required: true
    },
    subType: String,
    weight: {
      type: Number,
      required: true
    },
    quality: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent'],
      default: 'fair'
    },
    images: [String],
    description: String
  },
  visionInference: {
    material_type: String,
    sub_type: String,
    quality_score: Number,
    inferenceId: String
  },
  location: {
    pickupAddress: String,
    coordinates: {
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
  scheduling: {
    requestedDate: {
      type: Date,
      required: true
    },
    scheduledDate: Date,
    actualPickupDate: Date,
    preferredTimeSlot: String
  },
  tokenCalculation: {
    baseRate: {
      type: Number,
      required: true
    },
    qualityMultiplier: {
      type: Number,
      default: 1.0
    },
    bonusTokens: {
      type: Number,
      default: 0
    },
    totalTokensIssued: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['requested', 'scheduled', 'in_progress', 'collected', 'delivered', 'verified', 'rejected', 'cancelled'],
    default: 'requested'
  },
  verification: {
    collectorNotes: String,
    factoryFeedback: String,
    qualityImages: [String],
    rejectionReason: String
  },
  logistics: {
    estimatedPickupTime: Date,
    actualPickupTime: Date,
    deliveryToFactory: Date,
    transportCost: Number
  }
}, {
  timestamps: true
});

// Create 2dsphere index for geospatial queries
collectionSchema.index({ 'location.coordinates': '2dsphere' });

const Collection = mongoose.model('Collection', collectionSchema);

module.exports = Collection;
```

### Collection Request Controller (Node.js/Express)

```javascript
// src/controllers/collection.controller.js
const { v4: uuidv4 } = require('uuid');
const Collection = require('../models/collection.model');
const User = require('../models/user.model');
const { NotFoundError, ValidationError } = require('../errors');
const { uploadToS3 } = require('../utils/s3');
const { callVisionService } = require('../services/vision.service');

/**
 * Create a new collection request
 */
const createCollectionRequest = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { type, subType, weight, description, pickupAddress, coordinates, requestedDate, preferredTimeSlot } = req.body;
    
    // Validate input
    if (!type || !weight || !pickupAddress || !coordinates || !requestedDate) {
      throw new ValidationError('Missing required fields');
    }
    
    // Check if user exists
    const user = await User.findOne({ userId });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Upload images to S3 if provided
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = await Promise.all(
        req.files.map(file => uploadToS3(`collections/${userId}/${Date.now()}_${file.originalname}`, file.buffer))
      );
    }
    
    // Call Vision AI service for material classification if images provided
    let visionInference = null;
    if (imageUrls.length > 0) {
      try {
        const inferenceResult = await callVisionService(imageUrls[0]);
        visionInference = {
          material_type: inferenceResult.material_type,
          sub_type: inferenceResult.sub_type,
          quality_score: inferenceResult.quality_score,
          inferenceId: `inf_${uuidv4().substring(0, 8)}`
        };
      } catch (error) {
        console.error('Vision service error:', error);
        // Continue without vision inference
      }
    }
    
    // Calculate base token rate based on material type
    const baseRates = {
      plastic: 10,
      paper: 8,
      metal: 15,
      glass: 6,
      electronics: 20,
      other: 5
    };
    
    const baseRate = baseRates[type] || 5;
    const totalTokens = Math.round(baseRate * weight);
    
    // Create collection request
    const collectionId = `col_${uuidv4().substring(0, 8)}`;
    const newCollection = new Collection({
      collectionId,
      userId: user._id,
      collectionDetails: {
        type,
        subType,
        weight,
        quality: 'fair', // Default quality, will be updated after verification
        images: imageUrls,
        description
      },
      visionInference,
      location: {
        pickupAddress,
        coordinates: {
          type: 'Point',
          coordinates: coordinates
        }
      },
      scheduling: {
        requestedDate: new Date(requestedDate),
        preferredTimeSlot
      },
      tokenCalculation: {
        baseRate,
        qualityMultiplier: 1.0, // Default multiplier, will be updated after verification
        bonusTokens: 0,
        totalTokensIssued: totalTokens
      },
      status: 'requested'
    });
    
    await newCollection.save();
    
    res.status(201).json({
      success: true,
      data: newCollection
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCollectionRequest,
  // Other collection methods...
};
```

## Vision AI Service

### Material Classification Model (Python/TensorFlow)

```python
# src/models/material_classifier.py
import tensorflow as tf
import numpy as np
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model

class MaterialClassifier:
    def __init__(self, model_path=None, num_classes=5):
        self.num_classes = num_classes
        self.class_names = ['plastic', 'paper', 'metal', 'glass', 'other']
        self.subtype_mapping = {
            'plastic': ['PET', 'HDPE', 'PVC', 'LDPE', 'PP', 'PS', 'Other'],
            'paper': ['Cardboard', 'Newspaper', 'Magazine', 'Office', 'Mixed'],
            'metal': ['Aluminum', 'Steel', 'Copper', 'Mixed'],
            'glass': ['Clear', 'Green', 'Brown', 'Mixed'],
            'other': ['Organic', 'Textile', 'Rubber', 'Unknown']
        }
        
        self.model = self._build_model()
        
        if model_path:
            self.model.load_weights(model_path)
    
    def _build_model(self):
        # Use EfficientNet as base model
        base_model = EfficientNetB0(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
        
        # Add classification head
        x = base_model.output
        x = GlobalAveragePooling2D()(x)
        x = Dense(512, activation='relu')(x)
        
        # Material type classification
        material_output = Dense(self.num_classes, activation='softmax', name='material_type')(x)
        
        # Quality assessment
        quality_output = Dense(1, activation='sigmoid', name='quality')(x)
        
        # Create model with multiple outputs
        model = Model(inputs=base_model.input, outputs=[material_output, quality_output])
        
        # Compile model
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
            loss={
                'material_type': 'categorical_crossentropy',
                'quality': 'mean_squared_error'
            },
            metrics={
                'material_type': 'accuracy',
                'quality': 'mae'
            }
        )
        
        return model
    
    def preprocess_image(self, image_path):
        # Load and preprocess image
        img = tf.keras.preprocessing.image.load_img(image_path, target_size=(224, 224))
        img_array = tf.keras.preprocessing.image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = tf.keras.applications.efficientnet.preprocess_input(img_array)
        
        return img_array
    
    def predict(self, image_path):
        # Preprocess image
        img_array = self.preprocess_image(image_path)
        
        # Make prediction
        material_pred, quality_pred = self.model.predict(img_array)
        
        # Get material type and quality score
        material_idx = np.argmax(material_pred[0])
        material_type = self.class_names[material_idx]
        material_confidence = float(material_pred[0][material_idx])
        
        # Determine subtype based on visual features (simplified)
        # In a real implementation, this would be a separate classifier
        subtype_idx = np.random.randint(0, len(self.subtype_mapping[material_type]))
        subtype = self.subtype_mapping[material_type][subtype_idx]
        
        # Quality score (0-1)
        quality_score = float(quality_pred[0][0])
        
        return {
            'material_type': material_type,
            'material_confidence': material_confidence,
            'sub_type': subtype,
            'quality_score': quality_score
        }
    
    def train(self, train_data, validation_data, epochs=10, batch_size=32):
        # Train the model
        history = self.model.fit(
            train_data,
            validation_data=validation_data,
            epochs=epochs,
            batch_size=batch_size,
            callbacks=[
                tf.keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True),
                tf.keras.callbacks.ModelCheckpoint('checkpoints/model_{epoch:02d}_{val_material_type_accuracy:.4f}.h5', 
                                                  save_best_only=True)
            ]
        )
        
        return history
```

### Vision API Service (Python/FastAPI)

```python
# src/main.py
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
import uuid
import tempfile
from models.material_classifier import MaterialClassifier
from utils.s3 import download_from_s3

app = FastAPI(title="EcoChain Vision API", description="API for waste material classification")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize model
model = MaterialClassifier(model_path="models/material_classifier_v1.h5")

class InferenceResponse(BaseModel):
    inference_id: str
    material_type: str
    material_confidence: float
    sub_type: str
    quality_score: float

@app.post("/api/v1/classify", response_model=InferenceResponse)
async def classify_material(file: UploadFile = File(...)):
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            # Write uploaded file to temporary file
            contents = await file.read()
            temp_file.write(contents)
            temp_path = temp_file.name
        
        # Make prediction
        result = model.predict(temp_path)
        
        # Clean up temporary file
        os.unlink(temp_path)
        
        # Return result
        return {
            "inference_id": f"inf_{uuid.uuid4().hex[:8]}",
            "material_type": result["material_type"],
            "material_confidence": result["material_confidence"],
            "sub_type": result["sub_type"],
            "quality_score": result["quality_score"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/classify-from-url")
async def classify_from_url(image_url: str):
    try:
        # Download image from S3 or other URL
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            if image_url.startswith("s3://"):
                # Download from S3
                download_from_s3(image_url, temp_file.name)
            else:
                # Download from HTTP URL
                import requests
                response = requests.get(image_url)
                temp_file.write(response.content)
            temp_path = temp_file.name
        
        # Make prediction
        result = model.predict(temp_path)
        
        # Clean up temporary file
        os.unlink(temp_path)
        
        # Return result
        return {
            "inference_id": f"inf_{uuid.uuid4().hex[:8]}",
            "material_type": result["material_type"],
            "material_confidence": result["material_confidence"],
            "sub_type": result["sub_type"],
            "quality_score": result["quality_score"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

## Wallet Service

### Token Transaction Model (MongoDB/Mongoose)

```javascript
// src/models/transaction.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['collection_reward', 'marketplace_purchase', 'referral_bonus', 'admin_adjustment', 'factory_payment'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  relatedId: {
    type: String,
    index: true
  },
  description: String,
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'reversed'],
    default: 'pending'
  },
  metadata: Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
```

### Token Transaction Service (Node.js)

```javascript
// src/services/wallet.service.js
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Transaction = require('../models/transaction.model');
const { NotFoundError, InsufficientFundsError } = require('../errors');

/**
 * Create a token transaction
 */
const createTransaction = async (userId, type, amount, relatedId, description, metadata = {}) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Find user and lock for transaction
    const user = await User.findOne({ userId }).session(session);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Check if user has sufficient funds for debit transactions
    if (amount < 0 && user.ecoWallet.currentBalance < Math.abs(amount)) {
      throw new InsufficientFundsError('Insufficient funds');
    }
    
    // Calculate new balance
    const balanceBefore = user.ecoWallet.currentBalance;
    const balanceAfter = balanceBefore + amount;
    
    // Update user wallet
    user.ecoWallet.currentBalance = balanceAfter;
    if (amount > 0) {
      user.ecoWallet.totalEarned += amount;
    } else if (amount < 0) {
      user.ecoWallet.totalSpent += Math.abs(amount);
    }
    user.ecoWallet.lastTransaction = new Date();
    
    await user.save({ session });
    
    // Create transaction record
    const transactionId = `tx_${uuidv4().substring(0, 8)}`;
    const transaction = new Transaction({
      transactionId,
      userId: user._id,
      type,
      amount,
      relatedId,
      description,
      balanceBefore,
      balanceAfter,
      status: 'completed',
      metadata,
      timestamp: new Date()
    });
    
    await transaction.save({ session });
    
    // Commit transaction
    await session.commitTransaction();
    session.endSession();
    
    return transaction;
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Get user transactions
 */
const getUserTransactions = async (userId, page = 1, limit = 10) => {
  const user = await User.findOne({ userId });
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  const skip = (page - 1) * limit;
  
  const transactions = await Transaction.find({ userId: user._id })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await Transaction.countDocuments({ userId: user._id });
  
  return {
    transactions,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  createTransaction,
  getUserTransactions
};
```

## Marketplace Service

### Product Model (MongoDB/Mongoose)

```javascript
// src/models/product.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  productId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  factoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Factory',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  subcategory: String,
  images: [String],
  price: {
    fiat: {
      amount: {
        type: Number,
        required: true
      },
      currency: {
        type: String,
        default: 'INR'
      }
    },
    tokens: {
      type: Number,
      required: true
    }
  },
  inventory: {
    available: {
      type: Number,
      required: true
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
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        default: 'cm'
      }
    },
    material: String,
    color: String,
    additionalSpecs: Schema.Types.Mixed
  },
  sustainability: {
    recycledContent: {
      type: Number, // Percentage
      default: 100
    },
    carbonFootprint: Number,
    certifications: [String],
    impactDescription: String
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'out_of_stock', 'discontinued'],
    default: 'draft'
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create text index for search
productSchema.index(
  { name: 'text', description: 'text', tags: 'text', category: 'text', subcategory: 'text' },
  { weights: { name: 10, tags: 5, category: 3, subcategory: 2, description: 1 } }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
```

### Order Model (MongoDB/Mongoose)

```javascript
// src/models/order.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    fiat: {
      amount: Number,
      currency: String
    },
    tokens: Number
  },
  totalPrice: {
    fiat: {
      amount: Number,
      currency: String
    },
    tokens: Number
  }
});

const orderSchema = new Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  items: [orderItemSchema],
  totalAmount: {
    fiat: {
      amount: Number,
      currency: String
    },
    tokens: Number
  },
  paymentDetails: {
    method: {
      type: String,
      enum: ['tokens', 'fiat', 'mixed'],
      required: true
    },
    tokenAmount: {
      type: Number,
      default: 0
    },
    fiatAmount: {
      type: Number,
      default: 0
    },
    fiatCurrency: {
      type: String,
      default: 'INR'
    },
    transactionId: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    }
  },
  shippingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  tracking: {
    carrier: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    shippedAt: Date,
    deliveredAt: Date
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
```

## Mobile App Components

### User App Collection Request Screen (React Native)

```jsx
// src/screens/CollectionRequestScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { TextInput, Button, HelperText, RadioButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { createCollectionRequest } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { getLocation } from '../utils/location';

const validationSchema = Yup.object().shape({
  type: Yup.string().required('Material type is required'),
  subType: Yup.string(),
  weight: Yup.number().required('Weight is required').positive('Weight must be positive'),
  description: Yup.string(),
  pickupAddress: Yup.string().required('Pickup address is required'),
  requestedDate: Yup.date().required('Pickup date is required').min(new Date(), 'Date cannot be in the past'),
  preferredTimeSlot: Yup.string()
});

const CollectionRequestScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  
  useEffect(() => {
    (async () => {
      // Request camera and location permissions
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== 'granted') {
        Alert.alert('Permission required', 'Camera permission is needed to take photos of recyclables');
      }
      
      // Get current location
      try {
        const location = await getLocation();
        setCoordinates([location.coords.longitude, location.coords.latitude]);
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert('Location error', 'Could not get your current location. Please enter address manually.');
      }
    })();
  }, []);
  
  const handleTakePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.cancelled) {
        setImages([...images, result.uri]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Could not take photo. Please try again.');
    }
  };
  
  const handleSubmit = async (values) => {
    if (images.length === 0) {
      Alert.alert('Photo required', 'Please take at least one photo of the recyclable materials');
      return;
    }
    
    setLoading(true);
    
    try {
      // Create form data for image upload
      const formData = new FormData();
      
      // Add images
      images.forEach((uri, index) => {
        const filename = uri.split('/').pop();
        const match = /\.([\w\d]+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image';
        
        formData.append('images', {
          uri,
          name: filename,
          type
        });
      });
      
      // Add other form values
      Object.keys(values).forEach(key => {
        formData.append(key, values[key]);
      });
      
      // Add coordinates
      if (coordinates) {
        formData.append('coordinates', JSON.stringify(coordinates));
      }
      
      // Submit request
      const response = await createCollectionRequest(formData);
      
      setLoading(false);
      
      // Show success message
      Alert.alert(
        'Collection Request Submitted',
        `Your collection request has been submitted successfully. You will earn approximately ${response.data.tokenCalculation.totalTokensIssued} tokens when the collection is verified.`,
        [
          { text: 'OK', onPress: () => navigation.navigate('CollectionHistory') }
        ]
      );
    } catch (error) {
      setLoading(false);
      console.error('Error submitting collection request:', error);
      Alert.alert('Error', 'Could not submit collection request. Please try again.');
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Request Waste Collection</Text>
      
      <View style={styles.imageSection}>
        <Text style={styles.sectionTitle}>Take Photos of Recyclables</Text>
        <View style={styles.imageContainer}>
          {images.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.image} />
          ))}
          <TouchableOpacity style={styles.addImageButton} onPress={handleTakePhoto}>
            <MaterialIcons name="add-a-photo" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <HelperText>Take clear photos of the recyclable materials</HelperText>
      </View>
      
      <Formik
        initialValues={{
          type: '',
          subType: '',
          weight: '',
          description: '',
          pickupAddress: user?.address?.street ? `${user.address.street}, ${user.address.city}, ${user.address.state} ${user.address.zipCode}` : '',
          requestedDate: new Date(Date.now() + 86400000), // Tomorrow
          preferredTimeSlot: user?.preferences?.preferredPickupTime || '10:00-12:00'
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Material Details</Text>
            
            <Text style={styles.label}>Material Type</Text>
            <RadioButton.Group
              onValueChange={value => setFieldValue('type', value)}
              value={values.type}
            >
              <View style={styles.radioRow}>
                <RadioButton.Item label="Plastic" value="plastic" />
                <RadioButton.Item label="Paper" value="paper" />
              </View>
              <View style={styles.radioRow}>
                <RadioButton.Item label="Metal" value="metal" />
                <RadioButton.Item label="Other" value="other" />
              </View>
            </RadioButton.Group>
            {touched.type && errors.type && (
              <HelperText type="error">{errors.type}</HelperText>
            )}
            
            <TextInput
              label="Sub Type (optional)"
              value={values.subType}
              onChangeText={handleChange('subType')}
              onBlur={handleBlur('subType')}
              style={styles.input}
              placeholder="E.g., PET bottles, Cardboard, Aluminum cans"
            />
            
            <TextInput
              label="Approximate Weight (kg)"
              value={values.weight}
              onChangeText={handleChange('weight')}
              onBlur={handleBlur('weight')}
              style={styles.input}
              keyboardType="numeric"
              placeholder="Enter weight in kilograms"
            />
            {touched.weight && errors.weight && (
              <HelperText type="error">{errors.weight}</HelperText>
            )}
            
            <TextInput
              label="Description (optional)"
              value={values.description}
              onChangeText={handleChange('description')}
              onBlur={handleBlur('description')}
              style={styles.input}
              multiline
              numberOfLines={3}
              placeholder="Describe the recyclable materials"
            />
            
            <Text style={styles.sectionTitle}>Pickup Details</Text>
            
            <TextInput
              label="Pickup Address"
              value={values.pickupAddress}
              onChangeText={handleChange('pickupAddress')}
              onBlur={handleBlur('pickupAddress')}
              style={styles.input}
              placeholder="Enter pickup address"
            />
            {touched.pickupAddress && errors.pickupAddress && (
              <HelperText type="error">{errors.pickupAddress}</HelperText>
            )}
            
            <Text style={styles.label}>Pickup Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text>{values.requestedDate.toDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={values.requestedDate}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setFieldValue('requestedDate', selectedDate);
                  }
                }}
              />
            )}
            {touched.requestedDate && errors.requestedDate && (
              <HelperText type="error">{errors.requestedDate}</HelperText>
            )}
            
            <Text style={styles.label}>Preferred Time Slot</Text>
            <RadioButton.Group
              onValueChange={value => setFieldValue('preferredTimeSlot', value)}
              value={values.preferredTimeSlot}
            >
              <RadioButton.Item label="Morning (8:00-10:00)" value="8:00-10:00" />
              <RadioButton.Item label="Mid-morning (10:00-12:00)" value="10:00-12:00" />
              <RadioButton.Item label="Afternoon (12:00-15:00)" value="12:00-15:00" />
              <RadioButton.Item label="Evening (15:00-18:00)" value="15:00-18:00" />
            </RadioButton.Group>
            
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Collection Request'}
            </Button>
            {loading && <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />}
          </View>
        )}
      </Formik>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2E7D32'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#2E7D32'
  },
  imageSection: {
    marginBottom: 16
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8
  },
  image: {
    width: 100,
    height: 100,
    margin: 4,
    borderRadius: 8
  },
  addImageButton: {
    width: 100,
    height: 100,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderRadius: 8
  },
  form: {
    marginBottom: 24
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#fff'
  },
  label: {
    fontSize: 16,
    marginTop: 8,
    marginBottom: 4,
    color: '#333'
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  dateButton: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8
  },
  submitButton: {
    marginTop: 24,
    paddingVertical: 8,
    backgroundColor: '#4CAF50'
  },
  loader: {
    marginTop: 16
  }
});

export default CollectionRequestScreen;
```

## Factory Dashboard Components

### Factory Dashboard Product Management (React/Next.js)

```jsx
// src/pages/factory/products/index.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Input,
  Select,
  IconButton,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, SearchIcon } from '@chakra-ui/icons';
import { getProducts, deleteProduct } from '../../../services/api';
import ProductModal from '../../../components/factory/ProductModal';
import DashboardLayout from '../../../layouts/DashboardLayout';

const ProductsPage = () => {
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  useEffect(() => {
    fetchProducts();
  }, []);
  
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts();
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Could not fetch products. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
    }
  };
  
  const handleAddProduct = () => {
    setSelectedProduct(null);
    onOpen();
  };
  
  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    onOpen();
  };
  
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        toast({
          title: 'Success',
          description: 'Product deleted successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast({
          title: 'Error',
          description: 'Could not delete product. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };
  
  const handleProductSaved = () => {
    fetchProducts();
    onClose();
  };
  
  // Filter products based on search term and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === '' || product.category === categoryFilter;
    const matchesStatus = statusFilter === '' || product.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });
  
  // Get unique categories for filter
  const categories = [...new Set(products.map(product => product.category))];
  
  return (
    <DashboardLayout>
      <Container maxW="container.xl" py={8}>
        <Flex justify="space-between" align="center" mb={8}>
          <Heading size="lg">Product Management</Heading>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="green"
            onClick={handleAddProduct}
          >
            Add New Product
          </Button>
        </Flex>
        
        <Box mb={6} p={4} bg="white" borderRadius="md" shadow="sm">
          <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
            <Flex flex={1} align="center">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                mr={2}
              />
              <IconButton
                aria-label="Search"
                icon={<SearchIcon />}
                colorScheme="blue"
              />
            </Flex>
            
            <Select
              placeholder="Filter by Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              w={{ base: 'full', md: '200px' }}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </Select>
            
            <Select
              placeholder="Filter by Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              w={{ base: 'full', md: '200px' }}
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="discontinued">Discontinued</option>
            </Select>
          </Flex>
        </Box>
        
        {loading ? (
          <Box textAlign="center" py={10}>
            <Text>Loading products...</Text>
          </Box>
        ) : filteredProducts.length === 0 ? (
          <Box textAlign="center" py={10}>
            <Text>No products found. Try adjusting your filters or add a new product.</Text>
          </Box>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Product ID</Th>
                  <Th>Name</Th>
                  <Th>Category</Th>
                  <Th>Price (Tokens)</Th>
                  <Th>Inventory</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredProducts.map(product => (
                  <Tr key={product.productId}>
                    <Td>{product.productId}</Td>
                    <Td>{product.name}</Td>
                    <Td>{product.category}</Td>
                    <Td>{product.price.tokens}</Td>
                    <Td>{product.inventory.available}</Td>
                    <Td>
                      <Badge
                        colorScheme={
                          product.status === 'active' ? 'green' :
                          product.status === 'draft' ? 'yellow' :
                          product.status === 'out_of_stock' ? 'red' :
                          'gray'
                        }
                      >
                        {product.status}
                      </Badge>
                    </Td>
                    <Td>
                      <IconButton
                        aria-label="Edit product"
                        icon={<EditIcon />}
                        size="sm"
                        colorScheme="blue"
                        mr={2}
                        onClick={() => handleEditProduct(product)}
                      />
                      <IconButton
                        aria-label="Delete product"
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDeleteProduct(product.productId)}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Container>
      
      <ProductModal
        isOpen={isOpen}
        onClose={onClose}
        product={selectedProduct}
        onSave={handleProductSaved}
      />
    </DashboardLayout>
  );
};

export default ProductsPage;
```

## Admin Dashboard Components

### Admin Dashboard Analytics (React/Next.js)

```jsx
// src/pages/admin/analytics/index.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Select,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { getAnalytics } from '../../../services/api';
import DashboardLayout from '../../../layouts/DashboardLayout';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchAnalytics(timeRange);
  }, [timeRange]);
  
  const fetchAnalytics = async (range) => {
    try {
      setLoading(true);
      const response = await getAnalytics(range);
      setAnalytics(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };
  
  // Prepare chart data
  const collectionChartData = {
    labels: analytics?.collections.dates || [],
    datasets: [
      {
        label: 'Collections',
        data: analytics?.collections.counts || [],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4
      }
    ]
  };
  
  const materialTypeData = {
    labels: analytics?.materialTypes.labels || [],
    datasets: [
      {
        label: 'Material Types',
        data: analytics?.materialTypes.counts || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  const tokenEconomyData = {
    labels: analytics?.tokenEconomy.dates || [],
    datasets: [
      {
        label: 'Tokens Issued',
        data: analytics?.tokenEconomy.issued || [],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        yAxisID: 'y'
      },
      {
        label: 'Tokens Spent',
        data: analytics?.tokenEconomy.spent || [],
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        yAxisID: 'y'
      }
    ]
  };
  
  return (
    <DashboardLayout>
      <Container maxW="container.xl" py={8}>
        <Flex justify="space-between" align="center" mb={8}>
          <Heading size="lg">Platform Analytics</Heading>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            w="200px"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </Select>
        </Flex>
        
        {loading ? (
          <Box textAlign="center" py={10}>
            <Text>Loading analytics data...</Text>
          </Box>
        ) : (
          <>
            <Grid templateColumns="repeat(4, 1fr)" gap={6} mb={8}>
              <GridItem>
                <Stat p={4} bg="white" borderRadius="md" shadow="sm">
                  <StatLabel>Total Users</StatLabel>
                  <StatNumber>{analytics?.summary.totalUsers}</StatNumber>
                  <StatHelpText>
                    <StatArrow type={analytics?.summary.userGrowth >= 0 ? 'increase' : 'decrease'} />
                    {Math.abs(analytics?.summary.userGrowth)}% from previous period
                  </StatHelpText>
                </Stat>
              </GridItem>
              
              <GridItem>
                <Stat p={4} bg="white" borderRadius="md" shadow="sm">
                  <StatLabel>Total Collections</StatLabel>
                  <StatNumber>{analytics?.summary.totalCollections}</StatNumber>
                  <StatHelpText>
                    <StatArrow type={analytics?.summary.collectionGrowth >= 0 ? 'increase' : 'decrease'} />
                    {Math.abs(analytics?.summary.collectionGrowth)}% from previous period
                  </StatHelpText>
                </Stat>
              </GridItem>
              
              <GridItem>
                <Stat p={4} bg="white" borderRadius="md" shadow="sm">
                  <StatLabel>Total Tokens Issued</StatLabel>
                  <StatNumber>{analytics?.summary.totalTokensIssued}</StatNumber>
                  <StatHelpText>
                    <StatArrow type={analytics?.summary.tokenIssuedGrowth >= 0 ? 'increase' : 'decrease'} />
                    {Math.abs(analytics?.summary.tokenIssuedGrowth)}% from previous period
                  </StatHelpText>
                </Stat>
              </GridItem>
              
              <GridItem>
                <Stat p={4} bg="white" borderRadius="md" shadow="sm">
                  <StatLabel>Total Products Sold</StatLabel>
                  <StatNumber>{analytics?.summary.totalProductsSold}</StatNumber>
                  <StatHelpText>
                    <StatArrow type={analytics?.summary.salesGrowth >= 0 ? 'increase' : 'decrease'} />
                    {Math.abs(analytics?.summary.salesGrowth)}% from previous period
                  </StatHelpText>
                </Stat>
              </GridItem>
            </Grid>
            
            <Tabs variant="enclosed" mb={8}>
              <TabList>
                <Tab>Collections</Tab>
                <Tab>Material Types</Tab>
                <Tab>Token Economy</Tab>
                <Tab>User Activity</Tab>
              </TabList>
              
              <TabPanels>
                <TabPanel>
                  <Box p={4} bg="white" borderRadius="md" shadow="sm">
                    <Heading size="md" mb={4}>Collection Trends</Heading>
                    <Box h="400px">
                      <Line 
                        data={collectionChartData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true
                            }
                          }
                        }} 
                      />
                    </Box>
                  </Box>
                </TabPanel>
                
                <TabPanel>
                  <Box p={4} bg="white" borderRadius="md" shadow="sm">
                    <Heading size="md" mb={4}>Material Type Distribution</Heading>
                    <Flex justify="center">
                      <Box w="500px" h="400px">
                        <Pie 
                          data={materialTypeData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false
                          }} 
                        />
                      </Box>
                    </Flex>
                  </Box>
                </TabPanel>
                
                <TabPanel>
                  <Box p={4} bg="white" borderRadius="md" shadow="sm">
                    <Heading size="md" mb={4}>Token Economy</Heading>
                    <Box h="400px">
                      <Line 
                        data={tokenEconomyData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              type: 'linear',
                              display: true,
                              position: 'left',
                              beginAtZero: true
                            }
                          }
                        }} 
                      />
                    </Box>
                  </Box>
                </TabPanel>
                
                <TabPanel>
                  <Box p={4} bg="white" borderRadius="md" shadow="sm">
                    <Heading size="md" mb={4}>User Activity</Heading>
                    <Box h="400px">
                      <Bar 
                        data={{
                          labels: analytics?.userActivity.dates || [],
                          datasets: [
                            {
                              label: 'New Users',
                              data: analytics?.userActivity.newUsers || [],
                              backgroundColor: 'rgba(54, 162, 235, 0.6)'
                            },
                            {
                              label: 'Active Users',
                              data: analytics?.userActivity.activeUsers || [],
                              backgroundColor: 'rgba(75, 192, 192, 0.6)'
                            }
                          ]
                        }} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true
                            }
                          }
                        }} 
                      />
                    </Box>
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </>
        )}
      </Container>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
```