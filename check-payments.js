// Quick check for collections ready for payment
const GarbageCollection = require('./database/models/GarbageCollection');
const mongoose = require('mongoose');
require('dotenv').config();

async function checkCollectionStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecochain', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check all collections
    const allCollections = await GarbageCollection.find({})
      .select('collectionId status payment.collectorPaid tokenCalculation.totalTokensIssued')
      .sort({ updatedAt: -1 });

    console.log('\n=== ALL COLLECTIONS STATUS ===');
    allCollections.forEach(collection => {
      console.log(`${collection.collectionId}: ${collection.status} | Paid: ${collection.payment?.collectorPaid || false} | Tokens: ${collection.tokenCalculation?.totalTokensIssued || 0}`);
    });

    // Check collections ready for payment
    const collectionsForPayment = await GarbageCollection.find({
      status: 'collected',
      'payment.collectorPaid': { $ne: true }
    });

    console.log('\n=== COLLECTIONS READY FOR PAYMENT ===');
    console.log(`Found ${collectionsForPayment.length} collections ready for payment:`);
    collectionsForPayment.forEach(collection => {
      console.log(`- ${collection.collectionId}: ${collection.status}`);
    });

    // Check in_progress collections
    const inProgressCollections = await GarbageCollection.find({ status: 'in_progress' });
    console.log('\n=== IN PROGRESS COLLECTIONS ===');
    console.log(`Found ${inProgressCollections.length} collections in progress:`);
    inProgressCollections.forEach(collection => {
      console.log(`- ${collection.collectionId}: ${collection.status}`);
    });

    console.log('\n=== SUMMARY ===');
    console.log(`Total collections: ${allCollections.length}`);
    console.log(`In progress: ${inProgressCollections.length}`);
    console.log(`Ready for payment: ${collectionsForPayment.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkCollectionStatus();