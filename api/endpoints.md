# EcoChain API Endpoints

## Auth Service

### Register User

```
POST /api/auth/register
```

**Request:**

```json
{
  "name": "Sahil Mukkawar",
  "email": "sahil@example.com",
  "phone": "+91xxxx",
  "password": "securePassword123",
  "role": "user"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "u_001",
    "name": "Sahil Mukkawar",
    "email": "sahil@example.com",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login

```
POST /api/auth/login
```

**Request:**

```json
{
  "email": "sahil@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "u_001",
    "name": "Sahil Mukkawar",
    "email": "sahil@example.com",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Refresh Token

```
POST /api/auth/refresh-token
```

**Request:**

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
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Users Service

### Get User Profile

```
GET /api/users/:userId
```

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
    "ecoWallet": {
      "currentBalance": 120,
      "totalEarned": 500,
      "totalSpent": 380
    },
    "preferences": {
      "notificationSettings": {},
      "preferredPickupTime": "10:00-12:00",
      "recyclingGoals": 50
    },
    "accountStatus": "active",
    "registrationDate": "2023-01-15T10:30:00Z",
    "lastActive": "2023-06-20T15:45:00Z",
    "kycStatus": "verified",
    "sustainabilityScore": 74
  }
}
```

### Update User Profile

```
PUT /api/users/:userId
```

**Request:**

```json
{
  "personalInfo": {
    "name": "Sahil Mukkawar",
    "phone": "+91xxxx",
    "profileImage": "s3://bucket/user/u_001_new.jpg"
  },
  "address": {
    "street": "New Address Line 1",
    "city": "Nanded",
    "state": "Maharashtra",
    "zipCode": "431605",
    "coordinates": { "type": "Point", "coordinates": [77.317, 19.152] }
  },
  "preferences": {
    "preferredPickupTime": "14:00-16:00",
    "recyclingGoals": 75
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "User profile updated successfully",
  "data": {
    "userId": "u_001",
    "personalInfo": {
      "name": "Sahil Mukkawar",
      "email": "sahil@example.com",
      "phone": "+91xxxx",
      "profileImage": "s3://bucket/user/u_001_new.jpg"
    },
    "address": {
      "street": "New Address Line 1",
      "city": "Nanded",
      "state": "Maharashtra",
      "zipCode": "431605",
      "coordinates": { "type": "Point", "coordinates": [77.317, 19.152] }
    },
    "preferences": {
      "notificationSettings": {},
      "preferredPickupTime": "14:00-16:00",
      "recyclingGoals": 75
    }
  }
}
```

## Collections Service

### Request Collection

```
POST /api/collections
```

**Request:**

```json
{
  "userId": "u_001",
  "collectionDetails": {
    "type": "plastic",
    "subType": "PET",
    "weight": 5.2,
    "description": "Bottles, cleaned",
    "images": ["base64-encoded-image-1"]
  },
  "location": {
    "pickupAddress": "Line 1, Nanded, Maharashtra, 431605",
    "coordinates": { "type": "Point", "coordinates": [77.317, 19.152] }
  },
  "scheduling": {
    "requestedDate": "2023-07-10T00:00:00Z",
    "preferredTimeSlot": "10:00-12:00"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Collection request created successfully",
  "data": {
    "collectionId": "col_001",
    "userId": "u_001",
    "collectionDetails": {
      "type": "plastic",
      "subType": "PET",
      "weight": 5.2,
      "description": "Bottles, cleaned",
      "images": ["s3://bucket/collections/col_001/img1.jpg"]
    },
    "visionInference": {
      "material_type": "plastic",
      "sub_type": "PET",
      "quality_score": 0.82,
      "inferenceId": "inf_001"
    },
    "location": {
      "pickupAddress": "Line 1, Nanded, Maharashtra, 431605",
      "coordinates": { "type": "Point", "coordinates": [77.317, 19.152] }
    },
    "scheduling": {
      "requestedDate": "2023-07-10T00:00:00Z",
      "preferredTimeSlot": "10:00-12:00"
    },
    "status": "requested",
    "createdAt": "2023-07-05T14:30:00Z"
  }
}
```

### Get Collection Details

```
GET /api/collections/:collectionId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "collectionId": "col_001",
    "userId": "u_001",
    "collectorId": "c_001",
    "factoryId": "f_001",
    "collectionDetails": {
      "type": "plastic",
      "subType": "PET",
      "weight": 5.2,
      "quality": "good",
      "images": ["s3://bucket/collections/col_001/img1.jpg"],
      "description": "Bottles, cleaned"
    },
    "visionInference": {
      "material_type": "plastic",
      "sub_type": "PET",
      "quality_score": 0.82,
      "inferenceId": "inf_001"
    },
    "location": {
      "pickupAddress": "Line 1, Nanded, Maharashtra, 431605",
      "coordinates": { "type": "Point", "coordinates": [77.317, 19.152] }
    },
    "scheduling": {
      "requestedDate": "2023-07-10T00:00:00Z",
      "scheduledDate": "2023-07-10T00:00:00Z",
      "actualPickupDate": null,
      "preferredTimeSlot": "10:00-12:00"
    },
    "tokenCalculation": {
      "baseRate": 10,
      "qualityMultiplier": 1.2,
      "bonusTokens": 0,
      "totalTokensIssued": 62
    },
    "status": "scheduled",
    "verification": {
      "collectorNotes": "",
      "factoryFeedback": "",
      "qualityImages": [],
      "rejectionReason": ""
    },
    "logistics": {
      "estimatedPickupTime": "2023-07-10T10:30:00Z",
      "actualPickupTime": null,
      "deliveryToFactory": null,
      "transportCost": 20
    },
    "createdAt": "2023-07-05T14:30:00Z",
    "updatedAt": "2023-07-06T09:15:00Z"
  }
}
```

### Get User Collections

```
GET /api/collections/user/:userId
```

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
          "weight": 5.2
        },
        "scheduling": {
          "scheduledDate": "2023-07-10T00:00:00Z",
          "preferredTimeSlot": "10:00-12:00"
        },
        "status": "scheduled",
        "tokenCalculation": {
          "totalTokensIssued": 62
        }
      },
      {
        "collectionId": "col_002",
        "collectionDetails": {
          "type": "paper",
          "subType": "cardboard",
          "weight": 3.0
        },
        "scheduling": {
          "scheduledDate": "2023-07-15T00:00:00Z",
          "preferredTimeSlot": "14:00-16:00"
        },
        "status": "requested",
        "tokenCalculation": {
          "totalTokensIssued": 0
        }
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "limit": 10
    }
  }
}
```

