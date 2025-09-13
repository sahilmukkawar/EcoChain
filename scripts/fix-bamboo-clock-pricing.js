// scripts/fix-bamboo-clock-pricing.js
require('dotenv').config();
const mongoose = require('mongoose');
const { Product } = require('../database/models'); // Factory Product model
const connectDB = require('../database/connection');

async function fixBambooClockPricing() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Find the Bamboo Wall Clock product
    const product = await Product.findOne({ 
      'productInfo.name': { $regex: 'Bamboo Wall Clock', $options: 'i' }
    });

    if (product) {
      console.log('\n=== FIXING BAMBOO WALL CLOCK ===');
      console.log('BEFORE:');
      console.log('  Cost Price (₹):', product.pricing.costPrice);
      console.log('  Selling Price (₹):', product.pricing.sellingPrice);
      console.log('  Token Price:', product.pricing.ecoTokenDiscount);

      // Update to correct pricing: ₹300 + 100 tokens
      await Product.findByIdAndUpdate(product._id, {
        'pricing.costPrice': 300,       // Production cost
        'pricing.sellingPrice': 300,    // Fiat selling price (₹)
        'pricing.ecoTokenDiscount': 100 // Token selling price
      });

      console.log('AFTER UPDATE:');
      console.log('  Cost Price (₹): 300');
      console.log('  Selling Price (₹): 300');
      console.log('  Token Price: 100');
      console.log('✅ Fixed successfully!');
      
      // Verify the update
      const updatedProduct = await Product.findById(product._id);
      console.log('\n=== VERIFICATION ===');
      console.log('Expected: ₹300 + 100 tokens');
      console.log('Actual: ₹' + updatedProduct.pricing.sellingPrice + ' + ' + updatedProduct.pricing.ecoTokenDiscount + ' tokens');
      
      if (updatedProduct.pricing.sellingPrice === 300 && updatedProduct.pricing.ecoTokenDiscount === 100) {
        console.log('🎉 SUCCESS: Product pricing is now correct!');
      } else {
        console.log('❌ ERROR: Product pricing is still incorrect');
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

fixBambooClockPricing();