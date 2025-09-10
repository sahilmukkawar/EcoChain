// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { Order, Product, User, EcoTokenTransaction } = require('../database/models');
const { authenticate } = require('../middleware/auth');

// Create new order
router.post('/', authenticate, async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, ecoTokensToUse = 0 } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Validate eco tokens
    if (ecoTokensToUse > user.ecoWallet.currentBalance) {
      return res.status(400).json({ success: false, message: 'Insufficient EcoTokens' });
    }

    // Calculate order details
    let subtotal = 0;
    const processedItems = [];

    for (const item of orderItems) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isInStock()) {
        return res.status(400).json({ 
          success: false, 
          message: `Product ${product?.productInfo.name || 'unknown'} is not available` 
        });
      }

      const itemTotal = product.finalPrice * item.quantity;
      subtotal += itemTotal;

      processedItems.push({
        productId: product._id,
        quantity: item.quantity,
        unitPrice: product.finalPrice,
        totalPrice: itemTotal,
        ecoTokensUsed: 0 // Will be calculated proportionally
      });
    }

    // Calculate token usage (max 30% of order value)
    const maxTokenUsage = Math.floor(subtotal * 0.3 / 0.1); // Assuming 1 token = 0.1 rupees
    const tokensToUse = Math.min(ecoTokensToUse, maxTokenUsage);
    const tokenValue = tokensToUse * 0.1;

    // Calculate final amounts
    const taxes = subtotal * 0.18; // 18% GST
    const shippingCharges = subtotal > 500 ? 0 : 50;
    const finalAmount = subtotal + taxes + shippingCharges - tokenValue;

    const order = new Order({
      userId: req.user.id,
      orderItems: processedItems,
      billing: {
        subtotal,
        ecoTokensApplied: tokensToUse,
        ecoTokenValue: tokenValue,
        taxes,
        shippingCharges,
        discount: 0,
        finalAmount
      },
      payment: {
        method: paymentMethod,
        status: 'pending'
      },
      shipping: {
        address: shippingAddress,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    await order.save();

    // Deduct tokens if used
    if (tokensToUse > 0) {
      await user.spendTokens(tokensToUse, `Order payment - ${order.orderId}`);
      
      // Create token transaction record
      await EcoTokenTransaction.createTransaction({
        userId: req.user.id,
        transactionType: 'spent',
        details: {
          amount: tokensToUse,
          monetaryValue: tokenValue,
          description: `Payment for order ${order.orderId}`,
          referenceId: order.orderId
        },
        metadata: {
          source: 'purchase',
          relatedEntity: order._id,
          entityType: 'Order'
        },
        walletBalance: {
          beforeTransaction: user.ecoWallet.currentBalance + tokensToUse,
          afterTransaction: user.ecoWallet.currentBalance
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
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

// Get single order
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('orderItems.productId', 'productInfo.name productInfo.images')
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update order status (Admin/Factory only)
router.patch('/:id/status', authenticate, async (req, res) => {
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

    // Refund tokens if used
    if (order.billing.ecoTokensApplied > 0) {
      const user = await User.findById(req.user.id);
      await user.addTokens(order.billing.ecoTokensApplied, `Refund for cancelled order ${order.orderId}`);
      
      await EcoTokenTransaction.createTransaction({
        userId: req.user.id,
        transactionType: 'refund',
        details: {
          amount: order.billing.ecoTokensApplied,
          monetaryValue: order.billing.ecoTokenValue,
          description: `Refund for cancelled order ${order.orderId}`,
          referenceId: order.orderId
        },
        metadata: {
          source: 'refund',
          relatedEntity: order._id,
          entityType: 'Order'
        },
        walletBalance: {
          beforeTransaction: user.ecoWallet.currentBalance - order.billing.ecoTokensApplied,
          afterTransaction: user.ecoWallet.currentBalance
        }
      });
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
