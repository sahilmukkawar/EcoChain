// routes/marketplaceRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { Product } = require('../database/models');

// Get all products with optional filters
router.get('/products', async (req, res, next) => {
  try {
    const { category, subCategory, tags } = req.query;

    const query = {};
    if (category) query.category = category;
    if (subCategory) query.subCategory = subCategory;
    if (tags) query.tags = { $in: Array.isArray(tags) ? tags : [tags] };

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.status(200).json({ products });
  } catch (error) {
    next(error);
  }
});

// Get a specific product
router.get('/products/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
});

// Create a new product (factories only)
router.post('/products', authenticate, authorize(['factory', 'admin']), async (req, res, next) => {
  try {
    const product = new Product({
      ...req.body,
      sellerId: req.user.userId,
      sellerType: 'factory',
      status: 'active'
    });
    await product.save();
    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
});

// Update a product (owner or admin)
router.put('/products/:id', authenticate, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (String(product.sellerId) !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    Object.assign(product, req.body);
    await product.save();
    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
});

// Delete a product (owner or admin)
router.delete('/products/:id', authenticate, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (String(product.sellerId) !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    await product.deleteOne();
    res.status(200).json({ message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;