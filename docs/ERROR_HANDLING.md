# Error Handling in EcoChain

This document explains the error handling patterns used in the EcoChain application.

## Global Error Handling

The application implements several layers of error handling to ensure consistent responses and prevent crashes:

### 1. Unhandled Rejection Handler

In `server.js`, we have a global handler for unhandled promise rejections:

```javascript
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
  logger.error('Unhandled Rejection details:', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : null
  });
  // Continue running the application instead of crashing
});
```

This prevents the application from crashing when promises reject without a `.catch()` handler.

### 2. Async Error Middleware

The `asyncHandler` middleware in `middleware/asyncHandler.js` wraps async route handlers to automatically catch unhandled promise rejections:

```javascript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    logger.error('Async handler caught error:', {
      url: req.url,
      method: req.method,
      userId: req.user ? req.user.id : 'unauthenticated',
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error occurred',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  });
};
```

### 3. Global Error Handler

The global error handler in `middleware/errorHandler.js` catches any errors that weren't handled elsewhere:

```javascript
const errorHandler = (err, req, res, next) => {
  logger.error('Global error handler caught error:', {
    url: req.url,
    method: req.method,
    userId: req.user ? req.user.id : 'unauthenticated',
    error: err.message,
    stack: err.stack
  });
  
  // Handle specific error types with consistent response format
  // ...
  
  res.status(status).json({
    success: false,
    message,
    total: 0,
    count: 0,
    data: [],
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

## Consistent Response Format

All API responses follow a consistent JSON format:

```json
{
  "success": true/false,
  "message": "Description of what happened",
  "total": number,
  "count": number,
  "data": []
}
```

## Usage Examples

### Using asyncHandler in Controllers

Instead of manually wrapping async functions in try/catch blocks:

```javascript
// Before
const getAllCollections = async (req, res) => {
  try {
    // ... implementation
  } catch (error) {
    // ... error handling
  }
};

// After
const getAllCollections = asyncHandler(async (req, res) => {
  // ... implementation (no try/catch needed)
});
```

### Manual Error Handling When Needed

For cases where you need specific error handling:

```javascript
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  
  // Validate required fields
  if (!name || !email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Name, email, and password are required',
      total: 0,
      count: 0,
      data: []
    });
  }
  
  // ... rest of implementation
});
```

## Best Practices

1. **Always use asyncHandler** for async route handlers to prevent unhandled promise rejections
2. **Provide meaningful error messages** that help with debugging
3. **Log errors with context** including user ID, request URL, and method
4. **Return consistent response format** even for errors
5. **Don't expose sensitive information** in production error responses
6. **Use appropriate HTTP status codes** for different error types

## Error Response Examples

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation Error",
  "total": 0,
  "count": 0,
  "data": [],
  "errors": {
    "email": {
      "message": "Path `email` is required.",
      "name": "ValidatorError",
      "kind": "required",
      "path": "email"
    }
  }
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "Route not found - /api/nonexistent",
  "total": 0,
  "count": 0,
  "data": []
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error occurred",
  "total": 0,
  "count": 0,
  "data": []
}
```