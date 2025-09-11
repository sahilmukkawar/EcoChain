require('dotenv').config();
const connectDB = require('./database/connection');
const { GarbageCollection, User } = require('./database/models');

// Check collections status for payment processing
async function checkPayments() {
  try {
    await connectDB();
    
    console.log('=== PAYMENT DEBUG REPORT ===');
    
    // Get all collections with their status
    const allCollections = await GarbageCollection.find({})
      .populate('collectorId', 'personalInfo.name')
      .sort({ updatedAt: -1 });
    
    console.log(`\nTotal collections in database: ${allCollections.length}`);
    
    // Group by status
    const statusCounts = {};
    allCollections.forEach(collection => {
      statusCounts[collection.status] = (statusCounts[collection.status] || 0) + 1;
    });
    
    console.log('\nCollections by Status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Show collections that need collector action (in_progress -> collected)
    const inProgressCollections = allCollections.filter(c => c.status === 'in_progress');
    console.log(`\n🚨 COLLECTIONS WAITING FOR COLLECTOR ACTION (${inProgressCollections.length}):`);
    inProgressCollections.forEach(collection => {
      console.log(`  - ${collection.collectionId} | ${collection.collectionDetails.type} | ${collection.collectionDetails.weight}kg | Collector: ${collection.collectorId?.personalInfo?.name || 'Unknown'}`);
    });
    
    // Show collections ready for admin payment
    const collectedCollections = allCollections.filter(c => c.status === 'collected' && !c.payment?.collectorPaid);
    console.log(`\n💰 COLLECTIONS READY FOR ADMIN PAYMENT (${collectedCollections.length}):`);
    collectedCollections.forEach(collection => {
      console.log(`  - ${collection.collectionId} | ${collection.collectionDetails.type} | ${collection.collectionDetails.weight}kg | Collector: ${collection.collectorId?.personalInfo?.name || 'Unknown'}`);
    });
    
    // Show already paid collections
    const paidCollections = allCollections.filter(c => c.payment?.collectorPaid);
    console.log(`\n✅ ALREADY PAID COLLECTIONS (${paidCollections.length}):`);
    paidCollections.forEach(collection => {
      console.log(`  - ${collection.collectionId} | Paid: ${collection.payment.collectorPaymentAmount || 'Unknown'} | Date: ${collection.payment.collectorPaymentDate ? new Date(collection.payment.collectorPaymentDate).toLocaleDateString() : 'Unknown'}`);
    });
    
    console.log('\n=== SOLUTION ===');
    if (inProgressCollections.length > 0) {
      console.log(`❗ ACTION REQUIRED: You have ${inProgressCollections.length} collections in "in_progress" status.`);
      console.log('👉 Go to CollectorDashboard -> Current Work section');
      console.log('👉 Click "✅ Collect Waste" button for each collection');
      console.log('👉 This will change status from "in_progress" to "collected"');
      console.log('👉 Then these collections will appear in AdminDashboard for payment');
    } else {
      console.log('✅ No collections waiting for collector action');
    }
    
    if (collectedCollections.length > 0) {
      console.log(`💰 ADMIN ACTION: ${collectedCollections.length} collections ready for payment in AdminDashboard`);
    }
    
    console.log('\n==============================================');
    
  } catch (error) {
    console.error('Error checking payments:', error);
  } finally {
    process.exit(0);
  }
}

checkPayments();