// database/utils.js
const bcrypt = require('bcryptjs');
const User = require('./models/User');

/**
 * One-time password repair for seeded users that were double-hashed.
 * Finds known seed emails and resets password to plain so pre-save hook re-hashes once.
 */
async function repairSeededPasswords() {
  const targets = [
    { email: 'admin@ecochain.com', password: 'Admin@123' },
    { email: 'factory@ecochain.com', password: 'Factory@123' },
    { email: 'collector@ecochain.com', password: 'Collector@123' },
    { email: 'user@ecochain.com', password: 'User@123' }
  ];

  for (const t of targets) {
    const user = await User.findOne({ 'personalInfo.email': t.email }).select('+password');
    if (user) {
      // If compare fails against expected password, reset to plain to trigger pre-save hashing
      const ok = await bcrypt.compare(t.password, user.password);
      if (!ok) {
        user.password = t.password;
        await user.save();
      }
    }
  }
}
const mongoose = require('mongoose');
const { User: UserModel, GarbageCollection, Transaction } = require('./models');
const { Product, Order } = require('./models/Marketplace');

/**
 * Utility functions for common database operations
 */

/**
 * Generate a unique ID with a prefix
 * @param {string} prefix - Prefix for the ID (e.g., 'user', 'txn')
 * @returns {string} - A unique ID with the given prefix
 */
