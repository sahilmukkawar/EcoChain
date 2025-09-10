// database/models/index.js
const User = require('./User');
const GarbageCollection = require('./GarbageCollection');
const { Product, Order, Review } = require('./Marketplace');
const Transaction = require('./Transaction');
const VisionInference = require('./VisionInference');

module.exports = {
  User,
  GarbageCollection,
  Product,
  Order,
  Review,
  Transaction,
  VisionInference
};