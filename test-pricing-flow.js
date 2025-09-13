const mongoose = require('mongoose');

// Define the Product schema inline
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  images: [String],
  pricing: {
    sellingPrice: Number, // This stores fiat price
    costPrice: Number,
    ecoTokenDiscount: Number // This stores token price
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    name: String
  },
  category: String,
  tags: [String],
  sustainability: {
    carbonFootprint: Number,
    renewableEnergy: Number,
    recyclability: Number
  },
  availability: {
    inStock: Boolean,
    quantity: Number
  },
  sellerType: String
});

const Product = mongoose.model('Product', productSchema);

async function testPricingFlow() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/ecochain');
    
    console.log('Current products in database:');
    const products = await Product.find({});
    
    products.forEach(product => {
      console.log({
        name: product.name,
        fiatPrice: product.pricing?.sellingPrice,
        tokenPrice: product.pricing?.ecoTokenDiscount,
        seller: product.seller?.name || 'Unknown',
        sellerType: product.sellerType
      });
    });
    
    console.log(`\nTotal products found: ${products.length}`);
    
    // Test specific product that might have pricing issues
    const testProduct = products.find(p => p.name && p.name.includes('Bamboo'));
    if (testProduct) {
      console.log('\nDetailed view of test product:');
      console.log(JSON.stringify({
        name: testProduct.name,
        pricing: testProduct.pricing,
        seller: testProduct.seller
      }, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testPricingFlow();