### Update Collection Status (Collector)

```
PUT /api/collections/:collectionId/status
```

**Request:**

```json
{
  "status": "collected",
  "collectorNotes": "Collected as scheduled, material in good condition",
  "actualWeight": 5.5,
  "qualityImages": ["base64-encoded-image-1", "base64-encoded-image-2"],
  "actualPickupTime": "2023-07-10T11:15:00Z"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Collection status updated successfully",
  "data": {
    "collectionId": "col_001",
    "status": "collected",
    "verification": {
      "collectorNotes": "Collected as scheduled, material in good condition",
      "qualityImages": ["s3://bucket/collections/col_001/quality1.jpg", "s3://bucket/collections/col_001/quality2.jpg"]
    },
    "logistics": {
      "actualPickupTime": "2023-07-10T11:15:00Z"
    },
    "updatedAt": "2023-07-10T11:20:00Z"
  }
}
```

## Vision Service

### Analyze Waste Image

```
POST /api/vision/analyze
```

**Request:**

```json
{
  "image": "base64-encoded-image",
  "collectionId": "col_001"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "inferenceId": "inf_001",
    "material_type": "plastic",
    "sub_type": "PET",
    "quality_score": 0.82,
    "contaminants_detected": false,
    "estimated_weight": 5.0,
    "confidence": 0.95,
    "processing_time_ms": 320
  }
}
```

### Verify Collection Quality

```
POST /api/vision/verify
```

**Request:**

