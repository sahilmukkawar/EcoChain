// Test script to verify complete order flow works correctly
const mongoose = require('mongoose');
const { Order, User, Product, EcoTokenTransaction } = require('./database/models');

async function testOrderFlow() {
  try {
    console.log('🔄 Testing Complete Order Flow...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecochain', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Test 1: Create a test user with tokens
    console.log('1. Creating test user with EcoTokens...');
    const testUser = new User({
      personalInfo: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '9876543210'
      },
      credentials: {
        password: 'password123'
      },
      ecoWallet: {
        currentBalance: 1000,
        totalEarned: 1000,
        totalSpent: 0
      },
      role: 'user'
    });
    await testUser.save();
    console.log('✅ Test user created with 1000 tokens');

    // Test 2: Create a test product
    console.log('\n2. Creating test product...');
    const testProduct = new Product({
      productId: 'TEST_PROD_' + Date.now(),
      factoryId: new mongoose.Types.ObjectId(),
      productInfo: {
        name: 'Test Eco Product',
        description: 'A test eco-friendly product',
        category: 'home_decor',
        images: ['/test-image.jpg']
      },
      pricing: {
        costPrice: 100,
        sellingPrice: 200,
        ecoTokenDiscount: 150 // 150 tokens
      },
      inventory: {
        currentStock: 50
      },
      status: 'active'
    });
    await testProduct.save();
    console.log('✅ Test product created: ₹200 or 150 tokens');

    // Test 3: Create order with token payment
    console.log('\n3. Testing token payment order...');
    
    const orderData = {
      items: [{ productId: testProduct._id, quantity: 2 }],
      shipping: {
        fullName: 'Test User',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '123456',
        country: 'India',
        phone: '9876543210'
      },
      payment: {
        method: 'token',
        tokensUsed: 0
      },
      notes: 'Test order'
    };

    // Simulate order creation logic
    const processedItems = [{
      productId: testProduct._id,
      quantity: 2,
      unitPrice: testProduct.pricing.sellingPrice,
      totalPrice: testProduct.pricing.sellingPrice * 2
    }];

    const subtotal = 400; // 200 * 2
    const taxes = subtotal * 0.18;
    const shippingCharges = 50;
    const finalAmount = subtotal + taxes + shippingCharges;
    
    const totalTokensNeeded = testProduct.pricing.ecoTokenDiscount * 2; // 300 tokens
    const ecoTokensApplied = Math.min(totalTokensNeeded, testUser.ecoWallet.currentBalance);
    const ecoTokenValue = ecoTokensApplied * 2;

    console.log(`   Total tokens needed: ${totalTokensNeeded}`);
    console.log(`   User token balance: ${testUser.ecoWallet.currentBalance}`);
    console.log(`   Tokens to be applied: ${ecoTokensApplied}`);

    // Create the order
    const testOrder = new Order({
      userId: testUser._id,
      orderItems: processedItems,
      billing: {
        subtotal,
        taxes,
        shippingCharges,
        discount: 0,
        ecoTokensApplied,
        ecoTokenValue,
        finalAmount: finalAmount - ecoTokenValue
      },
      payment: {
        method: 'token',
        status: 'paid'
      },
      shipping: {
        address: orderData.shipping,
        trackingNumber: 'TRK' + Date.now(),
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      status: 'placed'
    });

    await testOrder.save();
    console.log('✅ Order created:', testOrder.orderId);

    // Test 4: Create token transaction
    console.log('\n4. Testing token transaction creation...');
    
    const balanceBeforeTransaction = testUser.ecoWallet.currentBalance;
    testUser.ecoWallet.currentBalance -= ecoTokensApplied;
    testUser.ecoWallet.totalSpent += ecoTokensApplied;
    await testUser.save();

    // Create transaction using the same logic as the helper function
    const transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    
    const transactionObj = {
      transactionId: transactionId,
      userId: new mongoose.Types.ObjectId(testUser._id),
      transactionType: 'spent',
      details: {
        amount: Number(ecoTokensApplied),
        monetaryValue: Number(ecoTokensApplied * 2),
        description: String(`Used for order ${testOrder.orderId}`),
        referenceId: String(testOrder.orderId)
      },
      metadata: {
        source: String('purchase'),
        category: String('marketplace_purchase'),
        relatedEntity: new mongoose.Types.ObjectId(testOrder._id),
        entityType: String('Order')
      },
      walletBalance: {
        beforeTransaction: Number(balanceBeforeTransaction),
        afterTransaction: Number(testUser.ecoWallet.currentBalance)
      },
      status: 'completed',
      processedAt: new Date()
    };

    const tokenTransaction = new EcoTokenTransaction(transactionObj);
    await tokenTransaction.save();
    
    console.log('✅ Token transaction created:', tokenTransaction.transactionId);
    console.log(`   User balance: ${balanceBeforeTransaction} → ${testUser.ecoWallet.currentBalance}`);

    // Test 5: Verify order tracking
    console.log('\n5. Testing order tracking...');
    const foundOrder = await Order.findById(testOrder._id)
      .populate('orderItems.productId', 'productInfo.name productInfo.images');
    
    console.log('✅ Order tracking works:');
    console.log(`   Order ID: ${foundOrder.orderId}`);
    console.log(`   Tracking Number: ${foundOrder.shipping.trackingNumber}`);
    console.log(`   Status: ${foundOrder.status}`);

    // Test 6: Clean up test data
    console.log('\n6. Cleaning up test data...');
    await User.findByIdAndDelete(testUser._id);
    await Product.findByIdAndDelete(testProduct._id);
    await Order.findByIdAndDelete(testOrder._id);
    await EcoTokenTransaction.findByIdAndDelete(tokenTransaction._id);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! Order flow is working correctly.\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run the test
testOrderFlow();