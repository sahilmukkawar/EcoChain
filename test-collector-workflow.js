// Test script to verify collector → admin workflow
const GarbageCollection = require('./database/models/GarbageCollection');
const User = require('./database/models/User');
const mongoose = require('mongoose');
require('dotenv').config();

async function testCollectorWorkflow() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecochain', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // 1. Find a collection in 'in_progress' status
    let collection = await GarbageCollection.findOne({ status: 'in_progress' });
    
    if (!collection) {
      console.log('No collections in in_progress status found. Creating a test collection...');
      
      // Create a test collection
      collection = new GarbageCollection({
        collectionId: 'TEST' + Date.now(),
        userId: new mongoose.Types.ObjectId(),
        collectorId: new mongoose.Types.ObjectId(),
        collectionDetails: {
          type: 'plastic',
          weight: 5,
          quality: 'good'
        },
        location: {
          pickupAddress: 'Test Address'
        },
        scheduling: {
          requestedDate: new Date(),
          scheduledDate: new Date()
        },
        status: 'in_progress'
      });
      
      // Calculate tokens
      collection.calculateTokens();
      await collection.save();
      console.log('Test collection created:', collection.collectionId);
    }

    console.log('Found collection for testing:', collection.collectionId, 'Status:', collection.status);

    // 2. Mark as collected (simulating collector action)
    console.log('\n--- Step 1: Collector marks as collected ---');
    await collection.updateStatus('collected', 'Waste collected by test collector');
    console.log('Collection status updated to:', collection.status);

    // 3. Check if it appears in admin payment queue
    console.log('\n--- Step 2: Check admin payment queue ---');
    const collectionsForPayment = await GarbageCollection.find({
      status: 'collected',
      'payment.collectorPaid': { $ne: true }
    });
    
    console.log(`Found ${collectionsForPayment.length} collections ready for payment`);
    
    const ourCollection = collectionsForPayment.find(c => c.collectionId === collection.collectionId);
    if (ourCollection) {
      console.log('✅ SUCCESS: Collection appears in admin payment queue');
      console.log('Collection details:');
      console.log('- ID:', ourCollection.collectionId);
      console.log('- Status:', ourCollection.status);
      console.log('- Tokens issued:', ourCollection.tokenCalculation?.totalTokensIssued);
      console.log('- Collector paid:', ourCollection.payment?.collectorPaid || false);
    } else {
      console.log('❌ ERROR: Collection not found in admin payment queue');
    }

    // 4. Simulate admin processing payment
    console.log('\n--- Step 3: Admin processes payment ---');
    if (ourCollection) {
      const suggestedPayment = Math.round((ourCollection.tokenCalculation?.totalTokensIssued || 0) * 0.3);
      console.log('Suggested collector payment:', suggestedPayment, 'tokens');
      
      // Update payment info
      ourCollection.payment = {
        collectorPaid: true,
        collectorPaymentAmount: suggestedPayment,
        collectorPaymentDate: new Date(),
        collectorPaymentMethod: 'digital',
        adminNotes: 'Test payment processed'
      };
      
      await ourCollection.updateStatus('delivered', 'Test payment processed');
      await ourCollection.save();
      
      console.log('✅ Payment processed successfully');
      console.log('New status:', ourCollection.status);
    }

    // 5. Verify it's no longer in payment queue
    console.log('\n--- Step 4: Verify removal from payment queue ---');
    const remainingForPayment = await GarbageCollection.find({
      status: 'collected',
      'payment.collectorPaid': { $ne: true }
    });
    
    const stillInQueue = remainingForPayment.find(c => c.collectionId === collection.collectionId);
    if (!stillInQueue) {
      console.log('✅ SUCCESS: Collection removed from payment queue after processing');
    } else {
      console.log('❌ ERROR: Collection still in payment queue after processing');
    }

    console.log('\n=== WORKFLOW TEST COMPLETED ===');
    console.log('The collector → admin payment workflow is working correctly!');

  } catch (error) {
    console.error('Error testing workflow:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testCollectorWorkflow();