// database/validation.js
const mongoose = require('mongoose');

/**
 * Utility functions for data validation
 */

/**
 * Validate MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 * @param {string} phone - The phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidPhone = (phone) => {
  // Basic phone validation - can be enhanced for specific formats
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate password strength
 * @param {string} password - The password to validate
 * @returns {Object} - Validation result with isValid flag and message
 */
const validatePasswordStrength = (password) => {
  if (!password || password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUpperCase) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!hasLowerCase) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!hasNumbers) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  if (!hasSpecialChar) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }
  
  return { isValid: true, message: 'Password meets strength requirements' };
};

/**
 * Validate coordinates
 * @param {number} longitude - Longitude coordinate
 * @param {number} latitude - Latitude coordinate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidCoordinates = (longitude, latitude) => {
  return (
    typeof longitude === 'number' &&
    typeof latitude === 'number' &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
};

/**
 * Validate date format
 * @param {string} dateStr - The date string to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidDate = (dateStr) => {
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
};

/**
 * Validate user input for registration
 * @param {Object} userData - User registration data
 * @returns {Object} - Validation result with isValid flag and errors
 */
const validateUserRegistration = (userData) => {
  const errors = {};
  
  // Validate name
  if (!userData.personalInfo?.name || userData.personalInfo.name.trim() === '') {
    errors.name = 'Name is required';
  }
  
  // Validate email
  if (!userData.personalInfo?.email || !isValidEmail(userData.personalInfo.email)) {
    errors.email = 'Valid email is required';
  }
  
  // Validate phone if provided
  if (userData.personalInfo?.phone && !isValidPhone(userData.personalInfo.phone)) {
    errors.phone = 'Invalid phone number format';
  }
  
  // Validate password
  if (!userData.password) {
    errors.password = 'Password is required';
  } else {
    const passwordValidation = validatePasswordStrength(userData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.message;
    }
  }
  
  // Validate role if provided
  if (userData.role && !['user', 'collector', 'factory', 'admin'].includes(userData.role)) {
    errors.role = 'Invalid role';
  }
  
  // Validate coordinates if provided
  if (userData.address?.coordinates?.coordinates) {
    const [longitude, latitude] = userData.address.coordinates.coordinates;
    if (!isValidCoordinates(longitude, latitude)) {
      errors.coordinates = 'Invalid coordinates';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate garbage collection input
 * @param {Object} collectionData - Garbage collection data
 * @returns {Object} - Validation result with isValid flag and errors
 */
const validateGarbageCollection = (collectionData) => {
  const errors = {};
  
  // Validate userId
  if (!collectionData.userId || !isValidObjectId(collectionData.userId)) {
    errors.userId = 'Valid user ID is required';
  }
  
  // Validate collection details
  if (!collectionData.collectionDetails) {
    errors.collectionDetails = 'Collection details are required';
  } else {
    // Validate material type
    if (!collectionData.collectionDetails.type || 
        !['plastic', 'paper', 'metal', 'glass', 'electronic', 'organic', 'other'].includes(collectionData.collectionDetails.type)) {
      errors.materialType = 'Valid material type is required';
    }
    
    // Validate weight if provided
    if (collectionData.collectionDetails.weight && 
        (typeof collectionData.collectionDetails.weight !== 'number' || collectionData.collectionDetails.weight <= 0)) {
      errors.weight = 'Weight must be a positive number';
    }
    
    // Validate quality if provided
    if (collectionData.collectionDetails.quality && 
        !['poor', 'fair', 'good', 'excellent'].includes(collectionData.collectionDetails.quality)) {
      errors.quality = 'Invalid quality value';
    }
  }
  
  // Validate location
  if (!collectionData.location) {
    errors.location = 'Location is required';
  } else {
    // Validate pickup address
    if (!collectionData.location.pickupAddress || collectionData.location.pickupAddress.trim() === '') {
      errors.pickupAddress = 'Pickup address is required';
    }
    
    // Validate coordinates if provided
    if (collectionData.location.coordinates?.coordinates) {
      const [longitude, latitude] = collectionData.location.coordinates.coordinates;
      if (!isValidCoordinates(longitude, latitude)) {
        errors.coordinates = 'Invalid coordinates';
      }
    }
  }
  
  // Validate scheduling
  if (collectionData.scheduling) {
    // Validate dates if provided
    if (collectionData.scheduling.requestedDate && !isValidDate(collectionData.scheduling.requestedDate)) {
      errors.requestedDate = 'Invalid requested date';
    }
    if (collectionData.scheduling.scheduledDate && !isValidDate(collectionData.scheduling.scheduledDate)) {
      errors.scheduledDate = 'Invalid scheduled date';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate marketplace product input
 * @param {Object} productData - Product data
 * @returns {Object} - Validation result with isValid flag and errors
 */
const validateProduct = (productData) => {
  const errors = {};
  
  // Validate name
  if (!productData.name || productData.name.trim() === '') {
    errors.name = 'Product name is required';
  }
  
  // Validate description
  if (!productData.description || productData.description.trim() === '') {
    errors.description = 'Product description is required';
  }
  
  // Validate category
  if (!productData.category || 
      !['recycled_goods', 'eco_products', 'services', 'rewards', 'other'].includes(productData.category)) {
    errors.category = 'Valid product category is required';
  }
  
  // Validate price
  if (!productData.price) {
    errors.price = 'Price is required';
  } else {
    if (typeof productData.price.tokenAmount !== 'number' || productData.price.tokenAmount < 0) {
      errors.tokenAmount = 'Token amount must be a non-negative number';
    }
    
    if (productData.price.fiatAmount && (typeof productData.price.fiatAmount !== 'number' || productData.price.fiatAmount < 0)) {
      errors.fiatAmount = 'Fiat amount must be a non-negative number';
    }
  }
  
  // Validate seller
  if (!productData.sellerId || !isValidObjectId(productData.sellerId)) {
    errors.sellerId = 'Valid seller ID is required';
  }
  
  if (!productData.sellerType || !['factory', 'user', 'system'].includes(productData.sellerType)) {
    errors.sellerType = 'Valid seller type is required';
  }
  
  // Validate recycled material if provided
  if (productData.recycledMaterial && 
      !['plastic', 'paper', 'metal', 'glass', 'electronic', 'organic', 'mixed', 'none'].includes(productData.recycledMaterial)) {
    errors.recycledMaterial = 'Invalid recycled material';
  }
  
  // Validate inventory
  if (!productData.inventory) {
    errors.inventory = 'Inventory is required';
  } else {
    if (typeof productData.inventory.available !== 'number' || productData.inventory.available < 0) {
      errors.available = 'Available inventory must be a non-negative number';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate order input
 * @param {Object} orderData - Order data
 * @returns {Object} - Validation result with isValid flag and errors
 */
const validateOrder = (orderData) => {
  const errors = {};
  
  // Validate buyer
  if (!orderData.buyerId || !isValidObjectId(orderData.buyerId)) {
    errors.buyerId = 'Valid buyer ID is required';
  }
  
  // Validate items
  if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
    errors.items = 'Order must contain at least one item';
  } else {
    const itemErrors = [];
    
    orderData.items.forEach((item, index) => {
      const currentErrors = {};
      
      if (!item.productId || !isValidObjectId(item.productId)) {
        currentErrors.productId = 'Valid product ID is required';
      }
      
      if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        currentErrors.quantity = 'Quantity must be a positive integer';
      }
      
      if (Object.keys(currentErrors).length > 0) {
        itemErrors.push({ index, errors: currentErrors });
      }
    });
    
    if (itemErrors.length > 0) {
      errors.items = itemErrors;
    }
  }
  
  // Validate shipping address
  if (!orderData.shippingAddress) {
    errors.shippingAddress = 'Shipping address is required';
  } else {
    if (!orderData.shippingAddress.name || orderData.shippingAddress.name.trim() === '') {
      errors.shippingName = 'Recipient name is required';
    }
    
    if (!orderData.shippingAddress.street || orderData.shippingAddress.street.trim() === '') {
      errors.shippingStreet = 'Street address is required';
    }
    
    if (!orderData.shippingAddress.city || orderData.shippingAddress.city.trim() === '') {
      errors.shippingCity = 'City is required';
    }
    
    if (!orderData.shippingAddress.zipCode || orderData.shippingAddress.zipCode.trim() === '') {
      errors.shippingZipCode = 'ZIP code is required';
    }
    
    if (!orderData.shippingAddress.phone || !isValidPhone(orderData.shippingAddress.phone)) {
      errors.shippingPhone = 'Valid phone number is required';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  isValidObjectId,
  isValidEmail,
  isValidPhone,
  validatePasswordStrength,
  isValidCoordinates,
  isValidDate,
  validateUserRegistration,
  validateGarbageCollection,
  validateProduct,
  validateOrder
};