```json
{
  "collectionId": "col_001",
  "images": ["base64-encoded-image-1", "base64-encoded-image-2"],
  "reported_type": "plastic",
  "reported_subtype": "PET"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "verificationId": "ver_001",
    "collectionId": "col_001",
    "verification_result": {
      "type_match": true,
      "subtype_match": true,
      "quality_score": 0.85,
      "cleanliness_score": 0.78,
      "contamination_level": "low",
      "overall_assessment": "good"
    },
    "token_recommendation": {
      "base_rate": 10,
      "quality_multiplier": 1.2,
      "bonus_tokens": 0,
      "recommended_total": 62
    }
  }
}
```

## Matching Service

### Match Collection to Factory

```
POST /api/matching/match-factory
```

**Request:**

```json
{
  "collectionId": "col_001",
  "material_type": "plastic",
  "sub_type": "PET",
  "weight": 5.2,
  "quality": "good",
  "location": {
    "coordinates": { "type": "Point", "coordinates": [77.317, 19.152] }
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "matchId": "match_001",
    "collectionId": "col_001",
    "matched_factories": [
      {
        "factoryId": "f_001",
        "name": "EcoPlast Industries",
        "match_score": 0.92,
        "distance_km": 12.5,
        "material_rate": 12.5,
        "estimated_token_value": 65,
        "has_active_request": true,
        "request_urgency": "high"
      },
      {
        "factoryId": "f_002",
        "name": "Green Recyclers Ltd",
        "match_score": 0.85,
        "distance_km": 18.2,
        "material_rate": 11.0,
        "estimated_token_value": 57,
        "has_active_request": false,
        "request_urgency": null
      }
    ],
    "recommended_factory": "f_001"
  }
}
```

### Match Collections to Material Request

```
POST /api/matching/match-collections
```

**Request:**

```json
{
  "requestId": "req_001",
  "factoryId": "f_001",
  "materialType": "plastic",
  "subType": "PET",
  "quantity": 100,
  "qualityRequirement": "good",
  "maxDistance": 50
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "requestId": "req_001",
    "matched_collections": [
      {
        "collectionId": "col_001",
        "userId": "u_001",
        "match_score": 0.95,
        "distance_km": 12.5,
        "weight": 5.2,
        "quality": "good",
        "status": "scheduled",
        "scheduledDate": "2023-07-10T00:00:00Z"
      },
      {
        "collectionId": "col_003",
        "userId": "u_002",
        "match_score": 0.88,
        "distance_km": 15.8,
        "weight": 4.8,
        "quality": "good",
        "status": "requested",
        "scheduledDate": "2023-07-12T00:00:00Z"
      }
    ],
    "total_matched_weight": 10.0,
    "remaining_quantity": 90.0
  }
}
```

## Routing Service

### Generate Optimal Collection Route

```
POST /api/routing/optimize
```

**Request:**

```json
{
  "collectorId": "c_001",
  "startLocation": {
    "coordinates": { "type": "Point", "coordinates": [77.300, 19.140] }
  },
  "endLocation": {
    "coordinates": { "type": "Point", "coordinates": [77.320, 19.160] }
  },
  "collections": [
    {
      "collectionId": "col_001",
      "location": {
        "coordinates": { "type": "Point", "coordinates": [77.317, 19.152] }
      },
      "timeSlot": "10:00-12:00",
      "estimatedDuration": 15
    },
    {
      "collectionId": "col_002",
      "location": {
        "coordinates": { "type": "Point", "coordinates": [77.310, 19.148] }
      },
      "timeSlot": "10:00-12:00",
      "estimatedDuration": 10
    },
    {
      "collectionId": "col_003",
      "location": {
        "coordinates": { "type": "Point", "coordinates": [77.305, 19.145] }
      },
      "timeSlot": "14:00-16:00",
      "estimatedDuration": 20
    }
  ],
  "date": "2023-07-10",
  "vehicleCapacity": 500,
  "maxWorkingHours": 8
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "routeId": "route_001",
    "collectorId": "c_001",
    "date": "2023-07-10",
    "optimized_route": [
      {
        "collectionId": "col_002",
        "estimatedArrival": "2023-07-10T10:15:00Z",
        "estimatedDeparture": "2023-07-10T10:25:00Z"
      },
      {
        "collectionId": "col_001",
        "estimatedArrival": "2023-07-10T10:40:00Z",
        "estimatedDeparture": "2023-07-10T10:55:00Z"
      },
      {
        "collectionId": "col_003",
        "estimatedArrival": "2023-07-10T14:10:00Z",
        "estimatedDeparture": "2023-07-10T14:30:00Z"
      }
    ],
    "total_distance": 12.5,
    "total_duration": 255,
    "total_collections": 3,
    "total_weight": 13.0,
    "route_map_url": "https://maps.ecochain.com/route/route_001"
  }
}
```

