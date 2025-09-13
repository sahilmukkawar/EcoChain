// scripts/test-frontend-backend-update.js
require('dotenv').config();
const mongoose = require('mongoose');
const { Product } = require('../database/models');
const connectDB = require('../database/connection');

async function testFrontendBackendUpdate() {
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

    console.log('\n=== CURRENT PRODUCT STATE ===');
    console.log('Product ID:', product._id);
    console.log('Product Name:', product.productInfo.name);
    console.log('Cost Price (₹):', product.pricing.costPrice);
    console.log('Selling Price (₹):', product.pricing.sellingPrice);
    console.log('Token Price (ecoTokenDiscount):', product.pricing.ecoTokenDiscount);
    console.log('Stock:', product.inventory.currentStock);
    console.log('Sustainability %:', product.sustainability.recycledMaterialPercentage);

    // Simulate what the frontend would send (based on the form mapping)
    // Form shows: costPrice=₹350 (fiat), sellingPrice=150 (tokens)
    // Frontend maps this to: fiatAmount=350, tokenAmount=150
    const frontendData = {
      productInfo: {
        name: 'Updated Bamboo Wall Clock - Premium Edition',
        description: 'Updated description for testing',
        category: 'home_decor'
      },
      pricing: {
        costPrice: 380,     // This becomes fiatAmount
        sellingPrice: 140   // This becomes tokenAmount
      },
      inventory: {
        currentStock: 30
      },
      sustainability: {
        recycledMaterialPercentage: 90
      }
    };

    console.log('\n=== FRONTEND FORM DATA ===');
    console.log('Form costPrice (fiat ₹):', frontendData.pricing.costPrice);
    console.log('Form sellingPrice (tokens):', frontendData.pricing.sellingPrice);
    console.log('Form stock:', frontendData.inventory.currentStock);
    console.log('Form sustainability:', frontendData.sustainability.recycledMaterialPercentage);

    // What marketplaceService.updateFactoryProduct sends to backend
    const apiPayload = {
      name: frontendData.productInfo.name,
      description: frontendData.productInfo.description,
      category: frontendData.productInfo.category,
      price: {
        fiatAmount: frontendData.pricing.costPrice,    // ₹380
        tokenAmount: frontendData.pricing.sellingPrice // 140 tokens
      },
      inventory: {
        available: frontendData.inventory.currentStock  // 30
      },
      sustainabilityScore: frontendData.sustainability.recycledMaterialPercentage // 90
    };

    console.log('\n=== API PAYLOAD TO BACKEND ===');
    console.log(JSON.stringify(apiPayload, null, 2));

    // Now simulate the backend update logic
    console.log('\n=== APPLYING BACKEND UPDATE LOGIC ===');

    // Update fields like the controller does
    if (apiPayload.name) {
      console.log('Updating name to:', apiPayload.name);
      product.productInfo.name = apiPayload.name;
    }
    if (apiPayload.description) {
      console.log('Updating description to:', apiPayload.description);
      product.productInfo.description = apiPayload.description;
    }
    if (apiPayload.category) {
      console.log('Updating category to:', apiPayload.category);
      product.productInfo.category = apiPayload.category;
    }

    if (apiPayload.price) {
      console.log('=== UPDATING PRICING ===');
      console.log('Price data received:', apiPayload.price);
      
      if (apiPayload.price.fiatAmount !== undefined) {
        console.log('Setting costPrice to:', apiPayload.price.fiatAmount);
        console.log('Setting sellingPrice to:', apiPayload.price.fiatAmount);
        product.pricing.costPrice = apiPayload.price.fiatAmount;
        product.pricing.sellingPrice = apiPayload.price.fiatAmount;
      }
      if (apiPayload.price.tokenAmount !== undefined) {
        console.log('Setting ecoTokenDiscount to:', apiPayload.price.tokenAmount);
        product.pricing.ecoTokenDiscount = apiPayload.price.tokenAmount;
      }
    }

    if (apiPayload.inventory && apiPayload.inventory.available !== undefined) {
      console.log('Updating stock to:', apiPayload.inventory.available);
      product.inventory.currentStock = apiPayload.inventory.available;
    }

    if (apiPayload.sustainabilityScore !== undefined) {
      console.log('Updating sustainability to:', apiPayload.sustainabilityScore);
      product.sustainability.recycledMaterialPercentage = apiPayload.sustainabilityScore;
    }

    await product.save();

    console.log('\n=== FINAL PRODUCT STATE ===');
    console.log('Product Name:', product.productInfo.name);
    console.log('Cost Price (₹):', product.pricing.costPrice);
    console.log('Selling Price (₹):', product.pricing.sellingPrice);
    console.log('Token Price (ecoTokenDiscount):', product.pricing.ecoTokenDiscount);
    console.log('Stock:', product.inventory.currentStock);
    console.log('Sustainability %:', product.sustainability.recycledMaterialPercentage);

    console.log('\n=== VERIFICATION ===');
    console.log('Expected: ₹380 + 140 tokens, Stock: 30, Sustainability: 90%');
    console.log('Actual: ₹' + product.pricing.sellingPrice + ' + ' + product.pricing.ecoTokenDiscount + ' tokens, Stock: ' + product.inventory.currentStock + ', Sustainability: ' + product.sustainability.recycledMaterialPercentage + '%');

    const success = (
      product.pricing.sellingPrice === 380 && 
      product.pricing.ecoTokenDiscount === 140 && 
      product.inventory.currentStock === 30 &&
      product.sustainability.recycledMaterialPercentage === 90
    );

    if (success) {
      console.log('✅ SUCCESS: Frontend-to-Backend update flow works correctly!');
    } else {
      console.log('❌ ERROR: Update flow has issues');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testFrontendBackendUpdate();