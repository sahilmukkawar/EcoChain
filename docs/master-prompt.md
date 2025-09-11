# EcoChain: Smart Waste-to-Product E-Commerce Platform

## Master Development Prompt

This document serves as the comprehensive development guide for building the EcoChain platform end-to-end. It contains all the necessary specifications, architecture details, and implementation guidelines for the engineering and ML teams.

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [MongoDB Schemas](#mongodb-schemas)
4. [API Endpoints](#api-endpoints)
5. [AI Model Specifications](#ai-model-specifications)
6. [Token Economics](#token-economics)
7. [CI/CD Pipeline](#ci-cd-pipeline)
8. [Sprint Plan](#sprint-plan)
9. [Security Guidelines](#security-guidelines)
10. [Sample Code Snippets](#sample-code-snippets)

## Introduction

EcoChain is a revolutionary platform that connects waste collectors, recycling factories, and consumers in a circular economy powered by blockchain-inspired token economics. The platform enables:

- Users to request waste collection and earn EcoTokens
- Collectors to pick up waste materials and deliver them to factories
- Factories to process waste into recycled products
- Consumers to purchase eco-friendly products using EcoTokens or fiat currency

This document provides all the necessary specifications to build the EcoChain platform from scratch.

## Architecture Overview

### Mobile Applications

- **User App (React Native)**: For end-users to request waste collection, track EcoTokens, and purchase products
- **Collector App (React Native)**: For waste collectors to find collection requests, manage pickups, and deliver to factories

### Web Applications

- **Factory Dashboard (React/Next.js)**: For factories to manage incoming materials, product listings, and orders
- **Admin Dashboard (React/Next.js)**: For platform administrators to monitor the system, manage users, and analyze data

### Backend Services

Implement the following microservices using Node.js/Express (or Python/FastAPI for AI services):

1. **Auth Service**: User authentication, authorization, and JWT management
2. **User Service**: User profile management, preferences, and settings
3. **Collection Service**: Waste collection requests, scheduling, and tracking
4. **Vision Service**: AI-powered waste classification and quality assessment
5. **Matching Service**: Matching collection requests with collectors and factories
6. **Routing Service**: Optimizing collection routes for efficiency
7. **Wallet Service**: Managing EcoToken transactions and balances
8. **Marketplace Service**: Product listings, search, and recommendations
9. **Order Service**: Order processing, payment, and fulfillment
10. **Factory Service**: Factory management, material processing, and inventory
11. **Analytics Service**: Data analytics, reporting, and insights
12. **Admin Service**: System administration, configuration, and monitoring

### Infrastructure

- **API Gateway**: NGINX or API Gateway for routing and load balancing
- **Database**: MongoDB Atlas for primary data storage
- **Queue**: Redis + BullMQ for job processing
- **Scheduler**: Cron/Kubernetes CronJob for batch processing
- **Storage**: S3-compatible storage for images and files
- **ML Infrastructure**: GPU-enabled servers for model training, TorchServe/BentoML/Triton for inference
- **Monitoring**: Prometheus + Grafana for metrics, ELK stack for logging
- **CI/CD**: GitHub Actions for continuous integration and deployment
- **Infrastructure as Code**: Terraform for infrastructure provisioning
- **Container Orchestration**: Kubernetes/ECS for deployment

## MongoDB Schemas

Implement the following MongoDB collections with the specified schemas and indexes:

### Users Collection

```json
{
  "_id": ObjectId(),
  "userId": "u_001",
  "personalInfo": {
    "name": "Sahil Mukkawar",
    "email": "sahil@example.com",
    "phone": "+91xxxx",
    "profileImage": "s3://bucket/user/u_001.jpg"
  },
  "password": "hashed_password",
  "address": {
    "street": "Line 1",
    "city": "Nanded",
    "state": "Maharashtra",
    "zipCode": "431605",
    "coordinates": { "type": "Point", "coordinates": [77.317, 19.152] }
  },
  "role": "user",
  "ecoWallet": { "currentBalance": 120, "totalEarned": 500, "totalSpent": 380 },
  "preferences": { "notificationSettings": {}, "preferredPickupTime": "10:00-12:00", "recyclingGoals": 50 },
  "accountStatus": "active",
  "registrationDate": ISODate(),
  "lastActive": ISODate(),
  "kycStatus": "verified",
  "sustainabilityScore": 74
}
```

**Indexes**:
- `userId`: unique
- `personalInfo.email`: unique
- `address.coordinates`: 2dsphere
- `role`: 1
- `accountStatus`: 1

### GarbageCollections Collection

```json
{
  "_id": ObjectId(),
  "collectionId": "col_001",
  "userId": ObjectId("..."),
  "collectorId": ObjectId("..."),
  "factoryId": ObjectId("..."),
  "collectionDetails": {
    "type": "plastic",
    "subType": "PET",
    "weight": 5.2,
    "quality": "good",
    "images": ["s3://.../img1.jpg"],
    "description": "Bottles, cleaned"
  },
  "visionInference": { "material_type":"plastic", "sub_type":"PET", "quality_score":0.82, "inferenceId":"inf_001" },
  "location": { "pickupAddress":"...", "coordinates": { "type":"Point", "coordinates":[77.317,19.152] } },
  "scheduling": { "requestedDate": ISODate(), "scheduledDate": ISODate(), "actualPickupDate": null, "preferredTimeSlot":"10:00-12:00" },
  "tokenCalculation": { "baseRate": 10, "qualityMultiplier": 1.2, "bonusTokens":0, "totalTokensIssued": 62 },
  "status": "requested",
  "verification": { "collectorNotes":"", "factoryFeedback":"", "qualityImages":[], "rejectionReason":"" },
  "logistics": { "estimatedPickupTime": ISODate(), "actualPickupTime": null, "deliveryToFactory": null, "transportCost": 20 },
  "createdAt": ISODate(),
  "updatedAt": ISODate()
}
```

**Indexes**:
- `collectionId`: unique
- `userId`: 1
- `collectorId`: 1
- `factoryId`: 1
- `status`: 1
- `location.coordinates`: 2dsphere
- `scheduling.requestedDate`: 1
- `scheduling.scheduledDate`: 1

### Factories Collection

```json
{
  "_id": ObjectId(),
  "factoryId": "f_001",
  "name": "GreenPlast Recycling",
  "contactInfo": {
    "email": "contact@greenplast.com",
    "phone": "+91xxxx",
    "website": "https://greenplast.com"
  },
  "address": {
    "street": "Industrial Area",
    "city": "Pune",
    "state": "Maharashtra",
    "zipCode": "411057",
    "coordinates": { "type": "Point", "coordinates": [73.8567, 18.5204] }
  },
  "specializations": ["plastic", "paper"],
  "capacity": {
    "daily": 5000,
    "current": 2500,
    "unit": "kg"
  },
  "operatingHours": {
    "monday": { "open": "09:00", "close": "18:00" },
    "tuesday": { "open": "09:00", "close": "18:00" },
    "wednesday": { "open": "09:00", "close": "18:00" },
    "thursday": { "open": "09:00", "close": "18:00" },
    "friday": { "open": "09:00", "close": "18:00" },
    "saturday": { "open": "09:00", "close": "14:00" },
    "sunday": { "open": null, "close": null }
  },
  "rating": 4.5,
  "status": "active",
  "verificationStatus": "verified",
  "registrationDate": ISODate(),
  "lastActive": ISODate()
}
```

**Indexes**:
- `factoryId`: unique
- `address.coordinates`: 2dsphere
- `specializations`: 1
- `status`: 1

### MaterialRequests Collection

```json
{
  "_id": ObjectId(),
  "requestId": "mr_001",
  "factoryId": ObjectId("..."),
  "materialType": "plastic",
  "subType": "PET",
  "quantityRequired": 1000,
  "unit": "kg",
  "pricePerUnit": 15,
  "totalBudget": 15000,
  "description": "Clean PET bottles for recycling",
  "qualityRequirements": "Clean, sorted, labels removed",
  "deadline": ISODate(),
  "status": "open",
  "createdAt": ISODate(),
  "updatedAt": ISODate()
}
```

**Indexes**:
- `requestId`: unique
- `factoryId`: 1
- `materialType`: 1
- `status`: 1
- `deadline`: 1

### Products Collection

```json
{
  "_id": ObjectId(),
  "productId": "p_001",
  "factoryId": ObjectId("..."),
  "name": "Recycled Plastic Bench",
  "description": "Outdoor bench made from 100% recycled plastic",
  "category": "furniture",
  "subcategory": "outdoor",
  "images": ["s3://.../bench1.jpg", "s3://.../bench2.jpg"],
  "price": {
    "fiat": { "amount": 5000, "currency": "INR" },
    "tokens": 500
  },
  "inventory": {
    "available": 10,
    "reserved": 2,
    "sold": 8
  },
  "specifications": {
    "weight": 15,
    "dimensions": { "length": 150, "width": 50, "height": 45, "unit": "cm" },
    "material": "Recycled HDPE",
    "color": "Green",
    "additionalSpecs": { "weatherResistant": true, "uvProtection": true }
  },
  "sustainability": {
    "recycledContent": 100,
    "carbonFootprint": 5.2,
    "certifications": ["GreenSeal", "EcoMark"],
    "impactDescription": "Each bench diverts 50kg of plastic from landfills"
  },
  "status": "active",
  "rating": { "average": 4.5, "count": 12 },
  "tags": ["outdoor", "furniture", "sustainable", "recycled"],
  "createdAt": ISODate(),
  "updatedAt": ISODate()
}
```

**Indexes**:
- `productId`: unique
- `factoryId`: 1
- `category`: 1
- `subcategory`: 1
- `status`: 1
- `price.tokens`: 1
- `tags`: 1
- Text index on `name`, `description`, and `tags`

### Orders Collection

```json
{
  "_id": ObjectId(),
  "orderId": "o_001",
  "userId": ObjectId("..."),
  "items": [
    {
      "productId": ObjectId("..."),
      "name": "Recycled Plastic Bench",
      "quantity": 1,
      "price": { "fiat": { "amount": 5000, "currency": "INR" }, "tokens": 500 },
      "totalPrice": { "fiat": { "amount": 5000, "currency": "INR" }, "tokens": 500 }
    }
  ],
  "totalAmount": { "fiat": { "amount": 5000, "currency": "INR" }, "tokens": 500 },
  "paymentDetails": {
    "method": "tokens",
    "tokenAmount": 500,
    "fiatAmount": 0,
    "fiatCurrency": "INR",
    "transactionId": "tx_001",
    "status": "completed"
  },
  "shippingAddress": {
    "name": "Sahil Mukkawar",
    "street": "Line 1",
    "city": "Nanded",
    "state": "Maharashtra",
    "zipCode": "431605",
    "country": "India",
    "phone": "+91xxxx"
  },
  "status": "processing",
  "tracking": {
    "carrier": "EcoShip",
    "trackingNumber": "ES123456789",
    "estimatedDelivery": ISODate(),
    "shippedAt": ISODate(),
    "deliveredAt": null
  },
  "notes": "Please deliver to the front gate",
  "createdAt": ISODate(),
  "updatedAt": ISODate()
}
```

**Indexes**:
- `orderId`: unique
- `userId`: 1
- `status`: 1
- `createdAt`: 1
- `items.productId`: 1

### EcoTokenTransactions Collection

```json
{
  "_id": ObjectId(),
  "transactionId": "tx_001",
  "userId": ObjectId("..."),
  "type": "collection_reward",
  "amount": 62,
  "relatedId": "col_001",
  "description": "Reward for plastic collection",
  "balanceBefore": 58,
  "balanceAfter": 120,
  "status": "completed",
  "metadata": {
    "collectionDetails": {
      "type": "plastic",
      "weight": 5.2,
      "quality": "good"
    }
  },
  "timestamp": ISODate(),
  "createdAt": ISODate(),
  "updatedAt": ISODate()
}
```

**Indexes**:
- `transactionId`: unique
- `userId`: 1
- `type`: 1
- `relatedId`: 1
- `timestamp`: 1
- `status`: 1

### ProductReviews Collection

```json
{
  "_id": ObjectId(),
  "reviewId": "r_001",
  "productId": ObjectId("..."),
  "userId": ObjectId("..."),
  "orderId": ObjectId("..."),
  "rating": 5,
  "title": "Great product!",
  "review": "This bench is sturdy and looks great in my garden. Love that it's made from recycled materials.",
  "images": ["s3://.../review1.jpg"],
  "verified": true,
  "helpful": { "count": 3, "users": [ObjectId("..."), ObjectId("..."), ObjectId("...")] },
  "status": "approved",
  "createdAt": ISODate(),
  "updatedAt": ISODate()
}
```

**Indexes**:
- `reviewId`: unique
- `productId`: 1
- `userId`: 1
- `orderId`: 1
- `rating`: 1
- `status`: 1

### SystemConfiguration Collection

```json
{
  "_id": ObjectId(),
  "configId": "config_001",
  "category": "token_rates",
  "key": "plastic_base_rate",
  "value": 10,
  "description": "Base token rate per kg for plastic collection",
  "lastUpdated": ISODate(),
  "updatedBy": ObjectId("..."),
  "active": true
}
```

**Indexes**:
- `configId`: unique
- `category`: 1
- `key`: 1
- Compound index on `category` and `key`

### Analytics Collection

```json
{
  "_id": ObjectId(),
  "analyticsId": "a_001",
  "type": "daily_summary",
  "date": ISODate(),
  "metrics": {
    "newUsers": 25,
    "activeUsers": 120,
    "collections": {
      "total": 45,
      "byType": { "plastic": 20, "paper": 15, "metal": 10 },
      "totalWeight": 250.5
    },
    "tokens": {
      "issued": 2500,
      "spent": 1800,
      "netChange": 700
    },
    "orders": {
      "count": 15,
      "totalAmount": { "fiat": 25000, "tokens": 2000 }
    },
    "topProducts": [
      { "productId": ObjectId("..."), "name": "Recycled Plastic Bench", "count": 5 }
    ],
    "topLocations": [
      { "city": "Pune", "count": 12 },
      { "city": "Mumbai", "count": 8 }
    ]
  },
  "createdAt": ISODate()
}
```

**Indexes**:
- `analyticsId`: unique
- `type`: 1
- `date`: 1
- Compound index on `type` and `date`

## API Endpoints

Implement the following API endpoints for each microservice:

### Auth Service

#### POST /api/auth/register

Register a new user.

**Request:**
```json
{
  "name": "Sahil Mukkawar",
  "email": "sahil@example.com",
  "phone": "+91xxxx",
  "password": "securepassword",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "u_001",
      "name": "Sahil Mukkawar",
      "email": "sahil@example.com",
      "role": "user"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900
    }
  }
}
```

#### POST /api/auth/login

Authenticate a user and generate tokens.

**Request:**
```json
{
  "email": "sahil@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "u_001",
      "name": "Sahil Mukkawar",
      "email": "sahil@example.com",
      "role": "user"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900
    }
  }
}
```

#### POST /api/auth/refresh-token

Refresh the access token using a refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

### User Service

#### GET /api/users/profile

Get the current user's profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "u_001",
    "personalInfo": {
      "name": "Sahil Mukkawar",
      "email": "sahil@example.com",
      "phone": "+91xxxx",
      "profileImage": "s3://bucket/user/u_001.jpg"
    },
    "address": {
      "street": "Line 1",
      "city": "Nanded",
      "state": "Maharashtra",
      "zipCode": "431605",
      "coordinates": { "type": "Point", "coordinates": [77.317, 19.152] }
    },
    "role": "user",
    "ecoWallet": { "currentBalance": 120, "totalEarned": 500, "totalSpent": 380 },
    "preferences": { "notificationSettings": {}, "preferredPickupTime": "10:00-12:00", "recyclingGoals": 50 },
    "accountStatus": "active",
    "registrationDate": "2023-01-15T10:30:00Z",
    "lastActive": "2023-06-20T15:45:00Z",
    "kycStatus": "verified",
    "sustainabilityScore": 74
  }
}
```

#### PUT /api/users/profile

Update the current user's profile.

**Request:**
```json
{
  "name": "Sahil M",
  "phone": "+91xxxx",
  "street": "New Address Line 1",
  "city": "Nanded",
  "state": "Maharashtra",
  "zipCode": "431605",
  "coordinates": [77.317, 19.152],
  "preferredPickupTime": "14:00-16:00",
  "recyclingGoals": 75
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "u_001",
    "personalInfo": {
      "name": "Sahil M",
      "email": "sahil@example.com",
      "phone": "+91xxxx",
      "profileImage": "s3://bucket/user/u_001.jpg"
    },
    "address": {
      "street": "New Address Line 1",
      "city": "Nanded",
      "state": "Maharashtra",
      "zipCode": "431605",
      "coordinates": { "type": "Point", "coordinates": [77.317, 19.152] }
    },
    "preferences": { "notificationSettings": {}, "preferredPickupTime": "14:00-16:00", "recyclingGoals": 75 }
  }
}
```

### Collection Service

#### POST /api/collections

Create a new collection request.

**Request:**
```json
{
  "type": "plastic",
  "subType": "PET",
  "weight": 5.2,
  "description": "Bottles, cleaned",
  "pickupAddress": "Line 1, Nanded, Maharashtra, 431605",
  "coordinates": [77.317, 19.152],
  "requestedDate": "2023-06-25T00:00:00Z",
  "preferredTimeSlot": "10:00-12:00"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "collectionId": "col_001",
    "userId": "u_001",
    "collectionDetails": {
      "type": "plastic",
      "subType": "PET",
      "weight": 5.2,
      "quality": "fair",
      "images": ["s3://.../img1.jpg"],
      "description": "Bottles, cleaned"
    },
    "visionInference": { "material_type":"plastic", "sub_type":"PET", "quality_score":0.82, "inferenceId":"inf_001" },
    "location": { "pickupAddress":"Line 1, Nanded, Maharashtra, 431605", "coordinates": { "type":"Point", "coordinates":[77.317,19.152] } },
    "scheduling": { "requestedDate": "2023-06-25T00:00:00Z", "preferredTimeSlot":"10:00-12:00" },
    "tokenCalculation": { "baseRate": 10, "qualityMultiplier": 1.0, "bonusTokens":0, "totalTokensIssued": 52 },
    "status": "requested"
  }
}
```

#### GET /api/collections

Get collection requests for the current user.

**Response:**
```json
{
  "success": true,
  "data": {
    "collections": [
      {
        "collectionId": "col_001",
        "collectionDetails": {
          "type": "plastic",
          "subType": "PET",
          "weight": 5.2,
          "quality": "good",
          "images": ["s3://.../img1.jpg"],
          "description": "Bottles, cleaned"
        },
        "scheduling": { "requestedDate": "2023-06-25T00:00:00Z", "scheduledDate": "2023-06-26T10:00:00Z", "preferredTimeSlot":"10:00-12:00" },
        "tokenCalculation": { "totalTokensIssued": 62 },
        "status": "scheduled"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

### Vision Service

#### POST /api/vision/classify

Classify waste material from an image.

**Request:**
Multipart form data with image file.

**Response:**
```json
{
  "success": true,
  "data": {
    "inferenceId": "inf_001",
    "material_type": "plastic",
    "material_confidence": 0.95,
    "sub_type": "PET",
    "quality_score": 0.82
  }
}
```

### Wallet Service

#### GET /api/wallet/balance

Get the current user's wallet balance.

**Response:**
```json
{
  "success": true,
  "data": {
    "currentBalance": 120,
    "totalEarned": 500,
    "totalSpent": 380,
    "lastTransaction": "2023-06-20T15:45:00Z"
  }
}
```

#### GET /api/wallet/transactions

Get the current user's token transactions.

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "transactionId": "tx_001",
        "type": "collection_reward",
        "amount": 62,
        "relatedId": "col_001",
        "description": "Reward for plastic collection",
        "balanceBefore": 58,
        "balanceAfter": 120,
        "status": "completed",
        "timestamp": "2023-06-20T15:45:00Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

### Marketplace Service

#### GET /api/products

Get products from the marketplace.

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "productId": "p_001",
        "factoryId": "f_001",
        "name": "Recycled Plastic Bench",
        "description": "Outdoor bench made from 100% recycled plastic",
        "category": "furniture",
        "subcategory": "outdoor",
        "images": ["s3://.../bench1.jpg", "s3://.../bench2.jpg"],
        "price": {
          "fiat": { "amount": 5000, "currency": "INR" },
          "tokens": 500
        },
        "inventory": {
          "available": 10
        },
        "sustainability": {
          "recycledContent": 100,
          "impactDescription": "Each bench diverts 50kg of plastic from landfills"
        },
        "rating": { "average": 4.5, "count": 12 }
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

#### GET /api/products/:productId

Get a specific product by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "productId": "p_001",
    "factoryId": "f_001",
    "name": "Recycled Plastic Bench",
    "description": "Outdoor bench made from 100% recycled plastic",
    "category": "furniture",
    "subcategory": "outdoor",
    "images": ["s3://.../bench1.jpg", "s3://.../bench2.jpg"],
    "price": {
      "fiat": { "amount": 5000, "currency": "INR" },
      "tokens": 500
    },
    "inventory": {
      "available": 10,
      "reserved": 2,
      "sold": 8
    },
    "specifications": {
      "weight": 15,
      "dimensions": { "length": 150, "width": 50, "height": 45, "unit": "cm" },
      "material": "Recycled HDPE",
      "color": "Green",
      "additionalSpecs": { "weatherResistant": true, "uvProtection": true }
    },
    "sustainability": {
      "recycledContent": 100,
      "carbonFootprint": 5.2,
      "certifications": ["GreenSeal", "EcoMark"],
      "impactDescription": "Each bench diverts 50kg of plastic from landfills"
    },
    "rating": { "average": 4.5, "count": 12 },
    "reviews": [
      {
        "reviewId": "r_001",
        "userId": "u_002",
        "rating": 5,
        "title": "Great product!",
        "review": "This bench is sturdy and looks great in my garden. Love that it's made from recycled materials.",
        "createdAt": "2023-05-15T10:30:00Z"
      }
    ]
  }
}
```

### Order Service

#### POST /api/orders

Create a new order.

**Request:**
```json
{
  "items": [
    {
      "productId": "p_001",
      "quantity": 1
    }
  ],
  "paymentMethod": "tokens",
  "shippingAddress": {
    "name": "Sahil Mukkawar",
    "street": "Line 1",
    "city": "Nanded",
    "state": "Maharashtra",
    "zipCode": "431605",
    "country": "India",
    "phone": "+91xxxx"
  },
  "notes": "Please deliver to the front gate"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "o_001",
    "items": [
      {
        "productId": "p_001",
        "name": "Recycled Plastic Bench",
        "quantity": 1,
        "price": { "fiat": { "amount": 5000, "currency": "INR" }, "tokens": 500 },
        "totalPrice": { "fiat": { "amount": 5000, "currency": "INR" }, "tokens": 500 }
      }
    ],
    "totalAmount": { "fiat": { "amount": 5000, "currency": "INR" }, "tokens": 500 },
    "paymentDetails": {
      "method": "tokens",
      "tokenAmount": 500,
      "status": "completed"
    },
    "status": "processing",
    "createdAt": "2023-06-21T10:15:00Z"
  }
}
```

## AI Model Specifications

### Vision AI Model

**Purpose**: Classify waste materials from images, determine material type, subtype, and quality.

**Architecture**:
- Base Model: EfficientNetB0 or MobileNetV3
- Custom Classification Head: Material type, subtype, and quality assessment
- Input: 224x224 RGB images
- Output: Material type, subtype, and quality score

**Training Data**:
- 50,000+ labeled images of waste materials
- Categories: plastic, paper, metal, glass, electronics, other
- Subtypes: PET, HDPE, PVC, LDPE, PP, PS, etc.
- Quality annotations: poor, fair, good, excellent

**Performance Metrics**:
- Material Type Accuracy: >90%
- Subtype Accuracy: >80%
- Quality Assessment MAE: <0.15

**Human-in-the-Loop Flow**:
1. User uploads image of waste material
2. Vision AI classifies material and estimates quality
3. Collector verifies classification during pickup
4. Factory provides final verification and feedback
5. Feedback loop updates model training data

**Deployment**:
- Model Format: TorchScript or ONNX
- Serving: TorchServe or BentoML
- Inference Time: <200ms per image
- Batch Processing: Support for bulk image processing

### Matching AI Model

**Purpose**: Match collection requests with collectors and factories based on location, material type, and capacity.

**Architecture**:
- Graph-based recommendation system
- Features: geospatial distance, material type compatibility, capacity, historical performance
- Constraints: collector availability, factory capacity, pickup time windows

**Training Data**:
- Historical collection requests, assignments, and outcomes
- Collector and factory profiles, including specializations and capacities
- Geospatial data for optimizing routes

**Performance Metrics**:
- Assignment Acceptance Rate: >85%
- Collection Completion Rate: >90%
- Average Assignment Time: <2 minutes

**Human-in-the-Loop Flow**:
1. System generates collector recommendations for each request
2. Collectors can accept or reject assignments
3. System learns from acceptance/rejection patterns
4. Admin can override assignments when necessary

**Deployment**:
- Real-time matching service
- Batch processing for optimizing daily assignments
- Periodic retraining with new data

### Routing AI Model

**Purpose**: Optimize collection routes for collectors to minimize travel time and maximize efficiency.

**Architecture**:
- Vehicle Routing Problem (VRP) solver
- Reinforcement Learning for dynamic route optimization
- Constraints: time windows, vehicle capacity, traffic patterns

**Training Data**:
- Historical collection routes and times
- Traffic patterns by time of day and day of week
- Geospatial data for distance and travel time estimation

**Performance Metrics**:
- Route Efficiency: >20% improvement over baseline
- Collection Density: >5 collections per hour
- On-Time Pickup Rate: >90%

**Human-in-the-Loop Flow**:
1. System generates optimized routes for collectors
2. Collectors can provide feedback on route feasibility
3. System adapts to real-world constraints and preferences

**Deployment**:
- Daily route planning batch process
- Real-time route updates based on new requests and traffic conditions
- Mobile app integration for collector navigation

### Forecasting AI Model

**Purpose**: Predict waste generation patterns, collection volumes, and material demand.

**Architecture**:
- Time Series Forecasting: LSTM or Transformer-based model
- Features: historical collection data, seasonal patterns, special events, weather

**Training Data**:
- Historical collection volumes by material type, location, and time
- Factory demand patterns
- External factors: weather, events, holidays

**Performance Metrics**:
- MAPE (Mean Absolute Percentage Error): <15%
- Forecast Horizon: 1-4 weeks
- Update Frequency: Daily

**Human-in-the-Loop Flow**:
1. System generates forecasts for collection volumes and material demand
2. Admins and factories can adjust forecasts based on domain knowledge
3. System learns from forecast adjustments and actual outcomes

**Deployment**:
- Daily batch processing for forecast updates
- Integration with factory material requests and collector scheduling

### Fraud Detection AI Model

**Purpose**: Detect fraudulent activities, such as fake collections, quality misrepresentation, or token abuse.

**Architecture**:
- Anomaly Detection: Isolation Forest or Autoencoder
- Classification: Gradient Boosting or Neural Network
- Features: user behavior patterns, collection characteristics, image analysis

**Training Data**:
- Labeled fraud cases and normal transactions
- User activity logs and transaction history
- Collection verification data from collectors and factories

**Performance Metrics**:
- Precision: >90%
- Recall: >85%
- False Positive Rate: <5%

**Human-in-the-Loop Flow**:
1. System flags suspicious activities for review
2. Admin reviews flagged cases and provides feedback
3. System learns from feedback to improve detection accuracy

**Deployment**:
- Real-time scoring of new collections and transactions
- Batch processing for periodic review of user activity patterns
- Integration with verification workflow

## Token Economics

### Token Utility

**For Users**:
- Earn tokens by recycling waste materials
- Spend tokens on eco-friendly products in the marketplace
- Achieve status levels based on recycling activity and token balance
- Receive bonuses for consistent recycling behavior

**For Collectors**:
- Earn tokens for completing collection assignments
- Receive bonuses for high-quality collections and on-time delivery
- Stake tokens for priority access to high-value collection requests
- Use tokens for vehicle maintenance and fuel discounts

**For Factories**:
- Purchase recycled materials using tokens
- Offer products made from recycled materials in the marketplace
- Stake tokens to verify product sustainability claims
- Receive bonuses for innovative recycling processes

### Earning Mechanisms

**Base Rewards**:
- Plastic: 10 tokens/kg
- Paper: 8 tokens/kg
- Metal: 15 tokens/kg
- Glass: 6 tokens/kg
- Electronics: 20 tokens/kg

**Quality Multipliers**:
- Poor: 0.8x
- Fair: 1.0x
- Good: 1.2x
- Excellent: 1.5x

**Bonus Mechanisms**:
- Consistency Bonus: +10% for weekly recycling
- Volume Bonus: +5% for collections >10kg
- Cleanliness Bonus: +15% for pre-sorted, clean materials
- Referral Bonus: 50 tokens per new user referral

### Spending Mechanisms

**Marketplace Purchases**:
- Products priced in both fiat currency and tokens
- Token discounts compared to fiat prices (10-30%)
- Special token-only products and limited editions

**Discount Tiers**:
- Bronze (0-500 tokens): 10% discount
- Silver (501-2000 tokens): 15% discount
- Gold (2001-5000 tokens): 20% discount
- Platinum (5001+ tokens): 25% discount

**Status Levels**:
- Recycling Novice: 0-500 lifetime tokens
- Eco Enthusiast: 501-2000 lifetime tokens
- Sustainability Champion: 2001-5000 lifetime tokens
- Environmental Hero: 5001+ lifetime tokens

### Economic Controls

**Supply Management**:
- Dynamic base rates adjusted based on material supply and demand
- Seasonal promotions for under-collected materials
- Bonus token events for community recycling drives

**Inflation Control**:
- Token burning for marketplace purchases
- Staking mechanisms for long-term token holders
- Adjustable reward rates based on token circulation

**Governance**:
- Community voting on token economic parameters
- Proposal system for new earning and spending mechanisms
- Transparent reporting on token issuance and circulation

## CI/CD Pipeline

### Tools and Technologies

- **Version Control**: GitHub
- **CI/CD Platform**: GitHub Actions
- **Infrastructure as Code**: Terraform
- **Container Registry**: Docker Hub or GitHub Container Registry
- **Container Orchestration**: Kubernetes
- **Package Management**: npm, pip
- **Testing Frameworks**: Jest, Pytest, Cypress
- **Code Quality**: ESLint, Prettier, Black, SonarQube
- **Monitoring**: Prometheus, Grafana, ELK Stack

### Pipeline Stages

1. **Code**: Developers commit code to feature branches
2. **Build**: Automated build process triggered by pull requests
3. **Test**: Unit tests, integration tests, and code quality checks
4. **Analyze**: Static code analysis and security scanning
5. **Package**: Build Docker images for microservices
6. **Deploy**: Automated deployment to staging environment
7. **Validate**: End-to-end tests and performance tests
8. **Release**: Promotion to production environment
9. **Monitor**: Continuous monitoring and alerting

### Workflow Definitions

**Microservices Workflow**:
```yaml
name: Microservice CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm ci
      - name: Lint code
        run: npm run lint
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build

  docker-build:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v2
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v1
      - name: Login to DockerHub
        uses: docker/login-action@v1
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - name: Build and push
        uses: docker/build-push-action@v2
        with:
          context: .
          push: true
          tags: ecochain/service-name:${{ github.sha }}

  deploy-staging:
    needs: docker-build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v2
      - name: Set up Kubectl
        uses: azure/setup-kubectl@v1
      - name: Set Kubernetes context
        uses: azure/k8s-set-context@v1
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG_STAGING }}
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/service-name service-name=ecochain/service-name:${{ github.sha }} --record
          kubectl rollout status deployment/service-name

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v2
      - name: Set up Kubectl
        uses: azure/setup-kubectl@v1
      - name: Set Kubernetes context
        uses: azure/k8s-set-context@v1
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG_PRODUCTION }}
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/service-name service-name=ecochain/service-name:${{ github.sha }} --record
          kubectl rollout status deployment/service-name
```

**AI Services Workflow**:
```yaml
name: AI Service CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest pytest-cov black isort
      - name: Lint code
        run: |
          black --check .
          isort --check .
      - name: Run tests
        run: pytest --cov=app tests/

  docker-build:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v2
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v1
      - name: Login to DockerHub
        uses: docker/login-action@v1
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - name: Build and push
        uses: docker/build-push-action@v2
        with:
          context: .
          push: true
          tags: ecochain/ai-service-name:${{ github.sha }}

  deploy-staging:
    needs: docker-build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v2
      - name: Set up Kubectl
        uses: azure/setup-kubectl@v1
      - name: Set Kubernetes context
        uses: azure/k8s-set-context@v1
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG_STAGING }}
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/ai-service-name ai-service-name=ecochain/ai-service-name:${{ github.sha }} --record
          kubectl rollout status deployment/ai-service-name

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v2
      - name: Set up Kubectl
        uses: azure/setup-kubectl@v1
      - name: Set Kubernetes context
        uses: azure/k8s-set-context@v1
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG_PRODUCTION }}
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/ai-service-name ai-service-name=ecochain/ai-service-name:${{ github.sha }} --record
          kubectl rollout status deployment/ai-service-name
```

### Infrastructure as Code

**Terraform Configuration**:
```hcl
provider "aws" {
  region = var.aws_region
}

module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "3.14.0"

  name = "ecochain-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = false
  one_nat_gateway_per_az = true

  tags = var.common_tags
}

module "eks" {
  source = "terraform-aws-modules/eks/aws"
  version = "18.20.5"

  cluster_name = "ecochain-cluster"
  cluster_version = "1.22"

  vpc_id = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_private_access = true
  cluster_endpoint_public_access  = true

  node_groups = {
    application = {
      desired_capacity = 3
      max_capacity     = 5
      min_capacity     = 2

      instance_types = ["t3.medium"]
      capacity_type  = "ON_DEMAND"
      disk_size      = 50

      k8s_labels = {
        Environment = var.environment
        Type        = "application"
      }
    }

    ai_services = {
      desired_capacity = 2
      max_capacity     = 4
      min_capacity     = 1

      instance_types = ["g4dn.xlarge"]
      capacity_type  = "ON_DEMAND"
      disk_size      = 100

      k8s_labels = {
        Environment = var.environment
        Type        = "ai-services"
      }
    }
  }

  tags = var.common_tags
}

module "mongodb_atlas" {
  source = "mongodb/mongodbatlas/mongodbatlas"
  version = "1.4.5"

  project_id = var.mongodb_atlas_project_id
  cluster_name = "ecochain-${var.environment}"
  mongo_db_major_version = "5.0"
  provider_name = "AWS"
  provider_region_name = var.aws_region
  provider_instance_size_name = var.mongodb_instance_size
  provider_disk_iops = 3000
  provider_encrypt_ebs_volume = true
  provider_volume_type = "STANDARD"
  provider_backup_enabled = true
  provider_auto_scaling_disk_gb_enabled = true
  provider_auto_scaling_compute_enabled = true
  provider_auto_scaling_compute_scale_down_enabled = true
}

module "redis" {
  source = "cloudposse/elasticache-redis/aws"
  version = "0.40.0"

  name = "ecochain-redis-${var.environment}"
  vpc_id = module.vpc.vpc_id
  subnets = module.vpc.private_subnets
  availability_zones = module.vpc.azs
  cluster_size = 2
  instance_type = "cache.t3.medium"
  engine_version = "6.x"
  family = "redis6.x"
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token_enabled = true
  automatic_failover_enabled = true

  tags = var.common_tags
}

module "s3_bucket" {
  source = "terraform-aws-modules/s3-bucket/aws"
  version = "3.3.0"

  bucket = "ecochain-storage-${var.environment}"
  acl    = "private"

  versioning = {
    enabled = true
  }

  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm = "AES256"
      }
    }
  }

  tags = var.common_tags
}
```

### Kubernetes Deployment

**Helm Chart for Microservice**:
```yaml
apiVersion: v2
name: ecochain-service
description: Helm chart for EcoChain microservice
type: application
version: 0.1.0
appVersion: "1.0.0"

---
# values.yaml
replicaCount: 2

image:
  repository: ecochain/service-name
  tag: latest
  pullPolicy: Always

service:
  type: ClusterIP
  port: 80
  targetPort: 3000

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 5
  targetCPUUtilizationPercentage: 80

env:
  NODE_ENV: production
  PORT: 3000
  LOG_LEVEL: info

secrets:
  JWT_SECRET: ""
  MONGODB_URI: ""
  REDIS_URI: ""

livenessProbe:
  httpGet:
    path: /health
    port: http
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: http
  initialDelaySeconds: 5
  periodSeconds: 5

ingress:
  enabled: true
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
  hosts:
    - host: service-name.ecochain.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: ecochain-tls
      hosts:
        - service-name.ecochain.com
```

## Sprint Plan

### Team Structure

- **Backend Team**: 4 developers (Node.js, Python)
- **Frontend Team**: 3 developers (React, React Native)
- **DevOps Team**: 2 engineers (Infrastructure, CI/CD)
- **AI/ML Team**: 2 data scientists, 1 ML engineer
- **QA Team**: 2 testers
- **Product/Design**: 1 product manager, 1 UX designer

### Sprint Timeline

The project will be developed over 10 sprints (20 weeks), with each sprint lasting 2 weeks.

#### Sprint 1: Project Setup and Core Infrastructure
- Set up development environment and repositories
- Initialize microservice architecture
- Set up CI/CD pipeline
- Create MongoDB Atlas cluster and define schemas
- Implement basic authentication service

#### Sprint 2: User Management and Mobile App Foundation
- Implement user service with profile management
- Create React Native app scaffolding for user and collector apps
- Implement user registration and login flows
- Set up basic admin dashboard

#### Sprint 3: Collection Service and Vision AI
- Implement collection service for waste collection requests
- Develop initial version of Vision AI for material classification
- Create collection request flow in user app
- Implement collection management in collector app

#### Sprint 4: Wallet and Token Economics
- Implement wallet service for token management
- Define and implement token earning mechanisms
- Create token transaction history and balance views
- Implement token calculation for collections

#### Sprint 5: Factory Integration and Matching
- Implement factory service for material processing
- Develop matching algorithm for collections and factories
- Create factory dashboard for material management
- Implement verification workflow for collections

#### Sprint 6: Marketplace Foundation
- Implement product catalog and listing service
- Create marketplace views in user app
- Implement product management in factory dashboard
- Develop search and filtering functionality

#### Sprint 7: Order Processing and Fulfillment
- Implement order service for product purchases
- Create checkout flow with token and fiat payment options
- Implement order management for factories
- Develop order tracking and history for users

#### Sprint 8: Routing Optimization and Analytics
- Implement routing service for optimizing collection routes
- Develop analytics service for data insights
- Create analytics dashboard for admins
- Implement reporting functionality for all stakeholders

#### Sprint 9: Advanced AI Features and Optimization
- Enhance Vision AI with quality assessment
- Implement forecasting model for waste generation
- Develop fraud detection system
- Optimize matching and routing algorithms

#### Sprint 10: Final Integration and Launch Preparation
- Conduct end-to-end testing
- Optimize performance and scalability
- Implement final security measures
- Prepare documentation and training materials
- Conduct user acceptance testing

## Security Guidelines

### Authentication and Authorization

- Implement JWT-based authentication with short-lived access tokens and refresh tokens
- Use OAuth2 for third-party authentication (Google, Facebook, Apple)
- Implement role-based access control (RBAC) for different user types
- Enforce strong password policies and account lockout after failed attempts
- Implement two-factor authentication for sensitive operations

### Data Protection

- Encrypt sensitive data at rest using AES-256
- Use HTTPS/TLS 1.3 for all communications
- Implement proper data sanitization and validation
- Apply principle of least privilege for data access
- Implement secure key management using AWS KMS or similar service
- Set up regular data backups with encryption

### Infrastructure Security

- Use private subnets for all backend services
- Implement network security groups and firewall rules
- Set up VPC peering and proper network isolation
- Use secrets management service for credentials
- Implement infrastructure as code with security best practices
- Conduct regular security audits and penetration testing

### AI/ML Security

- Implement input validation for all AI model inputs
- Monitor for adversarial attacks on vision models
- Implement rate limiting for API endpoints
- Use model versioning and validation before deployment
- Implement privacy-preserving techniques for sensitive data
- Conduct regular model audits for bias and security vulnerabilities

### Mobile App Security

- Implement certificate pinning
- Use secure storage for tokens and sensitive data
- Implement app-level encryption
- Prevent screenshot capture of sensitive screens
- Implement jailbreak/root detection
- Conduct regular mobile app security testing

## Sample Code Snippets

### Authentication Service

```javascript
// auth.service.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user.model');

class AuthService {
  async register(userData) {
    // Check if user already exists
    const existingUser = await User.findOne({ 'personalInfo.email': userData.email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Create new user
    const user = new User({
      userId: `u_${uuidv4().substring(0, 8)}`,
      personalInfo: {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        profileImage: userData.profileImage || null
      },
      password: hashedPassword,
      address: userData.address || {},
      role: userData.role || 'user',
      ecoWallet: { currentBalance: 0, totalEarned: 0, totalSpent: 0 },
      preferences: { notificationSettings: {}, preferredPickupTime: userData.preferredPickupTime || null },
      accountStatus: 'active',
      registrationDate: new Date(),
      lastActive: new Date(),
      kycStatus: 'pending'
    });

    await user.save();

    // Generate tokens
    const tokens = this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens
    };
  }

  async login(email, password) {
    // Find user
    const user = await User.findOne({ 'personalInfo.email': email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Generate tokens
    const tokens = this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens
    };
  }

  generateTokens(user) {
    const accessToken = jwt.sign(
      { userId: user.userId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900 // 15 minutes in seconds
    };
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findOne({ userId: decoded.userId });

      if (!user) {
        throw new Error('User not found');
      }

      const accessToken = jwt.sign(
        { userId: user.userId, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      return {
        accessToken,
        expiresIn: 900 // 15 minutes in seconds
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  sanitizeUser(user) {
    return {
      userId: user.userId,
      name: user.personalInfo.name,
      email: user.personalInfo.email,
      role: user.role
    };
  }
}

module.exports = new AuthService();
```

### Collection Service

```javascript
// collection.service.js
const { v4: uuidv4 } = require('uuid');
const Collection = require('../models/collection.model');
const User = require('../models/user.model');
const visionService = require('./vision.service');
const walletService = require('./wallet.service');
const matchingService = require('./matching.service');

class CollectionService {
  async createCollection(userId, collectionData) {
    // Get user details
    const user = await User.findOne({ userId });
    if (!user) {
      throw new Error('User not found');
    }

    // Create collection request
    const collection = new Collection({
      collectionId: `col_${uuidv4().substring(0, 8)}`,
      userId: user._id,
      collectionDetails: {
        type: collectionData.type,
        subType: collectionData.subType,
        weight: collectionData.weight,
        quality: 'fair', // Default quality, will be updated by vision AI
        images: collectionData.images || [],
        description: collectionData.description
      },
      location: {
        pickupAddress: collectionData.pickupAddress,
        coordinates: {
          type: 'Point',
          coordinates: collectionData.coordinates
        }
      },
      scheduling: {
        requestedDate: collectionData.requestedDate,
        preferredTimeSlot: collectionData.preferredTimeSlot || user.preferences.preferredPickupTime
      },
      tokenCalculation: {
        baseRate: this.getBaseRate(collectionData.type),
        qualityMultiplier: 1.0, // Default multiplier, will be updated
        bonusTokens: 0,
        totalTokensIssued: 0 // Will be calculated
      },
      status: 'requested',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Process images with Vision AI if available
    if (collectionData.images && collectionData.images.length > 0) {
      try {
        const visionResult = await visionService.classifyMaterial(collectionData.images[0]);
        collection.visionInference = {
          material_type: visionResult.material_type,
          sub_type: visionResult.sub_type,
          quality_score: visionResult.quality_score,
          inferenceId: visionResult.inferenceId
        };

        // Update quality based on vision result
        collection.collectionDetails.quality = this.mapQualityScore(visionResult.quality_score);
        collection.tokenCalculation.qualityMultiplier = this.getQualityMultiplier(collection.collectionDetails.quality);
      } catch (error) {
        console.error('Vision AI processing failed:', error);
        // Continue without vision data
      }
    }

    // Calculate tokens
    collection.tokenCalculation.totalTokensIssued = this.calculateTokens(collection);

    await collection.save();

    // Find matching collector and factory
    try {
      const matching = await matchingService.findMatch(collection);
      if (matching.collector) {
        collection.collectorId = matching.collector._id;
        collection.status = 'assigned';
      }
      if (matching.factory) {
        collection.factoryId = matching.factory._id;
      }
      await collection.save();
    } catch (error) {
      console.error('Matching failed:', error);
      // Continue without matching
    }

    return collection;
  }

  async getCollections(userId, filters = {}) {
    const user = await User.findOne({ userId });
    if (!user) {
      throw new Error('User not found');
    }

    const query = { userId: user._id };

    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.type) {
      query['collectionDetails.type'] = filters.type;
    }
    if (filters.dateFrom) {
      query.createdAt = { $gte: new Date(filters.dateFrom) };
    }
    if (filters.dateTo) {
      if (query.createdAt) {
        query.createdAt.$lte = new Date(filters.dateTo);
      } else {
        query.createdAt = { $lte: new Date(filters.dateTo) };
      }
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const skip = (page - 1) * limit;

    const collections = await Collection.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Collection.countDocuments(query);

    return {
      collections,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateCollectionStatus(collectionId, status, updateData = {}) {
    const collection = await Collection.findOne({ collectionId });
    if (!collection) {
      throw new Error('Collection not found');
    }

    collection.status = status;
    collection.updatedAt = new Date();

    // Update additional fields based on status
    switch (status) {
      case 'scheduled':
        collection.scheduling.scheduledDate = updateData.scheduledDate || new Date();
        break;
      case 'picked_up':
        collection.logistics.actualPickupTime = updateData.actualPickupTime || new Date();
        collection.verification.collectorNotes = updateData.collectorNotes || '';
        if (updateData.qualityImages) {
          collection.verification.qualityImages = updateData.qualityImages;
        }
        break;
      case 'delivered':
        collection.logistics.deliveryToFactory = updateData.deliveryToFactory || new Date();
        break;
      case 'verified':
        collection.verification.factoryFeedback = updateData.factoryFeedback || '';
        // Issue tokens to user
        await walletService.issueTokens(
          collection.userId,
          collection.tokenCalculation.totalTokensIssued,
          'collection_reward',
          collection.collectionId,
          `Reward for ${collection.collectionDetails.type} collection`
        );
        break;
      case 'rejected':
        collection.verification.rejectionReason = updateData.rejectionReason || '';
        break;
    }

    await collection.save();
    return collection;
  }

  getBaseRate(materialType) {
    const rates = {
      plastic: 10,
      paper: 8,
      metal: 15,
      glass: 6,
      electronics: 20
    };
    return rates[materialType.toLowerCase()] || 5; // Default rate
  }

  getQualityMultiplier(quality) {
    const multipliers = {
      poor: 0.8,
      fair: 1.0,
      good: 1.2,
      excellent: 1.5
    };
    return multipliers[quality.toLowerCase()] || 1.0; // Default multiplier
  }

  mapQualityScore(score) {
    if (score >= 0.9) return 'excellent';
    if (score >= 0.7) return 'good';
    if (score >= 0.5) return 'fair';
    return 'poor';
  }

  calculateTokens(collection) {
    const baseRate = collection.tokenCalculation.baseRate;
    const weight = collection.collectionDetails.weight;
    const qualityMultiplier = collection.tokenCalculation.qualityMultiplier;
    const bonusTokens = collection.tokenCalculation.bonusTokens || 0;

    return Math.round(baseRate * weight * qualityMultiplier + bonusTokens);
  }
}

module.exports = new CollectionService();
```

### Vision AI Service

```python
# vision_service.py
import os
import uuid
import torch
import torchvision.transforms as transforms
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from models.vision_model import MaterialClassifier

app = FastAPI(title="EcoChain Vision AI Service")

# Load model
model = MaterialClassifier()
model.load_state_dict(torch.load("models/material_classifier.pth"))
model.eval()

# Define transformations
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Material types and subtypes
MATERIAL_TYPES = ["plastic", "paper", "metal", "glass", "electronics", "other"]
SUBTYPES = {
    "plastic": ["PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Other"],
    "paper": ["Cardboard", "Newspaper", "Magazine", "Office", "Mixed"],
    "metal": ["Aluminum", "Steel", "Copper", "Mixed"],
    "glass": ["Clear", "Green", "Brown", "Mixed"],
    "electronics": ["Phones", "Computers", "Appliances", "Batteries", "Mixed"],
    "other": ["Textile", "Rubber", "Organic", "Mixed"]
}

class ClassificationResult(BaseModel):
    inferenceId: str
    material_type: str
    material_confidence: float
    sub_type: str
    sub_type_confidence: Optional[float] = None
    quality_score: float

@app.post("/api/vision/classify", response_model=ClassificationResult)
async def classify_material(file: UploadFile = File(...)):
    try:
        # Read and process image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        image_tensor = transform(image).unsqueeze(0)
        
        # Make prediction
        with torch.no_grad():
            material_logits, subtype_logits, quality = model(image_tensor)
            
            material_probs = torch.softmax(material_logits, dim=1)[0]
            material_idx = torch.argmax(material_probs).item()
            material_type = MATERIAL_TYPES[material_idx]
            material_confidence = material_probs[material_idx].item()
            
            subtype_probs = torch.softmax(subtype_logits, dim=1)[0]
            subtype_idx = torch.argmax(subtype_probs).item()
            sub_type = SUBTYPES[material_type][subtype_idx % len(SUBTYPES[material_type])]
            sub_type_confidence = subtype_probs[subtype_idx].item()
            
            quality_score = quality.item()
        
        # Create result
        result = ClassificationResult(
            inferenceId=f"inf_{uuid.uuid4().hex[:8]}",
            material_type=material_type,
            material_confidence=material_confidence,
            sub_type=sub_type,
            sub_type_confidence=sub_type_confidence,
            quality_score=quality_score
        )
        
        # Log inference for feedback loop
        log_inference(result, file.filename)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def log_inference(result, filename):
    """Log inference results for model improvement"""
    # Save inference data to database or file for later analysis
    # This data will be used to improve the model when human feedback is received
    pass

@app.post("/api/vision/feedback")
async def provide_feedback(inference_id: str, correct_material: str, correct_subtype: str, correct_quality: float):
    """Endpoint for collectors and factories to provide feedback on vision results"""
    # Store feedback for model retraining
    # This feedback will be used to improve the model
    return {"success": True, "message": "Feedback received"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Wallet Service

```javascript
// wallet.service.js
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user.model');
const Transaction = require('../models/transaction.model');
const mongoose = require('mongoose');

class WalletService {
  async getBalance(userId) {
    const user = await User.findOne({ userId });
    if (!user) {
      throw new Error('User not found');
    }

    const lastTransaction = await Transaction.findOne({ userId: user._id })
      .sort({ timestamp: -1 })
      .limit(1);

    return {
      currentBalance: user.ecoWallet.currentBalance,
      totalEarned: user.ecoWallet.totalEarned,
      totalSpent: user.ecoWallet.totalSpent,
      lastTransaction: lastTransaction ? lastTransaction.timestamp : null
    };
  }

  async getTransactions(userId, filters = {}) {
    const user = await User.findOne({ userId });
    if (!user) {
      throw new Error('User not found');
    }

    const query = { userId: user._id };

    // Apply filters
    if (filters.type) {
      query.type = filters.type;
    }
    if (filters.dateFrom) {
      query.timestamp = { $gte: new Date(filters.dateFrom) };
    }
    if (filters.dateTo) {
      if (query.timestamp) {
        query.timestamp.$lte = new Date(filters.dateTo);
      } else {
        query.timestamp = { $lte: new Date(filters.dateTo) };
      }
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(query);

    return {
      transactions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async issueTokens(userId, amount, type, relatedId, description, metadata = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findOne({ _id: userId }).session(session);
      if (!user) {
        throw new Error('User not found');
      }

      const balanceBefore = user.ecoWallet.currentBalance;
      const balanceAfter = balanceBefore + amount;

      // Update user wallet
      user.ecoWallet.currentBalance = balanceAfter;
      user.ecoWallet.totalEarned += amount;
      await user.save({ session });

      // Create transaction record
      const transaction = new Transaction({
        transactionId: `tx_${uuidv4().substring(0, 8)}`,
        userId: user._id,
        type,
        amount,
        relatedId,
        description,
        balanceBefore,
        balanceAfter,
        status: 'completed',
        metadata,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await transaction.save({ session });
      await session.commitTransaction();

      return transaction;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async spendTokens(userId, amount, type, relatedId, description, metadata = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findOne({ _id: userId }).session(session);
      if (!user) {
        throw new Error('User not found');
      }

      const balanceBefore = user.ecoWallet.currentBalance;
      
      // Check if user has enough tokens
      if (balanceBefore < amount) {
        throw new Error('Insufficient token balance');
      }

      const balanceAfter = balanceBefore - amount;

      // Update user wallet
      user.ecoWallet.currentBalance = balanceAfter;
      user.ecoWallet.totalSpent += amount;
      await user.save({ session });

      // Create transaction record
      const transaction = new Transaction({
        transactionId: `tx_${uuidv4().substring(0, 8)}`,
        userId: user._id,
        type,
        amount: -amount, // Negative amount for spending
        relatedId,
        description,
        balanceBefore,
        balanceAfter,
        status: 'completed',
        metadata,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await transaction.save({ session });
      await session.commitTransaction();

      return transaction;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = new WalletService();
```

### Marketplace Service

```javascript
// marketplace.service.js
const { v4: uuidv4 } = require('uuid');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const User = require('../models/user.model');
const Factory = require('../models/factory.model');
const walletService = require('./wallet.service');

class MarketplaceService {
  async listProducts(filters = {}, pagination = { page: 1, limit: 10 }) {
    const query = {};

    // Apply filters
    if (filters.factoryId) {
      query.factoryId = filters.factoryId;
    }
    if (filters.category) {
      query.category = filters.category;
    }
    if (filters.materialType) {
      query.materialType = filters.materialType;
    }
    if (filters.priceMin) {
      query.price = { $gte: filters.priceMin };
    }
    if (filters.priceMax) {
      if (query.price) {
        query.price.$lte = filters.priceMax;
      } else {
        query.price = { $lte: filters.priceMax };
      }
    }
    if (filters.inStock === true) {
      query.stockQuantity = { $gt: 0 };
    }

    // Only show active products
    query.status = 'active';

    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getProductDetails(productId) {
    const product = await Product.findOne({ productId });
    if (!product) {
      throw new Error('Product not found');
    }

    // Get factory details
    const factory = await Factory.findOne({ _id: product.factoryId });

    // Get product reviews
    const reviews = await ProductReview.find({ productId: product._id })
      .sort({ createdAt: -1 })
      .limit(5);

    return {
      product,
      factory: factory ? {
        name: factory.name,
        location: factory.location,
        rating: factory.rating
      } : null,
      reviews
    };
  }

  async createOrder(userId, orderData) {
    const user = await User.findOne({ userId });
    if (!user) {
      throw new Error('User not found');
    }

    // Validate products and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of orderData.items) {
      const product = await Product.findOne({ productId: item.productId });
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}`);
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        totalPrice: itemTotal,
        factoryId: product.factoryId
      });
    }

    // Check if user has enough tokens
    if (user.ecoWallet.currentBalance < totalAmount) {
      throw new Error('Insufficient token balance');
    }

    // Create order
    const order = new Order({
      orderId: `ord_${uuidv4().substring(0, 8)}`,
      userId: user._id,
      items: orderItems,
      totalAmount,
      shippingAddress: orderData.shippingAddress || user.address,
      paymentDetails: {
        method: 'eco_tokens',
        status: 'pending'
      },
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await order.save();

    // Process payment
    try {
      await walletService.spendTokens(
        user._id,
        totalAmount,
        'product_purchase',
        order.orderId,
        `Purchase of ${orderItems.length} products`
      );

      // Update order payment status
      order.paymentDetails.status = 'completed';
      order.status = 'processing';
      await order.save();

      // Update product stock
      for (const item of orderItems) {
        await Product.updateOne(
          { _id: item.productId },
          { $inc: { stockQuantity: -item.quantity } }
        );
      }
    } catch (error) {
      // Payment failed, update order status
      order.paymentDetails.status = 'failed';
      order.status = 'payment_failed';
      await order.save();
      throw error;
    }

    return order;
  }

  async getOrders(userId, filters = {}) {
    const user = await User.findOne({ userId });
    if (!user) {
      throw new Error('User not found');
    }

    const query = { userId: user._id };

    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.dateFrom) {
      query.createdAt = { $gte: new Date(filters.dateFrom) };
    }
    if (filters.dateTo) {
      if (query.createdAt) {
        query.createdAt.$lte = new Date(filters.dateTo);
      } else {
        query.createdAt = { $lte: new Date(filters.dateTo) };
      }
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getOrderDetails(orderId, userId) {
    const user = await User.findOne({ userId });
    if (!user) {
      throw new Error('User not found');
    }

    const order = await Order.findOne({ orderId, userId: user._id });
    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  async updateOrderStatus(orderId, status, updateData = {}) {
    const order = await Order.findOne({ orderId });
    if (!order) {
      throw new Error('Order not found');
    }

    order.status = status;
    order.updatedAt = new Date();

    // Update additional fields based on status
    switch (status) {
      case 'shipped':
        order.shippingDetails = {
          carrier: updateData.carrier,
          trackingNumber: updateData.trackingNumber,
          estimatedDelivery: updateData.estimatedDelivery
        };
        break;
      case 'delivered':
        order.deliveryDate = new Date();
        break;
      case 'cancelled':
        // Refund tokens to user
        if (order.paymentDetails.status === 'completed') {
          await walletService.issueTokens(
            order.userId,
            order.totalAmount,
            'order_refund',
            order.orderId,
            `Refund for cancelled order ${order.orderId}`
          );

          // Restore product stock
          for (const item of order.items) {
            await Product.updateOne(
              { _id: item.productId },
              { $inc: { stockQuantity: item.quantity } }
            );
          }
        }
        break;
    }

    await order.save();
    return order;
  }

  async submitProductReview(userId, productId, reviewData) {
    const user = await User.findOne({ userId });
    if (!user) {
      throw new Error('User not found');
    }

    const product = await Product.findOne({ productId });
    if (!product) {
      throw new Error('Product not found');
    }

    // Check if user has purchased this product
    const hasOrdered = await Order.findOne({
      userId: user._id,
      'items.productId': product._id,
      status: 'delivered'
    });

    if (!hasOrdered) {
      throw new Error('You can only review products you have purchased');
    }

    // Check if user has already reviewed this product
    const existingReview = await ProductReview.findOne({
      userId: user._id,
      productId: product._id
    });

    if (existingReview) {
      // Update existing review
      existingReview.rating = reviewData.rating;
      existingReview.comment = reviewData.comment;
      existingReview.updatedAt = new Date();
      await existingReview.save();
      return existingReview;
    }

    // Create new review
    const review = new ProductReview({
      userId: user._id,
      productId: product._id,
      rating: reviewData.rating,
      comment: reviewData.comment,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await review.save();

    // Update product rating
    const allReviews = await ProductReview.find({ productId: product._id });
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / allReviews.length;

    product.rating = averageRating;
    product.reviewCount = allReviews.length;
    await product.save();

    return review;
  }
}

module.exports = new MarketplaceService();
```

### Mobile App - User App (React Native)

```jsx
// App.js - Main User App Component
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Main Screens
import HomeScreen from './src/screens/HomeScreen';
import CollectionsScreen from './src/screens/CollectionsScreen';
import NewCollectionScreen from './src/screens/NewCollectionScreen';
import MarketplaceScreen from './src/screens/MarketplaceScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import WalletScreen from './src/screens/WalletScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Components
import AuthGuard from './src/components/AuthGuard';
import { ThemeProvider } from './src/context/ThemeContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'EcoChain' }} />
  </Stack.Navigator>
);

const CollectionStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Collections" component={CollectionsScreen} />
    <Stack.Screen name="NewCollection" component={NewCollectionScreen} options={{ title: 'New Collection' }} />
  </Stack.Navigator>
);

const MarketplaceStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Marketplace" component={MarketplaceScreen} />
    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product Details' }} />
    <Stack.Screen name="Cart" component={CartScreen} />
    <Stack.Screen name="Checkout" component={CheckoutScreen} />
  </Stack.Navigator>
);

const OrdersStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Orders" component={OrdersScreen} />
    <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Details' }} />
  </Stack.Navigator>
);

const WalletStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Wallet" component={WalletScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Profile" component={ProfileScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'HomeTab') {
          iconName = 'home';
        } else if (route.name === 'CollectionTab') {
          iconName = 'recycle';
        } else if (route.name === 'MarketplaceTab') {
          iconName = 'store';
        } else if (route.name === 'OrdersTab') {
          iconName = 'package-variant';
        } else if (route.name === 'WalletTab') {
          iconName = 'wallet';
        } else if (route.name === 'ProfileTab') {
          iconName = 'account';
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
    })}
    tabBarOptions={{
      activeTintColor: '#4CAF50',
      inactiveTintColor: 'gray',
    }}
  >
    <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: 'Home' }} />
    <Tab.Screen name="CollectionTab" component={CollectionStack} options={{ title: 'Recycle' }} />
    <Tab.Screen name="MarketplaceTab" component={MarketplaceStack} options={{ title: 'Shop' }} />
    <Tab.Screen name="OrdersTab" component={OrdersStack} options={{ title: 'Orders' }} />
    <Tab.Screen name="WalletTab" component={WalletStack} options={{ title: 'Wallet' }} />
    <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profile' }} />
  </Tab.Navigator>
);

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Auth" component={AuthStack} />
              <Stack.Screen 
                name="Main" 
                component={AuthGuard(MainTabs)} 
              />
            </Stack.Navigator>
          </NavigationContainer>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;
```

### Mobile App - Collection Screen (React Native)

```jsx
// src/screens/NewCollectionScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createCollection } from '../store/actions/collectionActions';
import { getLocation } from '../utils/locationUtils';
import MaterialTypeInfo from '../components/MaterialTypeInfo';

const NewCollectionScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.collection);
  const [images, setImages] = useState([]);
  const [materialType, setMaterialType] = useState(null);
  const [materialSubType, setMaterialSubType] = useState(null);
  const [weight, setWeight] = useState('');
  const [description, setDescription] = useState('');
  const [pickupDate, setPickupDate] = useState(new Date());
  const [timeSlot, setTimeSlot] = useState('10:00-12:00');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [location, setLocation] = useState(null);
  const [openMaterialType, setOpenMaterialType] = useState(false);
  const [openSubType, setOpenSubType] = useState(false);
  const [openTimeSlot, setOpenTimeSlot] = useState(false);
  
  // Material type options
  const materialTypes = [
    { label: 'Plastic', value: 'plastic' },
    { label: 'Paper', value: 'paper' },
    { label: 'Metal', value: 'metal' },
    { label: 'Glass', value: 'glass' },
    { label: 'Electronics', value: 'electronics' }
  ];
  
  // Sub-type options based on material type
  const getSubTypeOptions = () => {
    switch(materialType) {
      case 'plastic':
        return [
          { label: 'PET', value: 'PET' },
          { label: 'HDPE', value: 'HDPE' },
          { label: 'PVC', value: 'PVC' },
          { label: 'LDPE', value: 'LDPE' },
          { label: 'PP', value: 'PP' },
          { label: 'PS', value: 'PS' },
          { label: 'Other', value: 'Other' }
        ];
      case 'paper':
        return [
          { label: 'Cardboard', value: 'Cardboard' },
          { label: 'Newspaper', value: 'Newspaper' },
          { label: 'Magazine', value: 'Magazine' },
          { label: 'Office Paper', value: 'Office' },
          { label: 'Mixed Paper', value: 'Mixed' }
        ];
      case 'metal':
        return [
          { label: 'Aluminum', value: 'Aluminum' },
          { label: 'Steel', value: 'Steel' },
          { label: 'Copper', value: 'Copper' },
          { label: 'Mixed Metal', value: 'Mixed' }
        ];
      case 'glass':
        return [
          { label: 'Clear Glass', value: 'Clear' },
          { label: 'Green Glass', value: 'Green' },
          { label: 'Brown Glass', value: 'Brown' },
          { label: 'Mixed Glass', value: 'Mixed' }
        ];
      case 'electronics':
        return [
          { label: 'Phones', value: 'Phones' },
          { label: 'Computers', value: 'Computers' },
          { label: 'Appliances', value: 'Appliances' },
          { label: 'Batteries', value: 'Batteries' },
          { label: 'Mixed Electronics', value: 'Mixed' }
        ];
      default:
        return [];
    }
  };
  
  // Time slot options
  const timeSlotOptions = [
    { label: '10:00 AM - 12:00 PM', value: '10:00-12:00' },
    { label: '12:00 PM - 2:00 PM', value: '12:00-14:00' },
    { label: '2:00 PM - 4:00 PM', value: '14:00-16:00' },
    { label: '4:00 PM - 6:00 PM', value: '16:00-18:00' }
  ];
  
  // Get user's location on component mount
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const userLocation = await getLocation();
        setLocation(userLocation);
      } catch (error) {
        Alert.alert('Location Error', 'Unable to get your current location. Please enable location services.');
      }
    };
    
    fetchLocation();
  }, []);
  
  // Handle image capture
  const handleCaptureImage = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1200,
      maxHeight: 1200
    };
    
    launchCamera(options, response => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.error) {
        console.log('Camera Error: ', response.error);
      } else {
        const newImage = {
          uri: response.assets[0].uri,
          type: response.assets[0].type,
          name: response.assets[0].fileName || `image-${Date.now()}.jpg`
        };
        setImages([...images, newImage]);
      }
    });
  };
  
  // Handle image selection from gallery
  const handleSelectImage = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1200,
      maxHeight: 1200
    };
    
    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        const newImage = {
          uri: response.assets[0].uri,
          type: response.assets[0].type,
          name: response.assets[0].fileName || `image-${Date.now()}.jpg`
        };
        setImages([...images, newImage]);
      }
    });
  };
  
  // Handle date change
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setPickupDate(selectedDate);
    }
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!materialType || !materialSubType || !weight || images.length === 0) {
      Alert.alert('Missing Information', 'Please fill all required fields and add at least one image');
      return;
    }
    
    if (!location) {
      Alert.alert('Location Required', 'We need your location to arrange pickup. Please enable location services.');
      return;
    }
    
    const collectionData = {
      type: materialType,
      subType: materialSubType,
      weight: parseFloat(weight),
      description,
      images,
      pickupAddress: location.address,
      coordinates: [location.longitude, location.latitude],
      requestedDate: pickupDate,
      preferredTimeSlot: timeSlot
    };
    
    dispatch(createCollection(collectionData))
      .then(() => {
        Alert.alert(
          'Collection Request Submitted', 
          'Your collection request has been submitted successfully. You will be notified when a collector is assigned.',
          [{ text: 'OK', onPress: () => navigation.navigate('Collections') }]
        );
      })
      .catch(err => {
        Alert.alert('Error', err.message || 'Failed to submit collection request');
      });
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Material Information</Text>
        
        <Text style={styles.label}>Material Type *</Text>
        <DropDownPicker
          open={openMaterialType}
          value={materialType}
          items={materialTypes}
          setOpen={setOpenMaterialType}
          setValue={setMaterialType}
          setItems={() => {}}
          placeholder="Select material type"
          style={styles.dropdown}
          zIndex={3000}
          zIndexInverse={1000}
        />
        
        {materialType && (
          <>
            <Text style={styles.label}>Material Sub-Type *</Text>
            <DropDownPicker
              open={openSubType}
              value={materialSubType}
              items={getSubTypeOptions()}
              setOpen={setOpenSubType}
              setValue={setMaterialSubType}
              setItems={() => {}}
              placeholder="Select sub-type"
              style={styles.dropdown}
              zIndex={2000}
              zIndexInverse={2000}
            />
          </>
        )}
        
        <Text style={styles.label}>Estimated Weight (kg) *</Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          placeholder="Enter weight in kg"
          keyboardType="decimal-pad"
        />
        
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the materials (e.g., clean plastic bottles, newspapers)"
          multiline
          numberOfLines={4}
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Images *</Text>
        <Text style={styles.helperText}>Please add clear images of the materials</Text>
        
        <View style={styles.imageButtons}>
          <TouchableOpacity style={styles.imageButton} onPress={handleCaptureImage}>
            <Text style={styles.imageButtonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageButton} onPress={handleSelectImage}>
            <Text style={styles.imageButtonText}>Select from Gallery</Text>
          </TouchableOpacity>
        </View>
        
        {images.length > 0 && (
          <ScrollView horizontal style={styles.imagePreviewContainer}>
            {images.map((image, index) => (
              <View key={index} style={styles.imagePreview}>
                <Image source={{ uri: image.uri }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setImages(images.filter((_, i) => i !== index))}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pickup Details</Text>
        
        <Text style={styles.label}>Pickup Date *</Text>
        <TouchableOpacity 
          style={styles.datePickerButton} 
          onPress={() => setShowDatePicker(true)}
        >
          <Text>{pickupDate.toDateString()}</Text>
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker
            value={pickupDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}
        
        <Text style={styles.label}>Preferred Time Slot *</Text>
        <DropDownPicker
          open={openTimeSlot}
          value={timeSlot}
          items={timeSlotOptions}
          setOpen={setOpenTimeSlot}
          setValue={setTimeSlot}
          setItems={() => {}}
          placeholder="Select time slot"
          style={styles.dropdown}
          zIndex={1000}
          zIndexInverse={3000}
        />
      </View>
      
      {materialType && (
        <MaterialTypeInfo materialType={materialType} />
      )}
      
      <TouchableOpacity 
        style={styles.submitButton} 
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Collection Request</Text>
        )}
      </TouchableOpacity>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333'
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    backgroundColor: '#fff'
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  dropdown: {
    borderColor: '#ddd',
    marginBottom: 16
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff'
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  imageButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 4,
    flex: 0.48
  },
  imageButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    marginBottom: 16
  },
  imagePreview: {
    marginRight: 8,
    position: 'relative'
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 4
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff5252',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  removeImageText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  helperText: {
    fontSize: 12,
    color: '#777',
    marginBottom: 12
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 4,
    marginVertical: 24
  },
  submitButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16
  },
  errorText: {
    color: '#ff5252',
    marginBottom: 16,
    textAlign: 'center'
  }
});

export default NewCollectionScreen;
```

### Mobile App - Collector App (React Native)

```jsx
// App.js - Main Collector App Component
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Main Screens
import DashboardScreen from './src/screens/DashboardScreen';
import PickupRequestsScreen from './src/screens/PickupRequestsScreen';
import PickupDetailScreen from './src/screens/PickupDetailScreen';
import RouteMapScreen from './src/screens/RouteMapScreen';
import CollectionHistoryScreen from './src/screens/CollectionHistoryScreen';
import CollectionDetailScreen from './src/screens/CollectionDetailScreen';
import WalletScreen from './src/screens/WalletScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Components
import AuthGuard from './src/components/AuthGuard';
import { ThemeProvider } from './src/context/ThemeContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const DashboardStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'EcoChain Collector' }} />
  </Stack.Navigator>
);

const PickupStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="PickupRequests" component={PickupRequestsScreen} options={{ title: 'Pickup Requests' }} />
    <Stack.Screen name="PickupDetail" component={PickupDetailScreen} options={{ title: 'Request Details' }} />
    <Stack.Screen name="RouteMap" component={RouteMapScreen} options={{ title: 'Route Map' }} />
  </Stack.Navigator>
);

const HistoryStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="CollectionHistory" component={CollectionHistoryScreen} options={{ title: 'Collection History' }} />
    <Stack.Screen name="CollectionDetail" component={CollectionDetailScreen} options={{ title: 'Collection Details' }} />
  </Stack.Navigator>
);

const WalletStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: 'Earnings & Wallet' }} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Profile" component={ProfileScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'DashboardTab') {
          iconName = 'view-dashboard';
        } else if (route.name === 'PickupTab') {
          iconName = 'truck-delivery';
        } else if (route.name === 'HistoryTab') {
          iconName = 'history';
        } else if (route.name === 'WalletTab') {
          iconName = 'wallet';
        } else if (route.name === 'ProfileTab') {
          iconName = 'account';
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
    })}
    tabBarOptions={{
      activeTintColor: '#4CAF50',
      inactiveTintColor: 'gray',
    }}
  >
    <Tab.Screen name="DashboardTab" component={DashboardStack} options={{ title: 'Dashboard' }} />
    <Tab.Screen name="PickupTab" component={PickupStack} options={{ title: 'Pickups' }} />
    <Tab.Screen name="HistoryTab" component={HistoryStack} options={{ title: 'History' }} />
    <Tab.Screen name="WalletTab" component={WalletStack} options={{ title: 'Earnings' }} />
    <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profile' }} />
  </Tab.Navigator>
);

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Auth" component={AuthStack} />
              <Stack.Screen 
                name="Main" 
                component={AuthGuard(MainTabs)} 
              />
            </Stack.Navigator>
          </NavigationContainer>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;
```

### Pickup Requests Screen (Collector App)

```jsx
// src/screens/PickupRequestsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPickupRequests, acceptPickupRequest } from '../store/actions/pickupActions';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatDistance } from 'date-fns';
import FilterModal from '../components/FilterModal';
import { getDistance } from '../utils/locationUtils';

const PickupRequestsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { requests, loading, error } = useSelector(state => state.pickups);
  const { location } = useSelector(state => state.location);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    materialType: null,
    maxDistance: 10, // km
    sortBy: 'distance'
  });

  useEffect(() => {
    loadPickupRequests();
  }, []);

  const loadPickupRequests = () => {
    setRefreshing(true);
    dispatch(fetchPickupRequests(filters))
      .finally(() => setRefreshing(false));
  };

  const handleRefresh = () => {
    loadPickupRequests();
  };

  const handleAcceptRequest = (requestId) => {
    Alert.alert(
      'Accept Pickup Request',
      'Are you sure you want to accept this pickup request?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Accept', 
          onPress: () => {
            dispatch(acceptPickupRequest(requestId))
              .then(() => {
                Alert.alert(
                  'Request Accepted',
                  'You have successfully accepted this pickup request.',
                  [{ text: 'OK', onPress: () => navigation.navigate('PickupDetail', { requestId }) }]
                );
              })
              .catch(err => {
                Alert.alert('Error', err.message || 'Failed to accept pickup request');
              });
          } 
        }
      ]
    );
  };

  const handleFilterApply = (newFilters) => {
    setFilters(newFilters);
    setFilterModalVisible(false);
    dispatch(fetchPickupRequests(newFilters));
  };

  const calculateDistance = (coordinates) => {
    if (!location || !coordinates) return null;
    return getDistance(
      { latitude: location.latitude, longitude: location.longitude },
      { latitude: coordinates[1], longitude: coordinates[0] }
    );
  };

  const renderItem = ({ item }) => {
    const distance = calculateDistance(item.location.coordinates);
    const timeAgo = formatDistance(new Date(item.scheduling.requestedDate), new Date(), { addSuffix: true });

    return (
      <TouchableOpacity 
        style={styles.requestCard}
        onPress={() => navigation.navigate('PickupDetail', { requestId: item.collectionId })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.materialTypeContainer}>
            <Icon 
              name={item.collectionDetails.type === 'plastic' ? 'bottle-soda' : 
                   item.collectionDetails.type === 'paper' ? 'file-document' : 
                   item.collectionDetails.type === 'metal' ? 'silver-ware' : 
                   item.collectionDetails.type === 'glass' ? 'glass-fragile' : 'recycle'} 
              size={24} 
              color="#4CAF50" 
            />
            <Text style={styles.materialType}>
              {item.collectionDetails.type.charAt(0).toUpperCase() + item.collectionDetails.type.slice(1)}
              {item.collectionDetails.subType ? ` (${item.collectionDetails.subType})` : ''}
            </Text>
          </View>
          <Text style={styles.weight}>{item.collectionDetails.weight} kg</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Icon name="map-marker" size={16} color="#555" />
            <Text style={styles.address} numberOfLines={2}>{item.location.pickupAddress}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Icon name="calendar-clock" size={16} color="#555" />
            <Text style={styles.timeSlot}>
              {new Date(item.scheduling.scheduledDate || item.scheduling.requestedDate).toLocaleDateString()} | 
              {item.scheduling.preferredTimeSlot}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="information-outline" size={16} color="#555" />
            <Text style={styles.description} numberOfLines={2}>
              {item.collectionDetails.description || 'No description provided'}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.metaInfo}>
            {distance !== null && (
              <View style={styles.metaItem}>
                <Icon name="map-marker-distance" size={14} color="#777" />
                <Text style={styles.metaText}>{distance.toFixed(1)} km</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Icon name="clock-outline" size={14} color="#777" />
              <Text style={styles.metaText}>{timeAgo}</Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="ticket-percent" size={14} color="#777" />
              <Text style={styles.metaText}>{item.tokenCalculation.totalTokensIssued} tokens</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.acceptButton}
            onPress={() => handleAcceptRequest(item.collectionId)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pickup Requests</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Icon name="filter-variant" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading pickup requests...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color="#ff5252" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPickupRequests}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="truck-delivery-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No pickup requests available</Text>
          <Text style={styles.emptySubtext}>Check back later or adjust your filters</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={loadPickupRequests}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={item => item.collectionId}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#4CAF50']}
            />
          }
        />
      )}

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleFilterApply}
        currentFilters={filters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  filterButton: {
    padding: 8
  },
  listContainer: {
    padding: 16
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  materialTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  materialType: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333'
  },
  weight: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  cardBody: {
    marginBottom: 12
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  address: {
    flex: 1,
    marginLeft: 8,
    color: '#333'
  },
  timeSlot: {
    marginLeft: 8,
    color: '#333'
  },
  description: {
    flex: 1,
    marginLeft: 8,
    color: '#666'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12
  },
  metaText: {
    fontSize: 12,
    color: '#777',
    marginLeft: 4
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    color: '#666'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  errorText: {
    marginTop: 12,
    color: '#ff5252',
    textAlign: 'center',
    marginBottom: 16
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  emptyText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666'
  },
  emptySubtext: {
    marginTop: 8,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});

export default PickupRequestsScreen;
```

### Factory Dashboard (React/Next.js)

```jsx
// pages/dashboard.js - Factory Dashboard Main Page
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  Box,
  Flex,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Text,
  Button,
  useColorModeValue,
  Icon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import { FiTruck, FiPackage, FiBarChart2, FiDollarSign, FiCalendar } from 'react-icons/fi';
import { MdRecycling } from 'react-icons/md';
import Layout from '../components/Layout';
import MaterialRequestForm from '../components/MaterialRequestForm';
import MaterialInventory from '../components/MaterialInventory';
import ProductionSchedule from '../components/ProductionSchedule';
import RecentCollections from '../components/RecentCollections';
import FactoryMetrics from '../components/FactoryMetrics';
import { getFactoryStats, getRecentCollections } from '../lib/api';

const Dashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      const fetchData = async () => {
        try {
          setIsLoading(true);
          const [statsData, collectionsData] = await Promise.all([
            getFactoryStats(session.user.factoryId),
            getRecentCollections(session.user.factoryId)
          ]);
          
          setStats(statsData);
          setCollections(collectionsData);
          setError(null);
        } catch (err) {
          console.error('Error fetching dashboard data:', err);
          setError('Failed to load dashboard data. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchData();
    }
  }, [status, session, router]);
  
  if (status === 'loading' || isLoading) {
    return (
      <Layout>
        <Flex justify="center" align="center" height="50vh">
          <Text>Loading dashboard...</Text>
        </Flex>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <Flex direction="column" align="center" mt={10}>
          <Text color="red.500" mb={4}>{error}</Text>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Flex>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <Box p={4}>
        <Flex mb={6} justifyContent="space-between" alignItems="center">
          <Heading size="lg">Factory Dashboard</Heading>
          <Button 
            leftIcon={<MdRecycling />} 
            colorScheme="green" 
            onClick={() => router.push('/material-requests/new')}
          >
            New Material Request
          </Button>
        </Flex>
        
        {/* Stats Overview */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
          <Stat
            px={4}
            py={3}
            bg={bgColor}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="sm"
          >
            <Flex justifyContent="space-between">
              <Box>
                <StatLabel>Total Recycled</StatLabel>
                <StatNumber>{stats?.totalRecycled.toFixed(2)} kg</StatNumber>
                <StatHelpText>
                  <StatArrow type={stats?.recycledGrowth >= 0 ? 'increase' : 'decrease'} />
                  {Math.abs(stats?.recycledGrowth).toFixed(1)}% from last month
                </StatHelpText>
              </Box>
              <Flex
                alignItems="center"
                justifyContent="center"
                w={14}
                h={14}
                bg="green.100"
                color="green.500"
                borderRadius="full"
              >
                <Icon as={MdRecycling} w={6} h={6} />
              </Flex>
            </Flex>
          </Stat>
          
          <Stat
            px={4}
            py={3}
            bg={bgColor}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="sm"
          >
            <Flex justifyContent="space-between">
              <Box>
                <StatLabel>Products Created</StatLabel>
                <StatNumber>{stats?.productsCreated}</StatNumber>
                <StatHelpText>
                  <StatArrow type={stats?.productsGrowth >= 0 ? 'increase' : 'decrease'} />
                  {Math.abs(stats?.productsGrowth).toFixed(1)}% from last month
                </StatHelpText>
              </Box>
              <Flex
                alignItems="center"
                justifyContent="center"
                w={14}
                h={14}
                bg="blue.100"
                color="blue.500"
                borderRadius="full"
              >
                <Icon as={FiPackage} w={6} h={6} />
              </Flex>
            </Flex>
          </Stat>
          
          <Stat
            px={4}
            py={3}
            bg={bgColor}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="sm"
          >
            <Flex justifyContent="space-between">
              <Box>
                <StatLabel>Pending Collections</StatLabel>
                <StatNumber>{stats?.pendingCollections}</StatNumber>
                <StatHelpText>
                  Scheduled for delivery
                </StatHelpText>
              </Box>
              <Flex
                alignItems="center"
                justifyContent="center"
                w={14}
                h={14}
                bg="orange.100"
                color="orange.500"
                borderRadius="full"
              >
                <Icon as={FiTruck} w={6} h={6} />
              </Flex>
            </Flex>
          </Stat>
          
          <Stat
            px={4}
            py={3}
            bg={bgColor}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="sm"
          >
            <Flex justifyContent="space-between">
              <Box>
                <StatLabel>Revenue Generated</StatLabel>
                <StatNumber>₹{stats?.revenue.toLocaleString()}</StatNumber>
                <StatHelpText>
                  <StatArrow type={stats?.revenueGrowth >= 0 ? 'increase' : 'decrease'} />
                  {Math.abs(stats?.revenueGrowth).toFixed(1)}% from last month
                </StatHelpText>
              </Box>
              <Flex
                alignItems="center"
                justifyContent="center"
                w={14}
                h={14}
                bg="purple.100"
                color="purple.500"
                borderRadius="full"
              >
                <Icon as={FiDollarSign} w={6} h={6} />
              </Flex>
            </Flex>
          </Stat>
        </SimpleGrid>
        
        {/* Main Dashboard Content */}
        <Tabs colorScheme="green" isLazy>
          <TabList>
            <Tab>Overview</Tab>
            <Tab>Inventory</Tab>
            <Tab>Production</Tab>
            <Tab>Analytics</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                <Box
                  bg={bgColor}
                  p={4}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={borderColor}
                  boxShadow="sm"
                  height="400px"
                >
                  <Heading size="md" mb={4}>Recent Collections</Heading>
                  <RecentCollections collections={collections} />
                </Box>
                
                <Box
                  bg={bgColor}
                  p={4}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={borderColor}
                  boxShadow="sm"
                  height="400px"
                >
                  <Heading size="md" mb={4}>Factory Metrics</Heading>
                  <FactoryMetrics factoryId={session.user.factoryId} />
                </Box>
              </SimpleGrid>
            </TabPanel>
            
            <TabPanel>
              <Box
                bg={bgColor}
                p={4}
                borderRadius="lg"
                borderWidth="1px"
                borderColor={borderColor}
                boxShadow="sm"
              >
                <Heading size="md" mb={4}>Material Inventory</Heading>
                <MaterialInventory factoryId={session.user.factoryId} />
              </Box>
            </TabPanel>
            
            <TabPanel>
              <Box
                bg={bgColor}
                p={4}
                borderRadius="lg"
                borderWidth="1px"
                borderColor={borderColor}
                boxShadow="sm"
              >
                <Heading size="md" mb={4}>Production Schedule</Heading>
                <ProductionSchedule factoryId={session.user.factoryId} />
              </Box>
            </TabPanel>
            
            <TabPanel>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                <Box
                  bg={bgColor}
                  p={4}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={borderColor}
                  boxShadow="sm"
                  height="400px"
                >
                  <Heading size="md" mb={4}>Material Usage Trends</Heading>
                  {/* Material Usage Chart Component */}
                </Box>
                
                <Box
                  bg={bgColor}
                  p={4}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={borderColor}
                  boxShadow="sm"
                  height="400px"
                >
                  <Heading size="md" mb={4}>Production Output</Heading>
                  {/* Production Output Chart Component */}
                </Box>
              </SimpleGrid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Layout>
  );
};

export default Dashboard;
```

### Admin Dashboard (React/Next.js)

```jsx
// pages/admin/analytics.js - Admin Analytics Dashboard
import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Select,
  Button,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  HStack,
  VStack,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from '@chakra-ui/react';
import { 
  FiDownload, 
  FiUsers, 
  FiTruck, 
  FiPackage, 
  FiDollarSign, 
  FiMoreVertical,
  FiCalendar,
  FiMap
} from 'react-icons/fi';
import { MdRecycling, MdFactory } from 'react-icons/md';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';
import AdminLayout from '../../components/AdminLayout';
import DateRangePicker from '../../components/DateRangePicker';
import MapView from '../../components/MapView';
import { fetchAnalyticsData, exportAnalyticsData } from '../../lib/api';

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeRegion, setActiveRegion] = useState('all');
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchAnalyticsData({
          timeRange,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          region: activeRegion
        });
        setAnalyticsData(data);
        setError(null);
      } catch (err) {
        console.error('Error loading analytics data:', err);
        setError('Failed to load analytics data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAnalyticsData();
  }, [timeRange, dateRange, activeRegion]);
  
  const handleExportData = async () => {
    try {
      await exportAnalyticsData({
        timeRange,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        region: activeRegion,
        format: 'csv'
      });
    } catch (err) {
      console.error('Error exporting data:', err);
    }
  };
  
  // Chart data preparation
  const prepareCollectionTrendsData = () => {
    if (!analyticsData || !analyticsData.collectionTrends) return null;
    
    return {
      labels: analyticsData.collectionTrends.map(item => item.date),
      datasets: [
        {
          label: 'Plastic',
          data: analyticsData.collectionTrends.map(item => item.plastic),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.4,
        },
        {
          label: 'Paper',
          data: analyticsData.collectionTrends.map(item => item.paper),
          borderColor: 'rgba(255, 206, 86, 1)',
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          tension: 0.4,
        },
        {
          label: 'Metal',
          data: analyticsData.collectionTrends.map(item => item.metal),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
        },
      ],
    };
  };
  
  const prepareMaterialDistributionData = () => {
    if (!analyticsData || !analyticsData.materialDistribution) return null;
    
    return {
      labels: Object.keys(analyticsData.materialDistribution),
      datasets: [
        {
          data: Object.values(analyticsData.materialDistribution),
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };
  
  const prepareTokenDistributionData = () => {
    if (!analyticsData || !analyticsData.tokenDistribution) return null;
    
    return {
      labels: Object.keys(analyticsData.tokenDistribution),
      datasets: [
        {
          data: Object.values(analyticsData.tokenDistribution),
          backgroundColor: [
            'rgba(76, 175, 80, 0.6)',
            'rgba(255, 152, 0, 0.6)',
            'rgba(233, 30, 99, 0.6)',
          ],
          borderColor: [
            'rgba(76, 175, 80, 1)',
            'rgba(255, 152, 0, 1)',
            'rgba(233, 30, 99, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };
  
  const collectionTrendsData = prepareCollectionTrendsData();
  const materialDistributionData = prepareMaterialDistributionData();
  const tokenDistributionData = prepareTokenDistributionData();
  
  return (
    <AdminLayout>
      <Box p={4}>
        <Flex mb={6} justifyContent="space-between" alignItems="center" flexWrap="wrap">
          <Heading size="lg">Analytics Dashboard</Heading>
          
          <HStack spacing={4}>
            <Select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              w="150px"
              size="sm"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
              <option value="custom">Custom Range</option>
            </Select>
            
            {timeRange === 'custom' && (
              <DateRangePicker 
                onChange={setDateRange} 
                startDate={dateRange.startDate} 
                endDate={dateRange.endDate} 
              />
            )}
            
            <Select 
              value={activeRegion} 
              onChange={(e) => setActiveRegion(e.target.value)}
              w="150px"
              size="sm"
            >
              <option value="all">All Regions</option>
              <option value="north">North</option>
              <option value="south">South</option>
              <option value="east">East</option>
              <option value="west">West</option>
            </Select>
            
            <Button
              leftIcon={<FiDownload />}
              colorScheme="green"
              size="sm"
              onClick={handleExportData}
            >
              Export Data
            </Button>
          </HStack>
        </Flex>
        
        {/* Stats Overview */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
          <Stat
            px={4}
            py={3}
            bg={bgColor}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="sm"
          >
            <Flex justifyContent="space-between">
              <Box>
                <StatLabel>Total Users</StatLabel>
                <StatNumber>{analyticsData?.stats.totalUsers}</StatNumber>
                <StatHelpText>
                  <StatArrow type={analyticsData?.stats.userGrowth >= 0 ? 'increase' : 'decrease'} />
                  {Math.abs(analyticsData?.stats.userGrowth).toFixed(1)}% from previous period
                </StatHelpText>
              </Box>
              <Flex
                alignItems="center"
                justifyContent="center"
                w={14}
                h={14}
                bg="blue.100"
                color="blue.500"
                borderRadius="full"
              >
                <Icon as={FiUsers} w={6} h={6} />
              </Flex>
            </Flex>
          </Stat>
          
          <Stat
            px={4}
            py={3}
            bg={bgColor}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="sm"
          >
            <Flex justifyContent="space-between">
              <Box>
                <StatLabel>Total Collections</StatLabel>
                <StatNumber>{analyticsData?.stats.totalCollections}</StatNumber>
                <StatHelpText>
                  <StatArrow type={analyticsData?.stats.collectionGrowth >= 0 ? 'increase' : 'decrease'} />
                  {Math.abs(analyticsData?.stats.collectionGrowth).toFixed(1)}% from previous period
                </StatHelpText>
              </Box>
              <Flex
                alignItems="center"
                justifyContent="center"
                w={14}
                h={14}
                bg="green.100"
                color="green.500"
                borderRadius="full"
              >
                <Icon as={MdRecycling} w={6} h={6} />
              </Flex>
            </Flex>
          </Stat>
          
          <Stat
            px={4}
            py={3}
            bg={bgColor}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="sm"
          >
            <Flex justifyContent="space-between">
              <Box>
                <StatLabel>Total Products</StatLabel>
                <StatNumber>{analyticsData?.stats.totalProducts}</StatNumber>
                <StatHelpText>
                  <StatArrow type={analyticsData?.stats.productGrowth >= 0 ? 'increase' : 'decrease'} />
                  {Math.abs(analyticsData?.stats.productGrowth).toFixed(1)}% from previous period
                </StatHelpText>
              </Box>
              <Flex
                alignItems="center"
                justifyContent="center"
                w={14}
                h={14}
                bg="purple.100"
                color="purple.500"
                borderRadius="full"
              >
                <Icon as={FiPackage} w={6} h={6} />
              </Flex>
            </Flex>
          </Stat>
          
          <Stat
            px={4}
            py={3}
            bg={bgColor}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="sm"
          >
            <Flex justifyContent="space-between">
              <Box>
                <StatLabel>Total Tokens Issued</StatLabel>
                <StatNumber>{analyticsData?.stats.totalTokens}</StatNumber>
                <StatHelpText>
                  <StatArrow type={analyticsData?.stats.tokenGrowth >= 0 ? 'increase' : 'decrease'} />
                  {Math.abs(analyticsData?.stats.tokenGrowth).toFixed(1)}% from previous period
                </StatHelpText>
              </Box>
              <Flex
                alignItems="center"
                justifyContent="center"
                w={14}
                h={14}
                bg="orange.100"
                color="orange.500"
                borderRadius="full"
              >
                <Icon as={FiDollarSign} w={6} h={6} />
              </Flex>
            </Flex>
          </Stat>
        </SimpleGrid>
        
        {/* Charts */}
        <Tabs colorScheme="green" isLazy>
          <TabList>
            <Tab>Collection Trends</Tab>
            <Tab>Material Distribution</Tab>
            <Tab>Token Economics</Tab>
            <Tab>Geographic Data</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                <Box
                  bg={bgColor}
                  p={4}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={borderColor}
                  boxShadow="sm"
                  height="400px"
                >
                  <Heading size="md" mb={4}>Collection Trends by Material Type</Heading>
                  {collectionTrendsData ? (
                    <Box height="320px">
                      <Line 
                        data={collectionTrendsData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Weight (kg)'
                              }
                            },
                            x: {
                              title: {
                                display: true,
                                text: 'Date'
                              }
                            }
                          }
                        }}
                      />
                    </Box>
                  ) : (
                    <Flex justify="center" align="center" height="320px">
                      <Text>No data available</Text>
                    </Flex>
                  )}
                </Box>
                
                <Box
                  bg={bgColor}
                  p={4}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={borderColor}
                  boxShadow="sm"
                >
                  <Heading size="md" mb={4}>Top Performing Regions</Heading>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Region</Th>
                        <Th isNumeric>Collections</Th>
                        <Th isNumeric>Weight (kg)</Th>
                        <Th isNumeric>Growth</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {analyticsData?.topRegions.map((region, index) => (
                        <Tr key={index}>
                          <Td>{region.name}</Td>
                          <Td isNumeric>{region.collections}</Td>
                          <Td isNumeric>{region.weight.toFixed(2)}</Td>
                          <Td isNumeric>
                            <Flex justify="flex-end" align="center">
                              <StatArrow type={region.growth >= 0 ? 'increase' : 'decrease'} />
                              <Text>{Math.abs(region.growth).toFixed(1)}%</Text>
                            </Flex>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </SimpleGrid>
            </TabPanel>
            
            <TabPanel>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                <Box
                  bg={bgColor}
                  p={4}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={borderColor}
                  boxShadow="sm"
                  height="400px"
                >
                  <Heading size="md" mb={4}>Material Distribution</Heading>
                  {materialDistributionData ? (
                    <Flex justify="center" align="center" height="320px">
                      <Box width="70%">
                        <Doughnut 
                          data={materialDistributionData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'right',
                              }
                            }
                          }}
                        />
                      </Box>
                    </Flex>
                  ) : (
                    <Flex justify="center" align="center" height="320px">
                      <Text>No data available</Text>
                    </Flex>
                  )}
                </Box>
                
                <Box
                  bg={bgColor}
                  p={4}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={borderColor}
                  boxShadow="sm"
                  height="400px"
                >
                  <Heading size="md" mb={4}>Material Quality Distribution</Heading>
                  {analyticsData?.qualityDistribution ? (
                    <Box height="320px">
                      <Bar 
                        data={{
                          labels: ['Plastic', 'Paper', 'Metal'],
                          datasets: [
                            {
                              label: 'Excellent',
                              data: [
                                analyticsData.qualityDistribution.plastic.excellent,
                                analyticsData.qualityDistribution.paper.excellent,
                                analyticsData.qualityDistribution.metal.excellent
                              ],
                              backgroundColor: 'rgba(76, 175, 80, 0.6)',
                            },
                            {
                              label: 'Good',
                              data: [
                                analyticsData.qualityDistribution.plastic.good,
                                analyticsData.qualityDistribution.paper.good,
                                analyticsData.qualityDistribution.metal.good
                              ],
                              backgroundColor: 'rgba(255, 193, 7, 0.6)',
                            },
                            {
                              label: 'Fair',
                              data: [
                                analyticsData.qualityDistribution.plastic.fair,
                                analyticsData.qualityDistribution.paper.fair,
                                analyticsData.qualityDistribution.metal.fair
                              ],
                              backgroundColor: 'rgba(255, 87, 34, 0.6)',
                            },
                            {
                              label: 'Poor',
                              data: [
                                analyticsData.qualityDistribution.plastic.poor,
                                analyticsData.qualityDistribution.paper.poor,
                                analyticsData.qualityDistribution.metal.poor
                              ],
                              backgroundColor: 'rgba(244, 67, 54, 0.6)',
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            x: {
                              stacked: true,
                            },
                            y: {
                              stacked: true,
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Percentage'
                              }
                            }
                          }
                        }}
                      />
                    </Box>
                  ) : (
                    <Flex justify="center" align="center" height="320px">
                      <Text>No data available</Text>
                    </Flex>
                  )}
                </Box>
              </SimpleGrid>
            </TabPanel>
            
            <TabPanel>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                <Box
                  bg={bgColor}
                  p={4}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={borderColor}
                  boxShadow="sm"
                  height="400px"
                >
                  <Heading size="md" mb={4}>Token Distribution</Heading>
                  {tokenDistributionData ? (
                    <Flex justify="center" align="center" height="320px">
                      <Box width="70%">
                        <Pie 
                          data={tokenDistributionData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'right',
                              }
                            }
                          }}
                        />
                      </Box>
                    </Flex>
                  ) : (
                    <Flex justify="center" align="center" height="320px">
                      <Text>No data available</Text>
                    </Flex>
                  )}
                </Box>
                
                <Box
                  bg={bgColor}
                  p={4}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={borderColor}
                  boxShadow="sm"
                  height="400px"
                >
                  <Heading size="md" mb={4}>Token Transactions Over Time</Heading>
                  {analyticsData?.tokenTransactions ? (
                    <Box height="320px">
                      <Line 
                        data={{
                          labels: analyticsData.tokenTransactions.map(item => item.date),
                          datasets: [
                            {
                              label: 'Tokens Earned',
                              data: analyticsData.tokenTransactions.map(item => item.earned),
                              borderColor: 'rgba(76, 175, 80, 1)',
                              backgroundColor: 'rgba(76, 175, 80, 0.2)',
                              tension: 0.4,
                            },
                            {
                              label: 'Tokens Spent',
                              data: analyticsData.tokenTransactions.map(item => item.spent),
                              borderColor: 'rgba(233, 30, 99, 1)',
                              backgroundColor: 'rgba(233, 30, 99, 0.2)',
                              tension: 0.4,
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Tokens'
                              }
                            },
                            x: {
                              title: {
                                display: true,
                                text: 'Date'
                              }
                            }
                          }
                        }}
                      />
                    </Box>
                  ) : (
                    <Flex justify="center" align="center" height="320px">
                      <Text>No data available</Text>
                    </Flex>
                  )}
                </Box>
              </SimpleGrid>
            </TabPanel>
            
            <TabPanel>
              <Box
                bg={bgColor}
                p={4}
                borderRadius="lg"
                borderWidth="1px"
                borderColor={borderColor}
                boxShadow="sm"
                height="600px"
              >
                <Heading size="md" mb={4}>Geographic Distribution</Heading>
                {analyticsData?.geoData ? (
                  <MapView 
                    data={analyticsData.geoData} 
                    height="520px" 
                    centerLat={20.5937} 
                    centerLng={78.9629} 
                    zoom={5}
                  />
                ) : (
                  <Flex justify="center" align="center" height="520px">
                    <Text>No geographic data available</Text>
                  </Flex>
                )}
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </AdminLayout>
  );
};

export default AnalyticsDashboard;
```