### Get Collector Daily Route

```
GET /api/routing/collector/:collectorId/date/:date
```

**Response:**

```json
{
  "success": true,
  "data": {
    "routeId": "route_001",
    "collectorId": "c_001",
    "date": "2023-07-10",
    "optimized_route": [
      {
        "collectionId": "col_002",
        "userId": "u_002",
        "address": "Address 2, Nanded, Maharashtra",
        "coordinates": { "type": "Point", "coordinates": [77.310, 19.148] },
        "timeSlot": "10:00-12:00",
        "estimatedArrival": "2023-07-10T10:15:00Z",
        "estimatedDeparture": "2023-07-10T10:25:00Z",
        "status": "scheduled",
        "collectionDetails": {
          "type": "paper",
          "subType": "cardboard",
          "weight": 3.0
        }
      },
      {
        "collectionId": "col_001",
        "userId": "u_001",
        "address": "Line 1, Nanded, Maharashtra, 431605",
        "coordinates": { "type": "Point", "coordinates": [77.317, 19.152] },
        "timeSlot": "10:00-12:00",
        "estimatedArrival": "2023-07-10T10:40:00Z",
        "estimatedDeparture": "2023-07-10T10:55:00Z",
        "status": "scheduled",
        "collectionDetails": {
          "type": "plastic",
          "subType": "PET",
          "weight": 5.2
        }
      },
      {
        "collectionId": "col_003",
        "userId": "u_003",
        "address": "Address 3, Nanded, Maharashtra",
        "coordinates": { "type": "Point", "coordinates": [77.305, 19.145] },
        "timeSlot": "14:00-16:00",
        "estimatedArrival": "2023-07-10T14:10:00Z",
        "estimatedDeparture": "2023-07-10T14:30:00Z",
        "status": "scheduled",
        "collectionDetails": {
          "type": "metal",
          "subType": "aluminum",
          "weight": 4.8
        }
      }
    ],
    "total_distance": 12.5,
    "total_duration": 255,
    "total_collections": 3,
    "total_weight": 13.0,
    "route_map_url": "https://maps.ecochain.com/route/route_001",
    "factory_dropoff": {
      "factoryId": "f_001",
      "name": "EcoPlast Industries",
      "address": "Factory Address, Industrial Area, Nanded",
      "coordinates": { "type": "Point", "coordinates": [77.320, 19.160] },
      "estimatedArrival": "2023-07-10T15:30:00Z"
    }
  }
}
```

## Wallet Service

### Get User Wallet

```
GET /api/wallet/:userId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "u_001",
    "currentBalance": 120,
    "totalEarned": 500,
    "totalSpent": 380,
    "recentTransactions": [
      {
        "transactionId": "tx_001",
        "type": "collection_reward",
        "amount": 62,
        "relatedId": "col_001",
        "description": "Reward for plastic collection",
        "timestamp": "2023-07-10T12:30:00Z"
      },
      {
        "transactionId": "tx_002",
        "type": "product_purchase",
        "amount": -50,
        "relatedId": "order_001",
        "description": "Purchase of recycled notebook",
        "timestamp": "2023-07-15T09:45:00Z"
      }
    ]
  }
}
```

### Create Transaction

```
POST /api/wallet/transaction
```

**Request:**

```json
{
  "userId": "u_001",
  "type": "collection_reward",
  "amount": 62,
  "relatedId": "col_001",
  "description": "Reward for plastic collection"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "transactionId": "tx_001",
    "userId": "u_001",
    "type": "collection_reward",
    "amount": 62,
    "relatedId": "col_001",
    "description": "Reward for plastic collection",
    "balanceBefore": 58,
    "balanceAfter": 120,
    "status": "completed",
    "timestamp": "2023-07-10T12:30:00Z"
  }
}
```

