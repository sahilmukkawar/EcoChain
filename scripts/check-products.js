// scripts/check-products.js
require('dotenv').config();
const mongoose = require('mongoose');
const { Product } = require('../database/models'); // Factory Product model
const { Product: MarketplaceProduct } = require('../database/models/Marketplace'); // Legacy model
const connectDB = require('../database/connection');

async function checkProducts() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Check Factory Products (correct model)
    console.log('\n=== FACTORY PRODUCTS (Correct Model) ===');
    const factoryProducts = await Product.find({});
    console.log(`Found ${factoryProducts.length} factory products:`);
    factoryProducts.forEach(product => {
      console.log(`- ${product.productInfo?.name} (${product.productId}) - Factory: ${product.factoryId}`);
    });

    // Check Legacy Marketplace Products 
    console.log('\n=== LEGACY MARKETPLACE PRODUCTS ===');
    const marketplaceProducts = await MarketplaceProduct.find({});
    console.log(`Found ${marketplaceProducts.length} legacy marketplace products:`);
    marketplaceProducts.forEach(product => {
      console.log(`- ${product.name} (${product.productId}) - SellerType: ${product.sellerType}`);
    });

    // Clean up legacy products
    if (marketplaceProducts.length > 0) {
      console.log('\n=== CLEANING UP LEGACY PRODUCTS ===');
      const deletedLegacy = await MarketplaceProduct.deleteMany({});
      console.log(`Removed ${deletedLegacy.deletedCount} legacy marketplace products`);
    }

    console.log('\n=== FINAL STATE ===');
    console.log(`Factory Products: ${factoryProducts.length}`);
    console.log(`Legacy Products: 0 (cleaned up)`);
    console.log('\nMarketplace is now clean and will only show factory-created products!');

    process.exit(0);
  } catch (error) {
    console.error('Error checking products:', error);
    process.exit(1);
  }
}

// Run the check function
checkProducts();