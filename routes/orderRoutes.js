// routes/orderRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { Order, Product, User, EcoTokenTransaction, Factory } = require('../database/models');
const { authenticate } = require('../middleware/auth');

// Helper function to create EcoTokenTransaction with all required fields
const createTokenTransaction = async (transactionData) => {
  try {
    console.log('Creating token transaction with data:', transactionData);
    
    // Generate unique transaction ID
    const transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    
    // Prepare the complete transaction object with all required fields
    const transactionObj = {
      transactionId: transactionId,
      userId: new mongoose.Types.ObjectId(transactionData.userId),
      transactionType: transactionData.transactionType,
      details: {
        amount: Number(transactionData.details.amount),
        monetaryValue: Number(transactionData.details.monetaryValue),
        description: String(transactionData.details.description),
        referenceId: String(transactionData.details.referenceId)
      },
      metadata: {
        source: String(transactionData.metadata.source),
        category: String(transactionData.metadata.category || 'marketplace_transaction'),
        relatedEntity: new mongoose.Types.ObjectId(transactionData.metadata.relatedEntity),
        entityType: String(transactionData.metadata.entityType)
      },
      walletBalance: {
        beforeTransaction: Number(transactionData.walletBalance.beforeTransaction),
        afterTransaction: Number(transactionData.walletBalance.afterTransaction)
      },
      status: 'completed',
      processedAt: new Date()
    };
    
    console.log('Complete transaction object:', JSON.stringify(transactionObj, null, 2));
    
    // Create and save the transaction
    const transaction = new EcoTokenTransaction(transactionObj);
    const savedTransaction = await transaction.save();
    
    console.log('Token transaction saved successfully:', savedTransaction.transactionId);
    return savedTransaction;
    
  } catch (error) {
    console.error('Error creating token transaction:', error);
    console.error('Transaction data that failed:', transactionData);
    throw new Error(`Failed to create token transaction: ${error.message}`);
  }
};

