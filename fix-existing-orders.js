// Migration script to fix existing orders with incorrect ecoTokenValue calculations
require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./database/models/Order');

async function fixExistingOrders() {
  try {
    console.log('🔄 Fixing existing orders with incorrect ecoTokenValue calculations...\n');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecochain';
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Find all orders that have ecoTokensApplied but might have incorrect ecoTokenValue
    const orders = await Order.find({
      'billing.ecoTokensApplied': { $gt: 0 }
    });
    
    console.log(`Found ${orders.length} orders with EcoToken payments to check...\n`);
    
    let fixedCount = 0;
    
    for (const order of orders) {
      // Calculate what the ecoTokenValue should be with the new rate (1 token = ₹2)
      const correctEcoTokenValue = order.billing.ecoTokensApplied * 2;
      
      // Check if the current ecoTokenValue is incorrect
      // If it's using the old rate (1 token = ₹0.1), it would be much smaller
      if (order.billing.ecoTokenValue < correctEcoTokenValue * 0.5) { // If it's less than half of what it should be
        console.log(`Fixing order ${order.orderId}:`);
        console.log(`  Current ecoTokenValue: ₹${order.billing.ecoTokenValue}`);
        console.log(`  Correct ecoTokenValue: ₹${correctEcoTokenValue}`);
        console.log(`  EcoTokens applied: ${order.billing.ecoTokensApplied}`);
        
        // Update the ecoTokenValue
        order.billing.ecoTokenValue = correctEcoTokenValue;
        
        // Recalculate the final amount
        order.calculateTotal();
        
        // Save the updated order
        await order.save();
        
        console.log(`  ✅ Fixed order ${order.orderId}\n`);
        fixedCount++;
      }
    }
    
    console.log(`\n🎉 Migration complete! Fixed ${fixedCount} orders.`);
    console.log('All orders now use the correct EcoToken conversion rate (1 token = ₹2).');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

// Run the migration
fixExistingOrders();