# EcoChain API Documentation

## Base URL
```
https://api.ecochain.com/v1
```

## Authentication
Most endpoints require authentication using JWT (JSON Web Token).

### Headers
```
Authorization: Bearer <access_token>
```

## Error Handling
All API responses follow a standard format:

```json
{
  "success": true|false,
  "message": "Description of the result",
  "code": "ERROR_CODE",
  "data": { ... }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Invalid input data
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `INVALID_TOKEN`: Invalid or expired token
- `SERVER_ERROR`: Internal server error

## Rate Limiting
API requests are rate limited to prevent abuse. Limits vary by endpoint:
- Authentication endpoints: 10 requests per minute
- General API endpoints: 60 requests per minute

When rate limit is exceeded, the API returns status code `429 Too Many Requests`.

## Endpoints

### Authentication

#### Register User
```
POST /auth/register
```

Creates a new user account and sends verification OTP.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "role": "consumer|factory|collector"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "userId": "user123",
    "email": "john@example.com"
  }
}
```

#### Verify OTP
```
POST /auth/verify-otp
```

Verifies user email with OTP sent during registration.

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### Login
```
POST /auth/login
```

Authenticates a user and returns access and refresh tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "consumer"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

#### Refresh Token
```
POST /auth/refresh-token
```

Generates a new access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Logout
```
POST /auth/logout
```

Invalidates the user's refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Products

#### Get All Products
```
GET /products
```

Returns a list of all products with optional filtering and pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sort`: Sort field (default: createdAt)
- `order`: Sort order (asc/desc, default: desc)
- `category`: Filter by category
- `minPrice`: Minimum price
- `maxPrice`: Maximum price

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "product123",
        "name": "Eco-friendly Water Bottle",
        "description": "Reusable water bottle made from recycled materials",
        "price": 19.99,
        "category": "household",
        "images": ["url1", "url2"],
        "factory": {
          "id": "factory123",
          "name": "Green Products Inc."
        },
        "sustainabilityScore": 85,
        "createdAt": "2023-01-15T12:00:00Z"
      }
    ],
    "pagination": {
      "total": 50,
      "pages": 5,
      "currentPage": 1,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### Get Product by ID
```
GET /products/:id
```

Returns detailed information about a specific product.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "product123",
    "name": "Eco-friendly Water Bottle",
    "description": "Reusable water bottle made from recycled materials",
    "price": 19.99,
    "category": "household",
    "images": ["url1", "url2"],
    "factory": {
      "id": "factory123",
      "name": "Green Products Inc.",
      "location": "Portland, OR"
    },
    "materials": [
      {
        "name": "Recycled Plastic",
        "percentage": 80,
        "source": "Post-consumer waste"
      },
      {
        "name": "Bamboo",
        "percentage": 20,
        "source": "Sustainable farms"
      }
    ],
    "sustainabilityScore": 85,
    "carbonFootprint": "2.3kg CO2e",
    "certifications": ["Cradle to Cradle", "B Corp"],
    "reviews": [
      {
        "user": "user456",
        "rating": 4.5,
        "comment": "Great product, very durable!",
        "date": "2023-02-10T15:30:00Z"
      }
    ],
    "createdAt": "2023-01-15T12:00:00Z"
  }
}
```

#### Create Product
```
POST /products
```

Creates a new product (factory role required).

**Request Body:**
```json
{
  "name": "Eco-friendly Water Bottle",
  "description": "Reusable water bottle made from recycled materials",
  "price": 19.99,
  "category": "household",
  "images": ["url1", "url2"],
  "materials": [
    {
      "name": "Recycled Plastic",
      "percentage": 80,
      "source": "Post-consumer waste"
    },
    {
      "name": "Bamboo",
      "percentage": 20,
      "source": "Sustainable farms"
    }
  ],
  "carbonFootprint": "2.3kg CO2e",
  "certifications": ["Cradle to Cradle", "B Corp"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "product123",
    "name": "Eco-friendly Water Bottle",
    "sustainabilityScore": 85
  }
}
```

### Orders

#### Create Order
```
POST /orders
```

Creates a new order for products.

**Request Body:**
```json
{
  "products": [
    {
      "productId": "product123",
      "quantity": 2
    },
    {
      "productId": "product456",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "street": "123 Green St",
    "city": "Eco City",
    "state": "EC",
    "zipCode": "12345",
    "country": "USA"
  },
  "paymentMethod": "credit_card",
  "paymentDetails": {
    "cardToken": "tok_visa"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "orderId": "order123",
    "total": 59.97,
    "ecoPoints": 120,
    "estimatedDelivery": "2023-03-15T12:00:00Z"
  }
}
```

#### Get User Orders
```
GET /orders
```

Returns a list of orders placed by the authenticated user.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (processing, shipped, delivered, cancelled)

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order123",
        "date": "2023-03-01T14:30:00Z",
        "total": 59.97,
        "status": "processing",
        "products": [
          {
            "id": "product123",
            "name": "Eco-friendly Water Bottle",
            "quantity": 2,
            "price": 19.99
          },
          {
            "id": "product456",
            "name": "Bamboo Toothbrush",
            "quantity": 1,
            "price": 19.99
          }
        ],
        "shippingAddress": {
          "street": "123 Green St",
          "city": "Eco City",
          "state": "EC",
          "zipCode": "12345",
          "country": "USA"
        },
        "ecoPoints": 120,
        "estimatedDelivery": "2023-03-15T12:00:00Z"
      }
    ],
    "pagination": {
      "total": 5,
      "pages": 1,
      "currentPage": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### Recycling

#### Submit Recycling Request
```
POST /recycling/requests
```

Submits a new recycling request (consumer role).

**Request Body:**
```json
{
  "materials": [
    {
      "type": "plastic",
      "quantity": 5,
      "unit": "kg"
    },
    {
      "type": "paper",
      "quantity": 3,
      "unit": "kg"
    }
  ],
  "pickupAddress": {
    "street": "123 Green St",
    "city": "Eco City",
    "state": "EC",
    "zipCode": "12345",
    "country": "USA"
  },
  "preferredPickupDate": "2023-03-20T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Recycling request submitted successfully",
  "data": {
    "requestId": "req123",
    "estimatedEcoPoints": 80,
    "status": "pending"
  }
}
```

#### Get Available Recycling Requests
```
GET /recycling/requests/available
```

Returns a list of available recycling requests (collector role).

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `location`: Filter by location proximity
- `materialType`: Filter by material type

**Response:**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "req123",
        "materials": [
          {
            "type": "plastic",
            "quantity": 5,
            "unit": "kg"
          },
          {
            "type": "paper",
            "quantity": 3,
            "unit": "kg"
          }
        ],
        "location": {
          "city": "Eco City",
          "state": "EC",
          "zipCode": "12345"
        },
        "preferredPickupDate": "2023-03-20T10:00:00Z",
        "estimatedEcoPoints": 80,
        "distance": "3.2 km"
      }
    ],
    "pagination": {
      "total": 15,
      "pages": 2,
      "currentPage": 1,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### User Profile

#### Get User Profile
```
GET /users/profile
```

Returns the authenticated user's profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user123",
    "userId": "user123",
    "personalInfo": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "profileImage": "url"
    },
    "role": "consumer",
    "ecoWallet": {
      "balance": 500,
      "transactions": [
        {
          "id": "tx123",
          "type": "credit",
          "amount": 120,
          "description": "Recycling reward",
          "date": "2023-02-15T09:30:00Z"
        }
      ]
    },
    "sustainabilityScore": 75,
    "addresses": [
      {
        "id": "addr123",
        "type": "home",
        "street": "123 Green St",
        "city": "Eco City",
        "state": "EC",
        "zipCode": "12345",
        "country": "USA",
        "isDefault": true
      }
    ],
    "preferences": {
      "notifications": {
        "email": true,
        "push": true,
        "sms": false
      },
      "privacySettings": {
        "shareProfile": false,
        "shareActivity": true
      }
    }
  }
}
```

#### Update User Profile
```
PUT /users/profile
```

Updates the authenticated user's profile information.

**Request Body:**
```json
{
  "personalInfo": {
    "name": "John Smith",
    "phone": "+1987654321",
    "profileImage": "new_url"
  },
  "preferences": {
    "notifications": {
      "email": true,
      "push": false,
      "sms": true
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "personalInfo": {
      "name": "John Smith",
      "email": "john@example.com",
      "phone": "+1987654321",
      "profileImage": "new_url"
    },
    "preferences": {
      "notifications": {
        "email": true,
        "push": false,
        "sms": true
      }
    }
  }
}
```

## Websocket API

### Connection
```
wss://api.ecochain.com/ws
```

**Connection Parameters:**
- `token`: Valid JWT access token

### Events

#### Real-time Notifications
```json
{
  "type": "notification",
  "data": {
    "id": "notif123",
    "title": "Order Status Update",
    "message": "Your order #order123 has been shipped",
    "timestamp": "2023-03-05T14:30:00Z",
    "read": false,
    "link": "/orders/order123"
  }
}
```

#### Order Status Updates
```json
{
  "type": "order_update",
  "data": {
    "orderId": "order123",
    "status": "shipped",
    "timestamp": "2023-03-05T14:30:00Z",
    "trackingInfo": {
      "carrier": "EcoShip",
      "trackingNumber": "ES123456789",
      "estimatedDelivery": "2023-03-08T12:00:00Z"
    }
  }
}
```

#### Recycling Request Updates
```json
{
  "type": "recycling_update",
  "data": {
    "requestId": "req123",
    "status": "accepted",
    "timestamp": "2023-03-02T10:15:00Z",
    "collector": {
      "id": "collector123",
      "name": "Green Collectors Inc.",
      "rating": 4.8
    },
    "scheduledPickup": "2023-03-20T10:00:00Z"
  }
}
```

## Changelog

### v1.0.0 (2023-03-01)
- Initial API release