// Create new order
router.post('/', authenticate, async (req, res) => {
  try {
    const { items, shipping, payment, notes } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Initialize ecoWallet if it doesn't exist
    if (!user.ecoWallet) {
      user.ecoWallet = {
        currentBalance: 0,
        totalEarned: 0,
        totalSpent: 0
      };
      await user.save();
    }

    // Calculate order details
    let subtotal = 0;
    let totalTokens = 0;
    const processedItems = [];

    for (const item of items) {
      // Use the correct Product model from database/models
      const { Product } = require('../database/models');
      
      // Handle both ObjectId and string _id formats
      let product;
      if (mongoose.Types.ObjectId.isValid(item.productId)) {
        // Try to find by ObjectId first
        product = await Product.findById(item.productId);
        if (!product) {
          // If not found, try to find by string _id (fallback for legacy data)
          product = await Product.findOne({ _id: item.productId.toString() });
        }
      } else {
        // If productId is not a valid ObjectId, try to find by string _id
        product = await Product.findOne({ _id: item.productId });
      }
      
      if (!product || !product.isInStock()) {
        return res.status(400).json({ 
          success: false, 
          message: `Product ${product?.productInfo.name || item.productId} is not available` 
        });
      }

      // Check if requested quantity is available
      if (item.quantity > product.inventory.currentStock) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${product.productInfo.name}. Only ${product.inventory.currentStock} available.` 
        });
      }

      const itemTotal = product.pricing.sellingPrice * item.quantity;
      // Use the stored token price from the product instead of calculating it
      // The ecoTokenDiscount field stores the actual token price set by the factory
      const tokenPricePerUnit = product.pricing.ecoTokenDiscount || 0; // Use actual token price
      const itemTokenTotal = tokenPricePerUnit * item.quantity;
      subtotal += itemTotal;
      totalTokens += itemTokenTotal;
      
      console.log(`Product: ${product.productInfo.name}`);
      console.log(`  Fiat price per unit: ₹${product.pricing.sellingPrice}`);
      console.log(`  Token price per unit: ${tokenPricePerUnit} tokens`);
      console.log(`  Quantity: ${item.quantity}`);
      console.log(`  Total fiat: ₹${itemTotal}`);
      console.log(`  Total tokens: ${itemTokenTotal} tokens`);

      processedItems.push({
        productId: product._id,
        quantity: item.quantity,
        unitPrice: product.pricing.sellingPrice,
        totalPrice: itemTotal,
        ecoTokensUsed: itemTokenTotal // Add token usage per item
      });
    }

    // Calculate final amounts
    const taxes = subtotal * 0.18; // 18% GST
    const shippingCharges = subtotal > 500 ? 0 : 50;
    const finalAmount = subtotal + taxes + shippingCharges;

    // Handle EcoToken payment - improved logic
    let ecoTokensApplied = 0;
    let ecoTokenValue = 0;
    
    // Check if payment includes tokens (either 'token' method or 'tokensUsed' specified)
    const tokensRequested = payment.tokensUsed || 0;
    
    console.log('\n=== TOKEN PAYMENT CALCULATION ===');
    console.log(`Payment method: ${payment.method}`);
    console.log(`Tokens requested: ${tokensRequested}`);
    console.log(`Total tokens needed for full token payment: ${totalTokens}`);
    console.log(`User token balance: ${user.ecoWallet?.currentBalance || 0}`);
    
    if (payment.method === 'token' || tokensRequested > 0) {
      // For EcoTokens: 1 token = ₹2
      const tokenRate = 2; // 1 token = ₹2
      const userTokenBalance = user.ecoWallet?.currentBalance || 0;
      
      if (payment.method === 'token') {
        // User wants to pay entirely with tokens - check if they have enough tokens
        if (userTokenBalance < totalTokens) {
          console.log(`INSUFFICIENT TOKENS: Need ${totalTokens}, have ${userTokenBalance}`);
          return res.status(400).json({ 
            success: false, 
            message: `Insufficient EcoTokens. You need ${totalTokens} tokens but only have ${userTokenBalance}.` 
          });
        }
        // If they have enough tokens, apply all tokens needed
        ecoTokensApplied = totalTokens;
        console.log(`Token-only payment: applying ${ecoTokensApplied} tokens`);
      } else if (tokensRequested > 0) {
        // Mixed payment - use specified token amount, but check if user has enough
        if (userTokenBalance < tokensRequested) {
          console.log(`INSUFFICIENT TOKENS: Requested ${tokensRequested}, have ${userTokenBalance}`);
          return res.status(400).json({ 
            success: false, 
            message: `Insufficient EcoTokens. You requested ${tokensRequested} tokens but only have ${userTokenBalance}.` 
          });
        }
        ecoTokensApplied = tokensRequested;
        console.log(`Mixed payment: applying ${ecoTokensApplied} tokens`);
      }
      
      ecoTokenValue = ecoTokensApplied * tokenRate;
    }
    
    console.log(`Final tokens to be applied: ${ecoTokensApplied}`);
    console.log(`Token value in rupees: ₹${ecoTokenValue}`);
    console.log('=====================================\n');

    const order = new Order({
      userId: req.user.id,
      orderItems: processedItems,
      billing: {
        subtotal: Math.round(subtotal * 100) / 100, // Round to 2 decimal places
        taxes: Math.round(taxes * 100) / 100, // Round to 2 decimal places
        shippingCharges: Math.round(shippingCharges * 100) / 100, // Round to 2 decimal places
        discount: 0,
        ecoTokensApplied: Math.round(ecoTokensApplied), // Round to integer for tokens
        ecoTokenValue: Math.round(ecoTokenValue * 100) / 100, // Round to 2 decimal places
        finalAmount: 0 // Will be calculated by the model method
      },
      payment: {
        method: payment.method,
        status: payment.method === 'cash' ? 'pending' : 'paid'
      },
      shipping: {
        address: {
          name: shipping.fullName || user.name,
          phone: shipping.phone,
          street: shipping.address,
          city: shipping.city,
          state: shipping.state,
          zipCode: shipping.zipCode,
          country: shipping.country || 'India'
        },
        trackingNumber: 'TRK' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase(),
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      },
      status: 'placed',
      timeline: {
        placedAt: new Date()
      }
    });

    // Calculate the final amount using the model method
    order.calculateTotal();

    await order.save();
    console.log('Order created successfully:', order.orderId, 'with tracking:', order.shipping.trackingNumber);

    // Update product inventory
    for (const item of processedItems) {
      const { Product } = require('../database/models');
      const product = await Product.findById(item.productId);
      if (product) {
        await product.updateStock(item.quantity, 'subtract');
      }
    }

    // Deduct EcoTokens if payment includes tokens
    if ((payment.method === 'token' || tokensRequested > 0) && ecoTokensApplied > 0) {
      const balanceBeforeTransaction = user.ecoWallet.currentBalance;
      
      user.ecoWallet.currentBalance -= ecoTokensApplied;
      user.ecoWallet.totalSpent += ecoTokensApplied;
      await user.save();
      
      // Create EcoToken transaction record with all required fields
      console.log('Creating token transaction:', {
        userId: req.user.id,
        ecoTokensApplied,
        balanceBeforeTransaction,
        balanceAfterTransaction: user.ecoWallet.currentBalance,
        orderId: order.orderId
      });
      
      // Use helper function to create transaction
      await createTokenTransaction({
        userId: req.user.id,
        transactionType: 'spent',
        details: {
          amount: ecoTokensApplied,
          monetaryValue: ecoTokensApplied * 2, // Updated to 1 token = ₹2
          description: `Used for order ${order.orderId}`,
          referenceId: order.orderId
        },
        metadata: {
          source: 'purchase',
          category: 'marketplace_purchase',
          relatedEntity: order._id,
          entityType: 'Order'
        },
        walletBalance: {
          beforeTransaction: balanceBeforeTransaction,
          afterTransaction: user.ecoWallet.currentBalance
        }
      });
      
      console.log(`Token transaction created: ${ecoTokensApplied} tokens deducted for order ${order.orderId}`);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.orderId,
        _id: order._id,
        status: order.status,
        trackingNumber: order.shipping.trackingNumber,
        billing: order.billing,
        tokensDeducted: ecoTokensApplied,
        remainingTokens: user.ecoWallet.currentBalance,
        redirectUrl: `/order-confirmation/${order._id}`,
        trackingUrl: `/order-tracking/${order.shipping.trackingNumber}`
      }
    });
  } catch (error) {
    console.error('Order creation error:', error);
    console.error('Error stack:', error.stack);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to process order',
      debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get user's orders
router.get('/user', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const orders = await Order.getUserOrders(req.user.id, parseInt(page), parseInt(limit));
    const total = await Order.countDocuments({ userId: req.user.id });

    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get factory's orders (Factory only)
router.get('/factory', authenticate, async (req, res) => {
  try {
    console.log('Factory orders route hit');
    console.log('Request user:', req.user);
    
    if (req.user.role !== 'factory') {
      console.log('User is not a factory, role:', req.user.role);
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    console.log('Fetching factory orders for user:', req.user.id);
    
    // Get factory profile to find factory ID
    const factory = await Factory.findOne({ userId: req.user.id });
    if (!factory) {
      console.log('Factory profile not found for user:', req.user.id);
      return res.status(404).json({ success: false, message: 'Factory profile not found' });
    }
    
    console.log('Found factory:', factory._id);

    // Find all products created by this factory
    const factoryProducts = await Product.find({ factoryId: factory._id });
    console.log('Found products:', factoryProducts.length);
    
    const productIds = factoryProducts.map(product => product._id);
    console.log('Product IDs:', productIds);

    // Find all orders that contain these products
    const orders = await Order.find({
      'orderItems.productId': { $in: productIds }
    })
    .populate('orderItems.productId', 'productInfo.name productInfo.images productInfo.description pricing.sellingPrice pricing.ecoTokenDiscount')
    .populate('userId', 'personalInfo.name personalInfo.email')
    .sort({ createdAt: -1 });
    
    console.log('Found orders:', orders.length);

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching factory orders:', error);
    console.error('Error stack:', error.stack);
    
    // Handle Cast to ObjectId failed error specifically
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid ID format in request' });
    }
    
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single order
router.get('/:id', authenticate, async (req, res) => {
  try {
    // Check if the ID is "factory" and redirect to the factory route if so
    if (req.params.id === 'factory') {
      return res.redirect('/api/orders/factory');
    }
    
    const order = await Order.findById(req.params.id)
      .populate('orderItems.productId', 'productInfo.name productInfo.images productInfo.description pricing.sellingPrice pricing.ecoTokenDiscount')
      .populate('userId', 'personalInfo.name personalInfo.email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if user owns this order or is admin
    if (order.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    // Handle Cast to ObjectId failed error specifically
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      console.error('Invalid ObjectId format:', req.params.id);
      return res.status(400).json({ success: false, message: 'Invalid order ID format' });
    }
    
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get order by tracking number (public endpoint)
router.get('/tracking/:trackingNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ 'shipping.trackingNumber': req.params.trackingNumber })
      .populate('orderItems.productId', 'productInfo.name productInfo.images productInfo.description pricing.sellingPrice pricing.ecoTokenDiscount')
      .populate('userId', 'personalInfo.name personalInfo.email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update order status (Admin/Factory only)
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    if (!['admin', 'factory'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { status, trackingNumber, carrier } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await order.updateStatus(status);
    
    if (trackingNumber) order.shipping.trackingNumber = trackingNumber;
    if (carrier) order.shipping.carrier = carrier;
    
    await order.save();

    // Broadcast the update to WebSocket clients
    const socketManager = require('../utils/socketManager');
    socketManager.broadcastUpdate('order', 'update', [{
      _id: order._id,
      orderId: order.orderId,
      status: order.status,
      timeline: order.timeline
    }]);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Cancel order
router.patch('/:id/cancel', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if user owns this order
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Can only cancel if order is placed or confirmed
    if (!['placed', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
    }

    await order.updateStatus('cancelled');
    
    // Refund EcoTokens if they were used
    if (order.billing.ecoTokensApplied > 0) {
      const user = await User.findById(req.user.id);
      if (user) {
        const balanceBeforeRefund = user.ecoWallet.currentBalance;
        
        user.ecoWallet.currentBalance += order.billing.ecoTokensApplied;
        user.ecoWallet.totalSpent -= order.billing.ecoTokensApplied;
        await user.save();
        
        // Create refund transaction with all required fields
        await createTokenTransaction({
          userId: req.user.id,
          transactionType: 'refund',
          details: {
            amount: order.billing.ecoTokensApplied,
            monetaryValue: order.billing.ecoTokensApplied * 2, // Updated to 1 token = ₹2
            description: `Refund for cancelled order ${order.orderId}`,
            referenceId: order.orderId
          },
          metadata: {
            source: 'refund',
            category: 'marketplace_refund',
            relatedEntity: order._id,
            entityType: 'Order'
          },
          walletBalance: {
            beforeTransaction: balanceBeforeRefund,
            afterTransaction: user.ecoWallet.currentBalance
          }
        });
        
        console.log(`Refund transaction created: ${order.billing.ecoTokensApplied} tokens refunded for cancelled order ${order.orderId}`);
      }
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;