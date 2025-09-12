// Check all payment history
require('dotenv').config();
const connectDB = require('./database/connection');
const AdminPayment = require('./database/models/AdminPayment');

async function checkAllPaymentHistory() {
  try {
    await connectDB();
    console.log('🔌 Connected to MongoDB');
    
    console.log('\n=== ALL ADMIN PAYMENT HISTORY ===');
    
    // Get all payments sorted by date
    const payments = await AdminPayment.find({})
      .sort({ createdAt: -1 });
    
    console.log(`Found ${payments.length} total payments:`);
    
    payments.forEach((payment, index) => {
      console.log(`\n${index + 1}. Payment ID: ${payment.paymentId}`);
      console.log(`   Action: ${payment.action}`);
      console.log(`   Amount: ₹${payment.paymentDetails?.amount || 0}`);
      console.log(`   Collection: ${payment.collectionDisplayId}`);
      console.log(`   Collector: ${payment.collectorName || 'N/A'}`);
      console.log(`   Date: ${payment.createdAt.toLocaleString()}`);
      console.log(`   Status: ${payment.status}`);
    });
    
    // Get payment statistics
    console.log('\n=== PAYMENT STATISTICS ===');
    const totalPayments = await AdminPayment.countDocuments();
    const approvedPayments = await AdminPayment.countDocuments({ action: 'approved' });
    const rejectedPayments = await AdminPayment.countDocuments({ action: 'rejected' });
    
    const totalAmountPaid = await AdminPayment.aggregate([
      { $match: { action: 'approved' } },
      { $group: { _id: null, total: { $sum: '$paymentDetails.amount' } } }
    ]);
    
    console.log(`Total Payments: ${totalPayments}`);
    console.log(`Approved Payments: ${approvedPayments}`);
    console.log(`Rejected Payments: ${rejectedPayments}`);
    console.log(`Total Amount Paid: ₹${totalAmountPaid[0]?.total || 0}`);
    
  } catch (error) {
    console.error('❌ Error checking payment history:', error);
  } finally {
    process.exit(0);
  }
}

checkAllPaymentHistory();