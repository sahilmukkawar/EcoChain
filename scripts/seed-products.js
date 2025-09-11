// scripts/seed-products.js
require('dotenv').config();
const mongoose = require('mongoose');
const { Product } = require('../database/models/Marketplace');
const connectDB = require('../database/connection');

const sampleProducts = [
  {
    productId: 'PRD_001_SAMPLE',
    name: 'Recycled Paper Notebook',
    description: 'Made from 100% recycled paper, perfect for eco-conscious note-taking',
    category: 'recycled_goods',
    price: {
      tokenAmount: 50,
      fiatAmount: 250,
      currency: 'INR'
    },
    images: ['https://via.placeholder.com/300x300?text=Notebook'],
    sellerId: new mongoose.Types.ObjectId(), // Will use system seller
    sellerType: 'system',
    recycledMaterial: 'paper',
    sustainabilityScore: 90,
    inventory: {
      available: 100,
      reserved: 0,
      sold: 0
    },
    status: 'active'
  },
  {
    productId: 'PRD_002_SAMPLE',
    name: 'Bamboo Toothbrush Set',
    description: 'Biodegradable bamboo toothbrush with soft bristles, pack of 4',
    category: 'eco_products',
    price: {
      tokenAmount: 30,
      fiatAmount: 150,
      currency: 'INR'
    },
    images: ['https://via.placeholder.com/300x300?text=Toothbrush'],
    sellerId: new mongoose.Types.ObjectId(),
    sellerType: 'system',
    recycledMaterial: 'none',
    sustainabilityScore: 95,
    inventory: {
      available: 50,
      reserved: 0,
      sold: 0
    },
    status: 'active'
  },
  {
    productId: 'PRD_003_SAMPLE',
    name: 'Upcycled Plastic Water Bottle',
    description: 'Reusable water bottle made from recycled plastic bottles',
    category: 'recycled_goods',
    price: {
      tokenAmount: 75,
      fiatAmount: 400,
      currency: 'INR'
    },
    images: ['https://via.placeholder.com/300x300?text=Water+Bottle'],
    sellerId: new mongoose.Types.ObjectId(),
    sellerType: 'system',
    recycledMaterial: 'plastic',
    sustainabilityScore: 85,
    inventory: {
      available: 25,
      reserved: 0,
      sold: 0
    },
    status: 'active'
  },
  {
    productId: 'PRD_004_SAMPLE',
    name: 'Recycled Glass Vase',
    description: 'Beautiful decorative vase made from recycled glass bottles',
    category: 'recycled_goods',
    price: {
      tokenAmount: 100,
      fiatAmount: 600,
      currency: 'INR'
    },
    images: ['https://via.placeholder.com/300x300?text=Glass+Vase'],
    sellerId: new mongoose.Types.ObjectId(),
    sellerType: 'system',
    recycledMaterial: 'glass',
    sustainabilityScore: 80,
    inventory: {
      available: 15,
      reserved: 0,
      sold: 0
    },
    status: 'active'
  },
  {
    productId: 'PRD_005_SAMPLE',
    name: 'Organic Cotton Tote Bag',
    description: 'Reusable shopping bag made from organic cotton',
    category: 'eco_products',
    price: {
      tokenAmount: 40,
      fiatAmount: 200,
      currency: 'INR'
    },
    images: ['https://via.placeholder.com/300x300?text=Tote+Bag'],
    sellerId: new mongoose.Types.ObjectId(),
    sellerType: 'system',
    recycledMaterial: 'none',
    sustainabilityScore: 88,
    inventory: {
      available: 75,
      reserved: 0,
      sold: 0
    },
    status: 'active'
  }
];

async function seedProducts() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Clear existing sample products
    await Product.deleteMany({ sellerType: 'system' });
    console.log('Cleared existing sample products');

    // Insert sample products
    const products = await Product.insertMany(sampleProducts);
    console.log(`Successfully seeded ${products.length} sample products`);

    // Display created products
    products.forEach(product => {
      console.log(`- ${product.name} (${product.productId})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

// Run the seed function
seedProducts();