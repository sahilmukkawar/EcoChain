// database/test-connection.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./connection');
const { User, GarbageCollection, Transaction, Product, Order, Review, VisionInference } = require('./models');

/**
 * Test database connection and models
 */
async function testConnection() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Successfully connected to MongoDB');

    // Test User model
    console.log('\nTesting User model...');
    const userCount = await User.countDocuments();
    console.log(`Found ${userCount} users in the database`);

    // Test GarbageCollection model
    console.log('\nTesting GarbageCollection model...');
    const collectionCount = await GarbageCollection.countDocuments();
    console.log(`Found ${collectionCount} garbage collections in the database`);

    // Test Transaction model
    console.log('\nTesting Transaction model...');
    const transactionCount = await Transaction.countDocuments();
    console.log(`Found ${transactionCount} transactions in the database`);

    // Test Product model
    console.log('\nTesting Product model...');
    const productCount = await Product.countDocuments();
    console.log(`Found ${productCount} products in the database`);

    // Test Order model
    console.log('\nTesting Order model...');
    const orderCount = await Order.countDocuments();
    console.log(`Found ${orderCount} orders in the database`);

    // Test Review model
    console.log('\nTesting Review model...');
    const reviewCount = await Review.countDocuments();
    console.log(`Found ${reviewCount} reviews in the database`);

    // Test VisionInference model
    console.log('\nTesting VisionInference model...');
    const inferenceCount = await VisionInference.countDocuments();
    console.log(`Found ${inferenceCount} vision inferences in the database`);

    console.log('\n✅ All models tested successfully');

    // Test database indexes
    console.log('\nTesting database indexes...');
    const userIndexes = await User.collection.indexes();
    console.log(`User model has ${userIndexes.length} indexes`);

    const collectionIndexes = await GarbageCollection.collection.indexes();
    console.log(`GarbageCollection model has ${collectionIndexes.length} indexes`);

    const transactionIndexes = await Transaction.collection.indexes();
    console.log(`Transaction model has ${transactionIndexes.length} indexes`);

    const productIndexes = await Product.collection.indexes();
    console.log(`Product model has ${productIndexes.length} indexes`);

    const orderIndexes = await Order.collection.indexes();
    console.log(`Order model has ${orderIndexes.length} indexes`);

    const reviewIndexes = await Review.collection.indexes();
    console.log(`Review model has ${reviewIndexes.length} indexes`);

    const inferenceIndexes = await VisionInference.collection.indexes();
    console.log(`VisionInference model has ${inferenceIndexes.length} indexes`);

    console.log('\n✅ All database indexes verified');

    console.log('\n✅ Database connection and models test completed successfully');

  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testConnection()
    .then(() => {
      console.log('Test script completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Test script failed:', err);
      process.exit(1);
    });
}

module.exports = { testConnection };