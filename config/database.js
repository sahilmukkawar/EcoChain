// config/database.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB with optimized settings
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Connection pool size
      poolSize: 10,
      
      // Keep trying to send operations for 5 seconds
      serverSelectionTimeoutMS: 5000,
      
      // Close sockets after 45 seconds of inactivity
      socketTimeoutMS: 45000,
      
      // Use the new URL string parser
      useNewUrlParser: true,
      
      // Use the unified topology engine
      useUnifiedTopology: true,
      
      // Use createIndex() instead of ensureIndex()
      useCreateIndex: true,
      
      // Use findOneAndUpdate() and findOneAndDelete() instead of findAndModify()
      useFindAndModify: false
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Add connection error handler
    mongoose.connection.on('error', err => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    // Add disconnection handler
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    // Add reconnection handler
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;