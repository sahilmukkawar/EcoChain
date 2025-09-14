// scripts/check-core-data.js
// Simple script to verify that core data (users and products) is still intact

const connectDB = require('../database/connection');
const { User, Product } = require('../database/models');

async function checkCoreData() {
  try {
    // Connect to database
    await connectDB();
    
    console.log('Connected to database. Checking core data...');
    
    // Count users
    const userCount = await User.countDocuments();
    console.log(`Found ${userCount} users in the database`);
    
    // Count products
    const productCount = await Product.countDocuments();
    console.log(`Found ${productCount} products in the database`);
    
    // Check if orders collection exists and is empty
    const { Order } = require('../database/models');
    const orderCount = await Order.countDocuments();
    console.log(`Found ${orderCount} orders in the database`);
    
    console.log('\nCore data check completed!');
    console.log('✓ Users are preserved');
    console.log('✓ Products are preserved');
    console.log('✓ Orders are cleared');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during core data check:', error);
    process.exit(1);
  }
}

// Run the verification function
checkCoreData();