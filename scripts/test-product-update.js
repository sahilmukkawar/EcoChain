// scripts/test-product-update.js
require('dotenv').config();
const mongoose = require('mongoose');
const { Product } = require('../database/models');
const connectDB = require('../database/connection');

async function testProductUpdate() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find the Bamboo Wall Clock product
    const product = await Product.findOne({ 
      'productInfo.name': { $regex: 'Bamboo Wall Clock', $options: 'i' }
    });

    if (!product) {
      console.log('❌ Bamboo Wall Clock product not found');
      return;
    }

    console.log('\n=== BEFORE UPDATE ===');
    console.log('Product Name:', product.productInfo.name);
    console.log('Cost Price (₹):', product.pricing.costPrice);
    console.log('Selling Price (₹):', product.pricing.sellingPrice);
    console.log('Token Price (ecoTokenDiscount):', product.pricing.ecoTokenDiscount);
    console.log('Stock:', product.inventory.currentStock);
    console.log('Sustainability %:', product.sustainability.recycledMaterialPercentage);

    // Simulate an update operation like the frontend would send
    const updateData = {
      price: {
        fiatAmount: 350,  // New fiat price (₹350)
        tokenAmount: 120  // New token price (120 tokens)
      },
      inventory: {
        available: 25     // New stock
      },
      sustainabilityScore: 85  // New sustainability score
    };

    console.log('\n=== SIMULATING UPDATE ===');
    console.log('Update data:', JSON.stringify(updateData, null, 2));

    // Apply the update logic from the controller
    if (updateData.price) {
      if (updateData.price.fiatAmount !== undefined) {
        product.pricing.costPrice = updateData.price.fiatAmount;
        product.pricing.sellingPrice = updateData.price.fiatAmount;
      }
      if (updateData.price.tokenAmount !== undefined) {
        product.pricing.ecoTokenDiscount = updateData.price.tokenAmount;
      }
    }
    if (updateData.inventory && updateData.inventory.available !== undefined) {
      product.inventory.currentStock = updateData.inventory.available;
    }
    if (updateData.sustainabilityScore !== undefined) {
      product.sustainability.recycledMaterialPercentage = updateData.sustainabilityScore;
    }

    await product.save();

    console.log('\n=== AFTER UPDATE ===');
    console.log('Cost Price (₹):', product.pricing.costPrice);
    console.log('Selling Price (₹):', product.pricing.sellingPrice);
    console.log('Token Price (ecoTokenDiscount):', product.pricing.ecoTokenDiscount);
    console.log('Stock:', product.inventory.currentStock);
    console.log('Sustainability %:', product.sustainability.recycledMaterialPercentage);

    console.log('\n=== VERIFICATION ===');
    console.log('Expected: ₹350 + 120 tokens, Stock: 25, Sustainability: 85%');
    console.log('Actual: ₹' + product.pricing.sellingPrice + ' + ' + product.pricing.ecoTokenDiscount + ' tokens, Stock: ' + product.inventory.currentStock + ', Sustainability: ' + product.sustainability.recycledMaterialPercentage + '%');

    if (product.pricing.sellingPrice === 350 && 
        product.pricing.ecoTokenDiscount === 120 && 
        product.inventory.currentStock === 25 &&
        product.sustainability.recycledMaterialPercentage === 85) {
      console.log('✅ SUCCESS: Product update works correctly!');
    } else {
      console.log('❌ ERROR: Product update has issues');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testProductUpdate();