### Get Transaction History

```
GET /api/wallet/:userId/transactions
```

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
        "timestamp": "2023-07-10T12:30:00Z"
      },
      {
        "transactionId": "tx_002",
        "type": "product_purchase",
        "amount": -50,
        "relatedId": "order_001",
        "description": "Purchase of recycled notebook",
        "balanceBefore": 120,
        "balanceAfter": 70,
        "status": "completed",
        "timestamp": "2023-07-15T09:45:00Z"
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "limit": 10
    }
  }
}
```

## Marketplace Service

### Get Products

```
GET /api/marketplace/products
```

**Response:**

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "productId": "p_001",
        "name": "Recycled Notebook",
        "description": "Notebook made from 100% recycled paper",
        "category": "stationery",
        "images": ["https://ecochain.com/images/products/p_001_1.jpg"],
        "price": 150,
        "tokenPrice": 50,
        "inventory": {
          "available": 100
        },
        "sustainability": {
          "recycledMaterials": ["paper"],
          "carbonFootprint": 0.5,
          "waterSaved": 10,
          "energySaved": 5
        },
        "ratings": {
          "average": 4.5,
          "count": 28
        }
      },
      {
        "productId": "p_002",
        "name": "Recycled Plastic Pen",
        "description": "Pen made from recycled PET bottles",
        "category": "stationery",
        "images": ["https://ecochain.com/images/products/p_002_1.jpg"],
        "price": 50,
        "tokenPrice": 15,
        "inventory": {
          "available": 200
        },
        "sustainability": {
          "recycledMaterials": ["plastic"],
          "carbonFootprint": 0.2,
          "waterSaved": 5,
          "energySaved": 3
        },
        "ratings": {
          "average": 4.2,
          "count": 45
        }
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "limit": 10
    }
  }
}
```

### Get Product Details

```
GET /api/marketplace/products/:productId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "productId": "p_001",
    "factoryId": "f_001",
    "name": "Recycled Notebook",
    "description": "Notebook made from 100% recycled paper. Each notebook saves approximately 10 liters of water and reduces carbon emissions by 0.5 kg compared to traditional notebooks.",
    "category": "stationery",
    "subCategory": "notebooks",
    "images": [
      "https://ecochain.com/images/products/p_001_1.jpg",
      "https://ecochain.com/images/products/p_001_2.jpg"
    ],
    "price": 150,
    "tokenPrice": 50,
    "inventory": {
      "available": 100,
      "reserved": 5,
      "sold": 45
    },
    "specifications": {
      "pages": 100,
      "dimensions": "21cm x 15cm",
      "weight": "200g",
      "paperType": "recycled, unbleached"
    },
    "sustainability": {
      "recycledMaterials": ["paper"],
      "carbonFootprint": 0.5,
      "waterSaved": 10,
      "energySaved": 5
    },
    "status": "active",
    "ratings": {
      "average": 4.5,
      "count": 28
    },
    "tags": ["eco-friendly", "stationery", "recycled", "sustainable"],
    "createdAt": "2023-05-10T10:00:00Z",
    "updatedAt": "2023-06-15T14:30:00Z"
  }
}
```

### Create Product (Factory)

```
POST /api/marketplace/products
```

**Request:**

```json
{
  "factoryId": "f_001",
  "name": "Recycled Plastic Tote Bag",
  "description": "Tote bag made from recycled PET bottles. Durable and waterproof.",
  "category": "bags",
  "subCategory": "tote",
  "images": ["base64-encoded-image-1", "base64-encoded-image-2"],
  "price": 200,
  "tokenPrice": 75,
  "inventory": {
    "available": 50
  },
  "specifications": {
    "dimensions": "40cm x 35cm x 10cm",
    "weight": "150g",
    "material": "recycled PET",
    "capacity": "10kg"
  },
  "sustainability": {
    "recycledMaterials": ["plastic"],
    "carbonFootprint": 0.8,
    "waterSaved": 15,
    "energySaved": 7
  },
  "tags": ["eco-friendly", "bags", "recycled", "sustainable", "waterproof"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "productId": "p_003",
    "factoryId": "f_001",
    "name": "Recycled Plastic Tote Bag",
    "status": "active",
    "createdAt": "2023-07-20T11:30:00Z"
  }
}
```

