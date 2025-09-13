// scripts/test-product-pricing.js
require('dotenv').config();
const mongoose = require('mongoose');
const { Product } = require('../database/models'); // Factory Product model
const connectDB = require('../database/connection');

async function testProductPricing() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Find the Bamboo Wall Clock product
    const product = await Product.findOne({ 
      'productInfo.name': { $regex: 'Bamboo Wall Clock', $options: 'i' }
    });

    if (product) {
      console.log('\n=== BAMBOO WALL CLOCK PRICING ===');
      console.log('Product Name:', product.productInfo.name);
      console.log('Cost Price (₹):', product.pricing.costPrice);
      console.log('Selling Price (₹):', product.pricing.sellingPrice);
      console.log('Token Price (stored in ecoTokenDiscount):', product.pricing.ecoTokenDiscount);
      console.log('Current Stock:', product.inventory.currentStock);
      
      console.log('\n=== EXPECTED VS ACTUAL ===');
      console.log('Expected: ₹300 + 100 tokens');
      console.log('Actual: ₹' + product.pricing.sellingPrice + ' + ' + (product.pricing.ecoTokenDiscount || 'undefined') + ' tokens');
      
      // Check if we need to update existing products
      if (!product.pricing.ecoTokenDiscount) {
        console.log('\n⚠️  Token price not stored! Need to update existing products.');
      } else {
        console.log('\n✅ Token price is correctly stored!');
      }
    } else {
      console.log('Bamboo Wall Clock product not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testProductPricing();