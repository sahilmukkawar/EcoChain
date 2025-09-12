// debug-payment-count.js - Check actual payment records count
const mongoose = require('mongoose');
const connectDB = require('./database/connection');
const AdminPayment = require('./database/models/AdminPayment');
const GarbageCollection = require('./database/models/GarbageCollection');
const User = require('./database/models/User'); // Import User model
require('dotenv').config();

async function debugPaymentCount() {
  try {
    await connectDB();
    console.log('📦 Connected to database\n');
    
    // Count AdminPayment records
    const adminPaymentCount = await AdminPayment.countDocuments();
    console.log(`📊 AdminPayment records: ${adminPaymentCount}`);
    
    // Count paid collections
    const paidCollectionsCount = await GarbageCollection.countDocuments({
      'payment.collectorPaid': true
    });
    console.log(`📊 Paid collections: ${paidCollectionsCount}`);
    
    // Get all AdminPayment records without populate first
    const allPayments = await AdminPayment.find({})
      .sort({ createdAt: -1 });
    
    console.log(`\n📝 All AdminPayment records (${allPayments.length}):`);
    allPayments.forEach((payment, index) => {
      console.log(`${index + 1}. ${payment.paymentId} - ${payment.collectionDisplayId} - ₹${payment.paymentDetails?.amount || 'N/A'} - ${payment.action} - ${payment.processedAt.toISOString()}`);
    });
    
    // Get all paid collections to see which one is missing
    const paidCollections = await GarbageCollection.find({
      'payment.collectorPaid': true
    })
    .select('collectionId payment.collectorPaymentAmount payment.collectorPaymentDate')
    .sort({ 'payment.collectorPaymentDate': -1 });
    
    console.log(`\n📝 All paid collections (${paidCollections.length}):`);
    paidCollections.forEach((collection, index) => {
      const hasAdminPayment = allPayments.some(p => p.collectionDisplayId === collection.collectionId);
      console.log(`${index + 1}. ${collection.collectionId} - ₹${collection.payment?.collectorPaymentAmount || 'N/A'} - ${collection.payment?.collectorPaymentDate?.toISOString() || 'N/A'} - ${hasAdminPayment ? '✅' : '❌ MISSING'}`);
    });
    
    // Check if there are any duplicate collection IDs
    const collectionIds = allPayments.map(p => p.collectionDisplayId);
    const duplicates = collectionIds.filter((id, index) => collectionIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      console.log(`\n⚠️ Duplicate collection IDs found: ${duplicates.join(', ')}`);
    }
    
    mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }
}

debugPaymentCount();