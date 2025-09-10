// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { Product, Factory, ProductReview } = require('../database/models');
const { authenticate } = require('../middleware/auth');

// Get all products with filters and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = { 'availability.isActive': true };
    
    if (category) filters['productInfo.category'] = category;
    if (minPrice || maxPrice) {
      filters['pricing.sellingPrice'] = {};
      if (minPrice) filters['pricing.sellingPrice'].$gte = parseFloat(minPrice);
      if (maxPrice) filters['pricing.sellingPrice'].$lte = parseFloat(maxPrice);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    let query = Product.find(filters)
      .populate('factoryId', 'companyInfo.name location.city')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    if (search) {
      query = Product.find({
        ...filters,
        $text: { $search: search }
      })
      .populate('factoryId', 'companyInfo.name location.city')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    }

    const products = await query;
    const total = await Product.countDocuments(filters);

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('factoryId', 'companyInfo.name location.city businessMetrics.sustainabilityRating');
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Get product reviews
    const reviews = await ProductReview.find({ productId: product._id })
      .populate('userId', 'personalInfo.name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        ...product.toObject(),
        reviews
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new product (Factory only)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'factory') {
      return res.status(403).json({ success: false, message: 'Only factories can create products' });
    }

    // Find factory profile
    const factory = await Factory.findOne({ userId: req.user.id });
    if (!factory) {
      return res.status(404).json({ success: false, message: 'Factory profile not found' });
    }

    const productData = {
      ...req.body,
      factoryId: factory._id,
      productId: 'PRD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase()
    };

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update product (Factory only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'factory') {
      return res.status(403).json({ success: false, message: 'Only factories can update products' });
    }

    const factory = await Factory.findOne({ userId: req.user.id });
    if (!factory) {
      return res.status(404).json({ success: false, message: 'Factory profile not found' });
    }

    const product = await Product.findOne({ _id: req.params.id, factoryId: factory._id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    Object.assign(product, req.body);
    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete product (Factory only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'factory') {
      return res.status(403).json({ success: false, message: 'Only factories can delete products' });
    }

    const factory = await Factory.findOne({ userId: req.user.id });
    if (!factory) {
      return res.status(404).json({ success: false, message: 'Factory profile not found' });
    }

    const product = await Product.findOne({ _id: req.params.id, factoryId: factory._id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add product review
router.post('/:id/reviews', authenticate, async (req, res) => {
  try {
    const { rating, reviewText, pros, cons, sustainabilityRating, wouldRecommend } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if user has purchased this product
    const { Order } = require('../database/models');
    const userOrder = await Order.findOne({
      userId: req.user.id,
      'orderItems.productId': product._id,
      status: 'delivered'
    });

    if (!userOrder) {
      return res.status(403).json({ success: false, message: 'You can only review products you have purchased' });
    }

    const review = new ProductReview({
      productId: product._id,
      userId: req.user.id,
      orderId: userOrder._id,
      rating,
      reviewText,
      pros,
      cons,
      sustainabilityRating,
      wouldRecommend
    });

    await review.save();
    await product.updateRating(rating);

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: review
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
