// middleware/inputValidation.js
const { body, param, query, validationResult } = require('express-validator');
const { isValidObjectId } = require('../database/validation');

/**
 * Middleware to validate request data
 */

// Helper to process validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Sanitize and escape user input to prevent XSS
const sanitizeInput = (field) => {
  return body(field).trim().escape();
};

// User registration validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
  body('phone').optional().matches(/^\+?[0-9]{10,15}$/).withMessage('Invalid phone number format'),
  body('role').optional().isIn(['user', 'collector', 'factory']).withMessage('Invalid role'),
  validate
];

// Login validation rules
const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

// Product validation rules
const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Product description is required'),
  body('category').isIn(['recycled_goods', 'eco_products', 'services', 'rewards', 'other'])
    .withMessage('Valid product category is required'),
  body('price.tokenAmount').isNumeric().withMessage('Token amount must be a number')
    .custom(value => value >= 0).withMessage('Token amount must be non-negative'),
  body('price.fiatAmount').optional().isNumeric().withMessage('Fiat amount must be a number')
    .custom(value => value >= 0).withMessage('Fiat amount must be non-negative'),
  body('inventory.available').isInt({ min: 0 }).withMessage('Available inventory must be a non-negative integer'),
  body('recycledMaterial').optional()
    .isIn(['plastic', 'paper', 'metal', 'glass', 'electronic', 'organic', 'mixed', 'none'])
    .withMessage('Invalid recycled material'),
  validate
];

// Order validation rules
const orderValidation = [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.productId').custom(isValidObjectId).withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('shippingAddress.name').trim().notEmpty().withMessage('Recipient name is required'),
  body('shippingAddress.street').trim().notEmpty().withMessage('Street address is required'),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
  body('shippingAddress.zipCode').trim().notEmpty().withMessage('ZIP code is required'),
  body('shippingAddress.phone').matches(/^\+?[0-9]{10,15}$/).withMessage('Valid phone number is required'),
  validate
];

// ID parameter validation
const validateIdParam = [
  param('id').custom(isValidObjectId).withMessage('Invalid ID format'),
  validate
];

// User ID parameter validation
const validateUserIdParam = [
  param('userId').custom(isValidObjectId).withMessage('Invalid user ID format'),
  validate
];

// Pagination validation
const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validate
];

// OTP verification validation
const otpValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 characters')
    .matches(/^[0-9]+$/).withMessage('OTP must contain only numbers'),
  validate
];

// Refresh token validation
const refreshTokenValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  validate
];

module.exports = {
  validate,
  sanitizeInput,
  registerValidation,
  loginValidation,
  productValidation,
  orderValidation,
  validateIdParam,
  validateUserIdParam,
  paginationValidation,
  otpValidation,
  refreshTokenValidation
};