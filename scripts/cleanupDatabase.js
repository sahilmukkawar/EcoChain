// scripts/cleanupDatabase.js
// Script to clean up database collections while preserving essential test accounts

const mongoose = require('mongoose');
const connectDB = require('../database/connection');
const { 
  User, 
  GarbageCollection, 
  Order, 
  Product, 
  ProductReview, 
  Transaction, 
  EcoTokenTransaction, 
  Factory, 
  SystemConfiguration, 
  MaterialRequest, 
  Analytics, 
  AdminPayment,
  FactoryApplication,
  CollectorApplication
} = require('../database/models');

// List of essential test accounts to preserve
const essentialAccounts = [
  { email: 'admin@ecochain.com', password: 'Admin@123' },
  { email: 'factory@ecochain.com', password: 'Factory@123' },
  { email: 'collector@ecochain.com', password: 'Collector@123' },
  { email: 'user@ecochain.com', password: 'User@123' }
];

async function cleanupDatabase() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Get the IDs of essential accounts to preserve them
    const essentialUserIds = [];
    for (const account of essentialAccounts) {
      const user = await User.findOne({ 'personalInfo.email': account.email });
      if (user) {
        essentialUserIds.push(user._id);
        console.log(`Preserving user: ${account.email} (${user._id})`);
      } else {
        console.log(`User not found: ${account.email}`);
      }
    }

    // Clean up each collection while preserving essential accounts
    console.log('\n=== CLEANING UP DATABASE ===');
    
    // 1. Clean up GarbageCollection (preserve those linked to essential users)
    const gcResult = await GarbageCollection.deleteMany({
      userId: { $nin: essentialUserIds }
    });
    console.log(`Deleted ${gcResult.deletedCount} garbage collections`);
    
    // 2. Clean up Orders (preserve those linked to essential users)
    const orderResult = await Order.deleteMany({
      userId: { $nin: essentialUserIds }
    });
    console.log(`Deleted ${orderResult.deletedCount} orders`);
    
    // 3. Clean up Products (preserve all for now as per requirements)
    // Note: According to requirements, we should preserve products
    console.log('Preserving all products as per requirements');
    
    // 4. Clean up ProductReviews (no user linking, safe to delete all)
    const reviewResult = await ProductReview.deleteMany({});
    console.log(`Deleted ${reviewResult.deletedCount} product reviews`);
    
    // 5. Clean up Transactions (preserve those linked to essential users)
    const transactionResult = await Transaction.deleteMany({
      userId: { $nin: essentialUserIds }
    });
    console.log(`Deleted ${transactionResult.deletedCount} transactions`);
    
    // 6. Clean up EcoTokenTransactions (preserve those linked to essential users)
    const ecoTokenResult = await EcoTokenTransaction.deleteMany({
      userId: { $nin: essentialUserIds }
    });
    console.log(`Deleted ${ecoTokenResult.deletedCount} eco token transactions`);
    
    // 7. Clean up Factory (preserve those linked to essential users)
    const factoryResult = await Factory.deleteMany({
      userId: { $nin: essentialUserIds }
    });
    console.log(`Deleted ${factoryResult.deletedCount} factories`);
    
    // 8. Clean up SystemConfiguration (preserve all)
    console.log('Preserving system configuration');
    
    // 9. Clean up MaterialRequest (preserve those linked to essential users)
    const materialRequestResult = await MaterialRequest.deleteMany({
      factoryId: { $nin: essentialUserIds }
    });
    console.log(`Deleted ${materialRequestResult.deletedCount} material requests`);
    
    // 10. Clean up Analytics (preserve all for now)
    console.log('Preserving analytics data');
    
    // 11. Clean up AdminPayment (preserve those linked to essential users)
    const adminPaymentResult = await AdminPayment.deleteMany({
      $or: [
        { adminId: { $nin: essentialUserIds } },
        { collectorId: { $nin: essentialUserIds } },
        { userId: { $nin: essentialUserIds } }
      ]
    });
    console.log(`Deleted ${adminPaymentResult.deletedCount} admin payments`);
    
    // 12. Clean up FactoryApplication (preserve those linked to essential users)
    const factoryAppResult = await FactoryApplication.deleteMany({
      userId: { $nin: essentialUserIds }
    });
    console.log(`Deleted ${factoryAppResult.deletedCount} factory applications`);
    
    // 13. Clean up CollectorApplication (preserve those linked to essential users)
    const collectorAppResult = await CollectorApplication.deleteMany({
      userId: { $nin: essentialUserIds }
    });
    console.log(`Deleted ${collectorAppResult.deletedCount} collector applications`);
    
    // 14. Clean up Users (but preserve essential accounts)
    const userResult = await User.deleteMany({
      _id: { $nin: essentialUserIds }
    });
    console.log(`Deleted ${userResult.deletedCount} users (preserved ${essentialUserIds.length} essential accounts)`);

    console.log('\n=== CLEANUP COMPLETE ===');
    
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error cleaning up database:', error);
    process.exit(1);
  }
}

// Run the cleanup if this file is executed directly
if (require.main === module) {
  cleanupDatabase();
}

module.exports = cleanupDatabase;