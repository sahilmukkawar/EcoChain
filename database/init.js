// database/init.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./connection');
const { User, Product } = require('./models');

// Function to initialize the database with seed data
async function initDatabase() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB for initialization');

    // Check if admin user exists
    const adminExists = await User.findOne({ 'personalInfo.email': 'admin@ecochain.com' });

    if (!adminExists) {
      console.log('Creating admin user...');

      // Create admin user
      const adminUser = new User({
        userId: 'admin-' + Date.now(),
        personalInfo: {
          name: 'Admin User',
          email: 'admin@ecochain.com',
          phone: '+1234567890'
        },
        password: 'Admin@123',
        role: 'admin',
        accountStatus: 'active',
        kycStatus: 'verified'
      });

      await adminUser.save();
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }

    // Check if factory user exists
    const factoryExists = await User.findOne({ 'personalInfo.email': 'factory@ecochain.com' });

    if (!factoryExists) {
      console.log('Creating factory user...');

      // Create factory user
      const factoryUser = new User({
        userId: 'factory-' + Date.now(),
        personalInfo: {
          name: 'EcoChain Recycling Factory',
          email: 'factory@ecochain.com',
          phone: '+1987654321'
        },
        password: 'Factory@123',
        role: 'factory',
        address: {
          street: '123 Recycling Way',
          city: 'Green City',
          state: 'Eco State',
          zipCode: '12345',
          coordinates: {
            type: 'Point',
            coordinates: [-73.9857, 40.7484] // Example coordinates
          }
        },
        accountStatus: 'active',
        kycStatus: 'verified'
      });

      await factoryUser.save();
      console.log('Factory user created successfully');
    } else {
      console.log('Factory user already exists');
    }

    // Check if collector user exists
    const collectorExists = await User.findOne({ 'personalInfo.email': 'collector@ecochain.com' });

    if (!collectorExists) {
      console.log('Creating collector user...');

      // Create collector user
      const collectorUser = new User({
        userId: 'collector-' + Date.now(),
        personalInfo: {
          name: 'Eco Collector',
          email: 'collector@ecochain.com',
          phone: '+1122334455'
        },
        password: 'Collector@123',
        role: 'collector',
        address: {
          street: '456 Collection Ave',
          city: 'Green City',
          state: 'Eco State',
          zipCode: '12345',
          coordinates: {
            type: 'Point',
            coordinates: [-73.9657, 40.7584] // Example coordinates
          }
        },
        accountStatus: 'active',
        kycStatus: 'verified'
      });

      await collectorUser.save();
      console.log('Collector user created successfully');
    } else {
      console.log('Collector user already exists');
    }

    // Check if regular user exists
    const userExists = await User.findOne({ 'personalInfo.email': 'user@ecochain.com' });

    if (!userExists) {
      console.log('Creating regular user...');

      // Create regular user
      const regularUser = new User({
        userId: 'user-' + Date.now(),
        personalInfo: {
          name: 'Regular User',
          email: 'user@ecochain.com',
          phone: '+1555666777'
        },
        password: 'User@123',
        role: 'user',
        address: {
          street: '789 Eco Street',
          city: 'Green City',
          state: 'Eco State',
          zipCode: '12345',
          coordinates: {
            type: 'Point',
            coordinates: [-73.9757, 40.7384] // Example coordinates
          }
        },
        accountStatus: 'active',
        kycStatus: 'verified',
        preferences: {
          notificationSettings: {
            email: true,
            push: true,
            sms: false
          },
          preferredPickupTime: 'morning',
          recyclingGoals: 10
        }
      });

      await regularUser.save();
      console.log('Regular user created successfully');
    } else {
      console.log('Regular user already exists');
    }

    // Check if sample products exist
    const productsExist = await Product.countDocuments();

    if (productsExist === 0) {
      console.log('Creating sample marketplace products...');

      // Get factory user for product creation
      const factory = await User.findOne({ role: 'factory' });

      if (factory) {
        // Sample products
        const sampleProducts = [
          {
            productId: 'prod-' + Date.now() + '-1',
            name: 'Recycled Plastic Tote Bag',
            description: 'Eco-friendly tote bag made from 100% recycled plastic bottles.',
            category: 'recycled_goods',
            price: {
              tokenAmount: 50,
              fiatAmount: 15.99
            },
            images: ['https://example.com/images/tote-bag.jpg'],
            sellerId: factory._id,
            sellerType: 'factory',
            recycledMaterial: 'plastic',
            sustainabilityScore: 85,
            inventory: {
              available: 100,
              reserved: 0,
              sold: 0
            },
            specifications: {
              dimensions: '15x12x4 inches',
              weight: '0.3 kg',
              color: 'Blue'
            },
            status: 'active'
          },
          {
            productId: 'prod-' + Date.now() + '-2',
            name: 'Recycled Paper Notebook',
            description: 'Notebook made from 100% recycled paper with eco-friendly binding.',
            category: 'recycled_goods',
            price: {
              tokenAmount: 30,
              fiatAmount: 8.99
            },
            images: ['https://example.com/images/notebook.jpg'],
            sellerId: factory._id,
            sellerType: 'factory',
            recycledMaterial: 'paper',
            sustainabilityScore: 90,
            inventory: {
              available: 200,
              reserved: 0,
              sold: 0
            },
            specifications: {
              pages: '120',
              dimensions: '8.5x11 inches',
              cover: 'Hardcover'
            },
            status: 'active'
          },
          {
            productId: 'prod-' + Date.now() + '-3',
            name: 'Recycled Glass Vase',
            description: 'Beautiful vase crafted from recycled glass bottles.',
            category: 'recycled_goods',
            price: {
              tokenAmount: 75,
              fiatAmount: 24.99
            },
            images: ['https://example.com/images/glass-vase.jpg'],
            sellerId: factory._id,
            sellerType: 'factory',
            recycledMaterial: 'glass',
            sustainabilityScore: 80,
            inventory: {
              available: 50,
              reserved: 0,
              sold: 0
            },
            specifications: {
              height: '12 inches',
              diameter: '6 inches',
              color: 'Clear with blue tint'
            },
            status: 'active'
          },
          {
            productId: 'prod-' + Date.now() + '-4',
            name: 'Tree Planting Service',
            description: 'We will plant a tree in your name in a reforestation area.',
            category: 'services',
            price: {
              tokenAmount: 100,
              fiatAmount: 29.99
            },
            images: ['https://example.com/images/tree-planting.jpg'],
            sellerId: factory._id,
            sellerType: 'system',
            recycledMaterial: 'none',
            sustainabilityScore: 95,
            inventory: {
              available: 1000,
              reserved: 0,
              sold: 0
            },
            specifications: {
              location: 'Various reforestation projects',
              includes: 'Certificate of planting',
              impact: 'Helps offset carbon footprint'
            },
            status: 'active'
          }
        ];

        await Product.insertMany(sampleProducts);
        console.log('Sample marketplace products created successfully');
      } else {
        console.log('Factory user not found, skipping product creation');
      }
    } else {
      console.log('Sample products already exist');
    }

    console.log('Database initialization completed successfully');

  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    // Keep the connection open for the application
    // mongoose.connection.close();
  }
}

// Export the initialization function
module.exports = { initDatabase };

// Run the initialization if this script is executed directly
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('Database initialization script completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Database initialization script failed:', err);
      process.exit(1);
    });
}