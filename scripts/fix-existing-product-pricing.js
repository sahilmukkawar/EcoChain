// scripts/fix-existing-product-pricing.js
require('dotenv').config();
const mongoose = require('mongoose');
const { Product } = require('../database/models'); // Factory Product model
const connectDB = require('../database/connection');

async function fixExistingProductPricing() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Find all products that need fixing (where sellingPrice < costPrice)
    const productsToFix = await Product.find({
      'pricing.sellingPrice': { $lt: 200 }  // Products with sellingPrice less than 200 are likely incorrect
    });

    console.log(`\nFound ${productsToFix.length} products that need pricing fixes:`);

    for (const product of productsToFix) {
      console.log(`\n=== FIXING: ${product.productInfo.name} ===`);
      console.log('BEFORE:');
      console.log('  Cost Price (₹):', product.pricing.costPrice);
      console.log('  Selling Price (₹):', product.pricing.sellingPrice);
      console.log('  Token Price:', product.pricing.ecoTokenDiscount);

      // The logic: 
      // - Original costPrice (300) should become sellingPrice
      // - Original sellingPrice (100) should become ecoTokenDiscount (token price)
      const newSellingPrice = product.pricing.costPrice;
      const newTokenPrice = product.pricing.sellingPrice;

      // Update the product
      await Product.findByIdAndUpdate(product._id, {
        'pricing.sellingPrice': newSellingPrice,
        'pricing.ecoTokenDiscount': newTokenPrice
      });

      console.log('AFTER:');
      console.log('  Cost Price (₹):', product.pricing.costPrice);
      console.log('  Selling Price (₹):', newSellingPrice);
      console.log('  Token Price:', newTokenPrice);
      console.log('✅ Fixed successfully!');
    }

    console.log(`\n🎉 Successfully fixed ${productsToFix.length} products!`);
    console.log('\nMarketplace should now show correct pricing:');
    console.log('- Tangy Oak Map Bamboo Wall Clock: ₹300 + 100 tokens');

    process.exit(0);
  } catch (error) {
    console.error('Error fixing product pricing:', error);
    process.exit(1);
  }
}

fixExistingProductPricing();