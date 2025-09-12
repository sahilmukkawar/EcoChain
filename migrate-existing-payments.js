// migrate-existing-payments.js - Migrate existing payment records to AdminPayment collection
const mongoose = require('mongoose');
const connectDB = require('./database/connection');
const GarbageCollection = require('./database/models/GarbageCollection');
const AdminPayment = require('./database/models/AdminPayment');
const User = require('./database/models/User');
require('dotenv').config();

async function migrateExistingPayments() {
  try {
    console.log('🔄 Starting migration of existing payment records...\n');
    
    // Find all collections that have been paid but don't have AdminPayment records
    const paidCollections = await GarbageCollection.find({
      'payment.collectorPaid': true
    })
    .populate('userId', 'personalInfo.name personalInfo.email')
    .populate('collectorId', 'personalInfo.name personalInfo.email')
    .sort({ 'payment.collectorPaymentDate': -1 });
    
    console.log(`Found ${paidCollections.length} paid collections to migrate`);
    
    if (paidCollections.length === 0) {
      console.log('✅ No existing payments found to migrate');
      return;
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const collection of paidCollections) {
      try {
        // Check if this collection already has an AdminPayment record
        const existingRecord = await AdminPayment.findOne({
          collectionId: collection._id
        });
        
        if (existingRecord) {
          console.log(`⏭️  Skipping ${collection.collectionId} - already migrated`);
          skippedCount++;
          continue;
        }
        
        // Find admin who approved the payment (fallback to first admin if not found)
        let adminId = collection.payment.approvedBy;
        if (!adminId) {
          const firstAdmin = await User.findOne({ role: 'admin' });
          adminId = firstAdmin?._id;
        }
        
        if (!adminId) {
          console.log(`❌ Skipping ${collection.collectionId} - no admin found`);
          skippedCount++;
          continue;
        }
        
        // Create AdminPayment record
        const paymentRecord = {
          collectionId: collection._id,
          collectionDisplayId: collection.collectionId,
          adminId: adminId,
          collectorId: collection.collectorId,
          userId: collection.userId,
          action: 'approved',
          paymentDetails: {
            amount: collection.payment.collectorPaymentAmount || 0,
            currency: collection.payment.collectorPaymentCurrency || 'INR',
            paymentMethod: collection.payment.collectorPaymentMethod || 'digital_transfer',
            calculation: {
              baseRate: collection.payment.paymentCalculation?.breakdown?.baseRate || 0,
              weight: collection.collectionDetails.weight || 0,
              qualityMultiplier: collection.payment.paymentCalculation?.breakdown?.qualityMultiplier || 1,
              bonuses: collection.payment.paymentCalculation?.breakdown?.bonuses || 0,
              finalAmount: collection.payment.collectorPaymentAmount || 0,
              breakdown: collection.payment.paymentCalculation || {}
            }
          },
          collectionDetails: {
            wasteType: collection.collectionDetails.type,
            weight: collection.collectionDetails.weight || 0,
            quality: collection.collectionDetails.quality || 'fair',
            pickupDate: collection.scheduling.actualPickupDate || collection.createdAt,
            location: {
              pickupAddress: collection.location?.pickupAddress || 'N/A'
            }
          },
          adminNotes: collection.payment.adminNotes || 'Migrated from existing payment record',
          metadata: {
            migrated: true,
            originalPaymentDate: collection.payment.collectorPaymentDate,
            migrationDate: new Date()
          }
        };
        
        // Override createdAt and processedAt to match original payment date
        const adminPayment = new AdminPayment(paymentRecord);
        
        // Generate paymentId since pre-save middleware might not work with manual timestamps
        const timestamp = collection.payment.collectorPaymentDate?.getTime() || Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        adminPayment.paymentId = `AP-${timestamp}-${randomStr}`;
        
        if (collection.payment.collectorPaymentDate) {
          adminPayment.createdAt = collection.payment.collectorPaymentDate;
          adminPayment.processedAt = collection.payment.collectorPaymentDate;
        }
        
        await adminPayment.save();
        
        console.log(`✅ Migrated ${collection.collectionId} - ₹${collection.payment.collectorPaymentAmount}`);
        migratedCount++;
        
      } catch (error) {
        console.log(`❌ Failed to migrate ${collection.collectionId}:`, error.message);
        skippedCount++;
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Successfully migrated: ${migratedCount} payments`);
    console.log(`⏭️  Skipped: ${skippedCount} payments`);
    console.log(`📝 Total processed: ${paidCollections.length} payments`);
    
    if (migratedCount > 0) {
      console.log(`\n🎉 Migration completed! Payment history should now be visible in the admin dashboard.`);
      console.log(`\n🔍 To verify:`);
      console.log(`1. Refresh your admin dashboard`);
      console.log(`2. Click on the "Payment History" tab`);
      console.log(`3. You should see ${migratedCount} payment records`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

module.exports = { migrateExistingPayments };

// Run migration if called directly
if (require.main === module) {
  // Use the existing connectDB function
  connectDB().then(() => {
    console.log('📦 Connected to database');
    migrateExistingPayments().then(() => {
      mongoose.connection.close();
      process.exit(0);
    });
  }).catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });
}