## Orders Service

### Create Order

```
POST /api/orders
```

**Request:**

```json
{
  "userId": "u_001",
  "items": [
    {
      "productId": "p_001",
      "quantity": 2
    },
    {
      "productId": "p_002",
      "quantity": 3
    }
  ],
  "payment": {
    "method": "token",
    "useTokens": true
  },
  "shipping": {
    "address": "Line 1, Nanded, Maharashtra, 431605",
    "city": "Nanded",
    "state": "Maharashtra",
    "zipCode": "431605",
    "coordinates": { "type": "Point", "coordinates": [77.317, 19.152] }
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "order_001",
    "userId": "u_001",
    "items": [
      {
        "productId": "p_001",
        "name": "Recycled Notebook",
        "quantity": 2,
        "price": 150,
        "tokenPrice": 50,
        "subtotal": 300,
        "tokenSubtotal": 100
      },
      {
        "productId": "p_002",
        "name": "Recycled Plastic Pen",
        "quantity": 3,
        "price": 50,
        "tokenPrice": 15,
        "subtotal": 150,
        "tokenSubtotal": 45
      }
    ],
    "payment": {
      "method": "token",
      "totalAmount": 450,
      "totalTokens": 145,
      "status": "completed"
    },
    "shipping": {
      "address": "Line 1, Nanded, Maharashtra, 431605",
      "city": "Nanded",
      "state": "Maharashtra",
      "zipCode": "431605",
      "method": "standard",
      "estimatedDelivery": "2023-07-25T00:00:00Z",
      "status": "processing"
    },
    "status": "processing",
    "createdAt": "2023-07-20T15:45:00Z"
  }
}
```

### Get Order Details

```
GET /api/orders/:orderId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "orderId": "order_001",
    "userId": "u_001",
    "items": [
      {
        "productId": "p_001",
        "name": "Recycled Notebook",
        "quantity": 2,
        "price": 150,
        "tokenPrice": 50,
        "subtotal": 300,
        "tokenSubtotal": 100
      },
      {
        "productId": "p_002",
        "name": "Recycled Plastic Pen",
        "quantity": 3,
        "price": 50,
        "tokenPrice": 15,
        "subtotal": 150,
        "tokenSubtotal": 45
      }
    ],
    "payment": {
      "method": "token",
      "totalAmount": 450,
      "totalTokens": 145,
      "transactionId": "tx_003",
      "status": "completed"
    },
    "shipping": {
      "address": "Line 1, Nanded, Maharashtra, 431605",
      "city": "Nanded",
      "state": "Maharashtra",
      "zipCode": "431605",
      "coordinates": { "type": "Point", "coordinates": [77.317, 19.152] },
      "method": "standard",
      "trackingNumber": "TRK123456789",
      "estimatedDelivery": "2023-07-25T00:00:00Z",
      "status": "shipped"
    },
    "status": "shipped",
    "notes": "",
    "createdAt": "2023-07-20T15:45:00Z",
    "updatedAt": "2023-07-21T10:30:00Z"
  }
}
```

### Get User Orders

```
GET /api/orders/user/:userId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "orderId": "order_001",
        "items": [
          {
            "productId": "p_001",
            "name": "Recycled Notebook",
            "quantity": 2
          },
          {
            "productId": "p_002",
            "name": "Recycled Plastic Pen",
            "quantity": 3
          }
        ],
        "payment": {
          "totalAmount": 450,
          "totalTokens": 145
        },
        "status": "shipped",
        "createdAt": "2023-07-20T15:45:00Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10
    }
  }
}
```

## Factories Service

### Get Factory Profile

