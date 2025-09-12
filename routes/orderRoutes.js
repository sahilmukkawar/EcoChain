// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { Order, Product, User, EcoTokenTransaction } = require('../database/models');
const { authenticate } = require('../middleware/auth');

// Create new order
router.post('/', authenticate, async (req, res) => {
  try {
    const { items, shipping, payment, notes } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Calculate order details
    let subtotal = 0;
    let totalTokens = 0;
    const processedItems = [];

    for (const item of items) {
      // Use the correct Product model from database/models
      const { Product } = require('../database/models');
      const product = await Product.findById(item.productId);
      
      if (!product || !product.isInStock()) {
        return res.status(400).json({ 
          success: false, 
          message: `Product ${product?.productInfo.name || 'unknown'} is not available` 
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
      const itemTokenTotal = product.pricing.costPrice * item.quantity;
      subtotal += itemTotal;
      totalTokens += itemTokenTotal;

      processedItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.pricing.sellingPrice,
        tokenPrice: product.pricing.costPrice,
        totalPrice: itemTotal
      });
    }

    // Calculate final amounts
    const taxes = subtotal * 0.18; // 18% GST
    const shippingCharges = subtotal > 500 ? 0 : 50;
    const finalAmount = subtotal + taxes + shippingCharges;

    const order = new Order({
      userId: req.user.id,
      orderItems: processedItems,
      billing: {
        subtotal,
        taxes,
        shippingCharges,
        discount: 0,
        finalAmount
      },
      payment: {
        method: payment.method,
        status: 'pending'
      },
      shipping: {
        address: {
          name: shipping.fullName || user.personalInfo.name,
          phone: shipping.phone || user.personalInfo.phone,
          street: shipping.address,
          city: shipping.city,
          state: shipping.state,
          zipCode: shipping.zipCode,
          country: shipping.country || 'India'
        },
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    await order.save();

    // Update product inventory
    for (const item of processedItems) {
      const { Product } = require('../database/models');
      const product = await Product.findById(item.productId);
      if (product) {
        await product.updateStock(item.quantity, 'subtract');
      }
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

// Get order by tracking number (public endpoint)
router.get('/tracking/:trackingNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ 'shipping.trackingNumber': req.params.trackingNumber })
      .populate('orderItems.productId', 'productInfo.name productInfo.images')
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