const generateUniqueId = (prefix) => {
  const timestamp = new Date().getTime();
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${randomStr}`;
};

/**
 * Find users by location within a certain radius
 * @param {number} longitude - Longitude coordinate
 * @param {number} latitude - Latitude coordinate
 * @param {number} maxDistance - Maximum distance in meters
 * @param {Object} filter - Additional filter criteria
 * @returns {Promise<Array>} - Array of users within the specified radius
 */
const findUsersByLocation = async (longitude, latitude, maxDistance = 10000, filter = {}) => {
  return UserModel.find({
    ...filter,
    'address.coordinates': {
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

/**
 * Find nearby garbage collections for collectors
 * @param {number} longitude - Longitude coordinate
 * @param {number} latitude - Latitude coordinate
 * @param {number} maxDistance - Maximum distance in meters
 * @param {Object} filter - Additional filter criteria
 * @returns {Promise<Array>} - Array of garbage collections within the specified radius
 */
const findNearbyCollections = async (longitude, latitude, maxDistance = 10000, filter = {}) => {
  return GarbageCollection.find({
    ...filter,
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

/**
 * Create a new transaction and update user's wallet
 * @param {Object} transactionData - Transaction data
 * @param {string} transactionData.userId - User ID
 * @param {string} transactionData.type - Transaction type ('credit' or 'debit')
 * @param {number} transactionData.amount - Transaction amount
 * @param {string} transactionData.description - Transaction description
 * @param {string} transactionData.category - Transaction category
 * @param {string} transactionData.relatedEntityType - Related entity type
 * @param {string} transactionData.relatedEntityId - Related entity ID
 * @returns {Promise<Object>} - Created transaction
 */
const createTransaction = async (transactionData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId, type, amount, description, category, relatedEntityType, relatedEntityId } = transactionData;

    // Find user
    const user = await UserModel.findById(userId).session(session);
    if (!user) {
      throw new Error('User not found');
    }

    // Get current balance
    const balanceBefore = user.ecoWallet.currentBalance;

    // Update user's wallet based on transaction type
    if (type === 'credit') {
      user.ecoWallet.currentBalance += amount;
      user.ecoWallet.totalEarned += amount;
    } else if (type === 'debit') {
      if (user.ecoWallet.currentBalance < amount) {
        throw new Error('Insufficient token balance');
      }
      user.ecoWallet.currentBalance -= amount;
      user.ecoWallet.totalSpent += amount;
    } else {
      throw new Error('Invalid transaction type');
    }

    // Save user changes
    await user.save({ session });

    // Create transaction record
    const transaction = new Transaction({
      transactionId: generateUniqueId('txn'),
      userId,
      type,
      amount,
      balanceBefore,
      balanceAfter: user.ecoWallet.currentBalance,
      description,
      category,
      relatedEntityType,
      relatedEntityId,
      status: 'completed'
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
 * Process a marketplace order
 * @param {Object} orderData - Order data
 * @param {string} orderData.buyerId - Buyer user ID
 * @param {Array} orderData.items - Order items
 * @param {Object} orderData.shippingAddress - Shipping address
 * @returns {Promise<Object>} - Created order
 */
const processOrder = async (orderData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { buyerId, items, shippingAddress } = orderData;

    // Find buyer
    const buyer = await UserModel.findById(buyerId).session(session);
    if (!buyer) {
      throw new Error('Buyer not found');
    }

    // Calculate total amount and validate inventory
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      // Check inventory
      if (product.inventory.available < item.quantity) {
        throw new Error(`Not enough inventory for product: ${product.name}`);
      }

      // Calculate price
      const pricePerUnit = product.price.tokenAmount;
      const itemTotal = pricePerUnit * item.quantity;
      totalAmount += itemTotal;

      // Add to processed items
      processedItems.push({
        productId: product._id,
        quantity: item.quantity,
        pricePerUnit,
        totalPrice: itemTotal
      });

      // Reserve inventory
      await product.updateInventory(item.quantity, 'reserve');
    }

    // Check if buyer has enough tokens
    if (buyer.ecoWallet.currentBalance < totalAmount) {
      throw new Error('Insufficient token balance');
    }

    // Create order
    const order = new Order({
      orderId: generateUniqueId('order'),
      buyerId,
      items: processedItems,
      totalAmount,
      paymentMethod: 'eco_tokens',
      status: 'pending',
      shippingAddress
    });

    await order.save({ session });

    // Create transaction for payment
    const transaction = await createTransaction({
      userId: buyerId,
      type: 'debit',
      amount: totalAmount,
      description: `Payment for order ${order.orderId}`,
      category: 'marketplace_purchase',
      relatedEntityType: 'Order',
      relatedEntityId: order._id
    });

    // Update order with transaction ID
    order.transactionId = transaction.transactionId;
    await order.save({ session });

    // Update product inventory status to 'sold'
    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      await product.updateInventory(item.quantity, 'sell');
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return order;
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Process a garbage collection submission
 * @param {Object} collectionData - Collection data
 * @returns {Promise<Object>} - Created collection
 */
const processGarbageCollection = async (collectionData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create garbage collection record
    const collection = new GarbageCollection({
      collectionId: generateUniqueId('col'),
      ...collectionData,
      status: 'requested'
    });

    await collection.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return collection;
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Process vision inference results and update collection
 * @param {Object} inferenceData - Inference data
 * @param {string} collectionId - Collection ID
 * @returns {Promise<Object>} - Updated collection
 */
const processVisionInference = async (inferenceData, collectionId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find collection
    const collection = await GarbageCollection.findOne({ collectionId }).session(session);
    if (!collection) {
      throw new Error('Collection not found');
    }

    // Update collection with inference results
    collection.visionInference = {
      material_type: inferenceData.material_type,
      sub_type: inferenceData.sub_type,
      quality_score: inferenceData.quality_score,
      inferenceId: generateUniqueId('inf')
    };

    // Update collection details if not already set
    if (!collection.collectionDetails.type) {
      collection.collectionDetails.type = inferenceData.material_type;
    }
    if (!collection.collectionDetails.subType && inferenceData.sub_type) {
      collection.collectionDetails.subType = inferenceData.sub_type;
    }
    if (!collection.collectionDetails.quality && inferenceData.quality_score) {
      // Map quality score to quality level
      let quality = 'fair';
      if (inferenceData.quality_score >= 80) {
        quality = 'excellent';
      } else if (inferenceData.quality_score >= 60) {
        quality = 'good';
      } else if (inferenceData.quality_score < 40) {
        quality = 'poor';
      }
      collection.collectionDetails.quality = quality;
    }
    if (!collection.collectionDetails.weight && inferenceData.estimated_weight) {
      collection.collectionDetails.weight = inferenceData.estimated_weight;
    }

    await collection.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return { collection };
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Complete a garbage collection and issue tokens
 * @param {string} collectionId - Collection ID
 * @returns {Promise<Object>} - Updated collection and transaction
 */
const completeGarbageCollection = async (collectionId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find collection
    const collection = await GarbageCollection.findOne({ collectionId }).session(session);
    if (!collection) {
      throw new Error('Collection not found');
    }

    // Check if collection is in the right status
    if (collection.status !== 'verified') {
      throw new Error(`Collection status must be 'verified', current status: ${collection.status}`);
    }

    // Calculate tokens
    const tokensIssued = collection.calculateTokens();

    // Update collection status
    await collection.updateStatus('completed');

    // Issue tokens to user
    const transaction = await createTransaction({
      userId: collection.userId,
      type: 'credit',
      amount: tokensIssued,
      description: `Reward for garbage collection ${collection.collectionId}`,
      category: 'collection_reward',
      relatedEntityType: 'GarbageCollection',
      relatedEntityId: collection._id
    });

    // Update user's sustainability score
    const user = await UserModel.findById(collection.userId).session(session);
    if (user) {
      // Calculate sustainability points based on material type and quality
      let sustainabilityPoints = 5; // Base points

      // Adjust based on material type
      const materialTypePoints = {
        plastic: 3,
        paper: 2,
        metal: 4,
        glass: 3,
        electronic: 5,
        organic: 2,
        other: 1
      };
      sustainabilityPoints += materialTypePoints[collection.collectionDetails.type] || 1;

      // Adjust based on quality
      const qualityPoints = {
        excellent: 5,
        good: 3,
        fair: 1,
        poor: 0
      };
      sustainabilityPoints += qualityPoints[collection.collectionDetails.quality] || 0;

      // Update user's sustainability score
      user.sustainabilityScore += sustainabilityPoints;
      await user.save({ session });
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return { collection, transaction };
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

module.exports = {
  repairSeededPasswords,
  generateUniqueId,
  findUsersByLocation,
  findNearbyCollections,
  createTransaction,
  processOrder,
  processGarbageCollection,
  processVisionInference,
  completeGarbageCollection
};