```
GET /api/factories/:factoryId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "factoryId": "f_001",
    "name": "EcoPlast Industries",
    "description": "Specializing in recycling plastic waste into new products",
    "contactInfo": {
      "email": "contact@ecoplast.com",
      "phone": "+91xxxx",
      "website": "https://ecoplast.com",
      "contactPerson": "Rajesh Kumar"
    },
    "location": {
      "address": "Factory Address, Industrial Area, Nanded",
      "city": "Nanded",
      "state": "Maharashtra",
      "zipCode": "431605",
      "coordinates": { "type": "Point", "coordinates": [77.320, 19.160] }
    },
    "acceptedMaterials": [
      {
        "type": "plastic",
        "subTypes": ["PET", "HDPE", "LDPE"],
        "minQuality": "fair",
        "ratePerKg": 12.5
      },
      {
        "type": "paper",
        "subTypes": ["cardboard", "newspaper", "mixed"],
        "minQuality": "good",
        "ratePerKg": 8.0
      }
    ],
    "operatingHours": {
      "monday": "09:00-18:00",
      "tuesday": "09:00-18:00",
      "wednesday": "09:00-18:00",
      "thursday": "09:00-18:00",
      "friday": "09:00-18:00",
      "saturday": "09:00-14:00",
      "sunday": "closed"
    },
    "capacity": {
      "daily": 1000,
      "current": 450
    },
    "certifications": ["ISO 14001", "Green Business Certified"],
    "status": "active"
  }
}
```

### Create Material Request

```
POST /api/factories/material-requests
```

**Request:**

```json
{
  "factoryId": "f_001",
  "materialType": "plastic",
  "subType": "PET",
  "quantity": 100,
  "qualityRequirement": "good",
  "pricePerKg": 12.5,
  "urgency": "high",
  "deadline": "2023-08-01T00:00:00Z",
  "notes": "Need clean PET bottles for recycling into new products"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Material request created successfully",
  "data": {
    "requestId": "req_001",
    "factoryId": "f_001",
    "materialType": "plastic",
    "subType": "PET",
    "quantity": 100,
    "qualityRequirement": "good",
    "pricePerKg": 12.5,
    "urgency": "high",
    "deadline": "2023-08-01T00:00:00Z",
    "status": "open",
    "createdAt": "2023-07-15T10:00:00Z"
  }
}
```

### Get Factory Material Requests

```
GET /api/factories/:factoryId/material-requests
```

**Response:**

```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "requestId": "req_001",
        "materialType": "plastic",
        "subType": "PET",
        "quantity": 100,
        "qualityRequirement": "good",
        "pricePerKg": 12.5,
        "urgency": "high",
        "deadline": "2023-08-01T00:00:00Z",
        "status": "open",
        "fulfilledQuantity": 10,
        "createdAt": "2023-07-15T10:00:00Z"
      },
      {
        "requestId": "req_002",
        "materialType": "paper",
        "subType": "cardboard",
        "quantity": 50,
        "qualityRequirement": "good",
        "pricePerKg": 8.0,
        "urgency": "medium",
        "deadline": "2023-08-15T00:00:00Z",
        "status": "open",
        "fulfilledQuantity": 0,
        "createdAt": "2023-07-16T14:30:00Z"
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "limit": 10
    }
  }
}
```

## Analytics Service

### Get User Analytics

```
GET /api/analytics/user/:userId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "u_001",
    "collections": {
      "total": 5,
      "byMaterial": {
        "plastic": 3,
        "paper": 1,
        "metal": 1
      },
      "totalWeight": 25.5,
      "weightByMaterial": {
        "plastic": 15.2,
        "paper": 5.3,
        "metal": 5.0
      }
    },
    "tokens": {
      "earned": 500,
      "spent": 380,
      "current": 120
    },
    "sustainability": {
      "carbonSaved": 12.5,
      "waterSaved": 250,
      "energySaved": 75,
      "treesEquivalent": 2.5
    },
    "orders": {
      "total": 3,
      "totalSpent": 1200,
      "totalTokensSpent": 380
    },
    "trends": {
      "monthly": {
        "collections": [2, 1, 2, 0, 0, 0],
        "tokens": [200, 100, 200, 0, 0, 0],
        "orders": [1, 1, 1, 0, 0, 0]
      }
    }
  }
}
```

### Get System Analytics

```
GET /api/analytics/system
```

**Response:**

