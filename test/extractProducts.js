// test/extractProducts.js
// Script to extract all product data and save it as JSON

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const connectDB = require('../database/connection');
const { Product } = require('../database/models');

async function extractProducts() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Fetch all products
    console.log('Fetching all products...');
    const products = await Product.find({}).lean();
    console.log(`Found ${products.length} products`);

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, 'output');
    try {
      await fs.access(outputDir);
    } catch {
      await fs.mkdir(outputDir, { recursive: true });
    }

    // Save products to JSON file
    const outputPath = path.join(outputDir, 'products.json');
    await fs.writeFile(outputPath, JSON.stringify(products, null, 2));
    console.log(`Products saved to ${outputPath}`);

    // Also save a summary report
    const summary = {
      totalProducts: products.length,
      categories: {},
      factories: new Set(),
      timestamp: new Date().toISOString()
    };

    // Generate summary statistics
    products.forEach(product => {
      // Count by category
      const category = product.productInfo?.category || 'unknown';
      summary.categories[category] = (summary.categories[category] || 0) + 1;
      
      // Track unique factories
      if (product.factoryId) {
        summary.factories.add(product.factoryId.toString());
      }
    });

    summary.uniqueFactories = summary.factories.size;
    summary.factories = Array.from(summary.factories);

    const summaryPath = path.join(outputDir, 'products_summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`Summary saved to ${summaryPath}`);

    console.log('\n=== SUMMARY ===');
    console.log(`Total Products: ${summary.totalProducts}`);
    console.log(`Unique Factories: ${summary.uniqueFactories}`);
    console.log('Products by Category:');
    for (const [category, count] of Object.entries(summary.categories)) {
      console.log(`  ${category}: ${count}`);
    }

    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error extracting products:', error);
    process.exit(1);
  }
}

// Run the extraction if this file is executed directly
if (require.main === module) {
  extractProducts();
}

module.exports = extractProducts;