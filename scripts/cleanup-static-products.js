// scripts/cleanup-static-products.js
require('dotenv').config();
const mongoose = require('mongoose');
const { Product } = require('../database/models/Marketplace');
const connectDB = require('../database/connection');

async function cleanupStaticProducts() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Remove all static/system products
    const deletedProducts = await Product.deleteMany({ 
      $or: [
        { sellerType: 'system' },
        { productId: { $regex: /^PRD_.*_SAMPLE$/ } },
        { productId: { $regex: /^prod-.*-[0-9]+$/ } }
      ]
    });

    console.log(`Successfully removed ${deletedProducts.deletedCount} static/sample products`);

    // Show remaining products (should all be factory-created)
    const remainingProducts = await Product.find({});
    console.log(`\nRemaining products in database: ${remainingProducts.length}`);
    
    if (remainingProducts.length > 0) {
      console.log('Remaining products:');
      remainingProducts.forEach(product => {
        console.log(`- ${product.name || product.productInfo?.name} (${product.productId}) - sellerType: ${product.sellerType}`);
      });
    } else {
      console.log('Database is now clean - no products exist');
      console.log('Factories can create products through the marketplace interface');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error cleaning up static products:', error);
    process.exit(1);
  }
}

// Run the cleanup function
cleanupStaticProducts();