```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1000,
      "active": 850,
      "newThisMonth": 120
    },
    "collections": {
      "total": 5000,
      "completed": 4500,
      "byMaterial": {
        "plastic": 2500,
        "paper": 1500,
        "metal": 1000
      },
      "totalWeight": 25000,
      "weightByMaterial": {
        "plastic": 12000,
        "paper": 8000,
        "metal": 5000
      }
    },
    "factories": {
      "total": 20,
      "active": 18
    },
    "products": {
      "total": 100,
      "active": 85
    },
    "orders": {
      "total": 2000,
      "completed": 1800,
      "totalRevenue": 500000,
      "totalTokensSpent": 150000
    },
    "sustainability": {
      "carbonSaved": 12500,
      "waterSaved": 250000,
      "energySaved": 75000,
      "treesEquivalent": 2500
    },
    "trends": {
      "monthly": {
        "collections": [800, 850, 900, 950, 1000, 500],
        "users": [800, 850, 900, 950, 980, 1000],
        "orders": [300, 320, 350, 380, 400, 250]
      }
    }
  }
}
```

## Admin Service

### Get System Status

```
GET /api/admin/system-status
```

**Response:**

```json
{
  "success": true,
  "data": {
    "services": [
      {
        "name": "auth-service",
        "status": "healthy",
        "uptime": 1209600,
        "version": "1.0.0"
      },
      {
        "name": "users-service",
        "status": "healthy",
        "uptime": 1209600,
        "version": "1.0.0"
      },
      {
        "name": "collections-service",
        "status": "healthy",
        "uptime": 1209600,
        "version": "1.0.0"
      },
      {
        "name": "vision-service",
        "status": "healthy",
        "uptime": 1209600,
        "version": "1.0.0"
      }
    ],
    "database": {
      "status": "healthy",
      "connections": 50,
      "storage": {
        "used": 10.5,
        "total": 100,
        "unit": "GB"
      }
    },
    "queue": {
      "status": "healthy",
      "activeJobs": 25,
      "completedJobs": 10000,
      "failedJobs": 50
    },
    "ai": {
      "vision": {
        "status": "healthy",
        "accuracy": 0.92,
        "requestsPerMinute": 10
      },
      "matching": {
        "status": "healthy",
        "accuracy": 0.95,
        "requestsPerMinute": 5
      },
      "routing": {
        "status": "healthy",
        "accuracy": 0.90,
        "requestsPerMinute": 2
      }
    }
  }
}
```

### Get System Configuration

```
GET /api/admin/system-config
```

**Response:**

```json
{
  "success": true,
  "data": {
    "tokenEconomy": {
      "baseRates": {
        "plastic": 10,
        "paper": 8,
        "metal": 15
      },
      "qualityMultipliers": {
        "poor": 0.8,
        "fair": 1.0,
        "good": 1.2,
        "excellent": 1.5
      },
      "bonusThresholds": {
        "weight": 10,
        "frequency": 5
      }
    },
    "visionModel": {
      "confidenceThreshold": 0.7,
      "qualityThreshold": 0.6,
      "contaminationThreshold": 0.2
    },
    "matchingModel": {
      "maxDistance": 50,
      "weightFactor": 0.3,
      "distanceFactor": 0.4,
      "urgencyFactor": 0.3
    },
    "routingModel": {
      "maxCollectionsPerDay": 20,
      "maxDistance": 100,
      "timeWindowMinutes": 30
    },
    "notifications": {
      "enabled": true,
      "channels": ["push", "email", "sms"],
      "reminderHours": 24
    }
  }
}
```

### Update System Configuration

```
PUT /api/admin/system-config
```

**Request:**

```json
{
  "tokenEconomy": {
    "baseRates": {
      "plastic": 12,
      "paper": 10,
      "metal": 18
    },
    "qualityMultipliers": {
      "poor": 0.8,
      "fair": 1.0,
      "good": 1.2,
      "excellent": 1.5
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "System configuration updated successfully",
  "data": {
    "tokenEconomy": {
      "baseRates": {
        "plastic": 12,
        "paper": 10,
        "metal": 18
      },
      "qualityMultipliers": {
        "poor": 0.8,
        "fair": 1.0,
        "good": 1.2,
        "excellent": 1.5
      },
      "bonusThresholds": {
        "weight": 10,
        "frequency": 5
      }
    }
  }
}
```