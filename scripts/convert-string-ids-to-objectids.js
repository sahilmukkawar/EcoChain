const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { Product } = require('../database/models');

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecochain_dev', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Convert string _ids to ObjectIds
const convertStringIdsToObjectIds = async () => {
  try {
    console.log('\n=== CONVERTING STRING _ids TO OBJECTIDs ===');
    
    // Get the raw collection
    const collection = mongoose.connection.collection('products');
    
    // Find all products with string _ids
    const productsWithStrings = await collection.find({
      _id: { $type: 'string' }
    }).toArray();
    
    console.log(`Found ${productsWithStrings.length} products with string _ids`);
    
    let convertedCount = 0;
    
    for (let i = 0; i < productsWithStrings.length; i++) {
      const product = productsWithStrings[i];
      console.log(`\nConverting product ${i + 1}: ${product.productInfo?.name || product.name || 'Unknown'}`);
      console.log(`  Current _id: ${product._id} (type: string)`);
      
      try {
        // Create a new ObjectId from the string
        const newObjectId = new mongoose.Types.ObjectId(product._id);
        console.log(`  New ObjectId: ${newObjectId}`);
        
        // Update the document to use ObjectId instead of string
        // We need to do this carefully to preserve all data
        const updateResult = await collection.updateOne(
          { _id: product._id }, // Find by current string _id
          { 
            $set: { _id: newObjectId }, // Set new ObjectId _id
            $unset: {} // Don't unset anything
          }
        );
        
        if (updateResult.modifiedCount > 0) {
          console.log(`  ✅ Successfully converted _id to ObjectId`);
          convertedCount++;
        } else {
          console.log(`  ⚠️  No changes made`);
        }
      } catch (error) {
        console.log(`  ❌ Error converting: ${error.message}`);
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Converted ${convertedCount} products from string _ids to ObjectIds`);
    
    // Verify the conversion
    console.log('\n--- Verifying conversion ---');
    const remainingStringIds = await collection.find({
      _id: { $type: 'string' }
    }).count();
    
    const objectIdIds = await collection.find({
      _id: { $type: 'objectId' }
    }).count();
    
    console.log(`Products with string _ids remaining: ${remainingStringIds}`);
    console.log(`Products with ObjectId _ids: ${objectIdIds}`);
    
  } catch (error) {
    console.error('Error converting string _ids:', error);
  }
};

// Alternative approach: Create new documents with proper ObjectIds and delete old ones
const recreateProductsWithObjectIds = async () => {
  try {
    console.log('\n=== RECREATING PRODUCTS WITH PROPER OBJECTIDs ===');
    
    // Get the raw collection
    const collection = mongoose.connection.collection('products');
    
    // Find all products with string _ids
    const productsWithStrings = await collection.find({
      _id: { $type: 'string' }
    }).toArray();
    
    console.log(`Found ${productsWithStrings.length} products with string _ids`);
    
    let recreatedCount = 0;
    
    for (let i = 0; i < productsWithStrings.length; i++) {
      const product = productsWithStrings[i];
      console.log(`\nRecreating product ${i + 1}: ${product.productInfo?.name || product.name || 'Unknown'}`);
      console.log(`  Current _id: ${product._id} (type: string)`);
      
      try {
        // Create a new ObjectId
        const newObjectId = new mongoose.Types.ObjectId();
        console.log(`  New ObjectId: ${newObjectId}`);
        
        // Prepare the document data
        const productData = { ...product };
        delete productData._id; // Remove the old string _id
        delete productData.__v; // Remove version key
        
        // Add the new ObjectId
        productData._id = newObjectId;
        
        // Insert the new document
        await collection.insertOne(productData);
        console.log(`  ✅ New document created with ObjectId`);
        
        // Delete the old document
        await collection.deleteOne({ _id: product._id });
        console.log(`  ✅ Old document deleted`);
        
        recreatedCount++;
      } catch (error) {
        console.log(`  ❌ Error recreating: ${error.message}`);
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Recreated ${recreatedCount} products with proper ObjectIds`);
    
  } catch (error) {
    console.error('Error recreating products:', error);
  }
};

// Main function
const main = async () => {
  const conn = await connectDB();
  
  // First, let's try the recreate approach as it's safer
  await recreateProductsWithObjectIds();
  
  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
};

main();