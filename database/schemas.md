# MongoDB Schemas for EcoChain

## 1. Users Collection

```javascript
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "personalInfo", "role", "accountStatus", "registrationDate"],
      properties: {
        userId: {
          bsonType: "string",
          description: "Unique identifier for the user"
        },
        personalInfo: {
          bsonType: "object",
          required: ["name", "email"],
          properties: {
            name: { bsonType: "string" },
            email: { bsonType: "string" },
            phone: { bsonType: "string" },
            profileImage: { bsonType: "string" }
          }
        },
        address: {
          bsonType: "object",
          properties: {
            street: { bsonType: "string" },
            city: { bsonType: "string" },
            state: { bsonType: "string" },
            zipCode: { bsonType: "string" },
            coordinates: {
              bsonType: "object",
              required: ["type", "coordinates"],
              properties: {
                type: { bsonType: "string" },
                coordinates: { bsonType: "array" }
              }
            }
          }
        },
        role: {
          bsonType: "string",
          enum: ["user", "collector", "factory", "admin"]
        },
        ecoWallet: {
          bsonType: "object",
          properties: {
            currentBalance: { bsonType: "double" },
            totalEarned: { bsonType: "double" },
            totalSpent: { bsonType: "double" }
          }
        },
        preferences: {
          bsonType: "object",
          properties: {
            notificationSettings: { bsonType: "object" },
            preferredPickupTime: { bsonType: "string" },
            recyclingGoals: { bsonType: "double" }
          }
        },
        accountStatus: {
          bsonType: "string",
          enum: ["active", "inactive", "suspended"]
        },
        registrationDate: { bsonType: "date" },
        lastActive: { bsonType: "date" },
        kycStatus: {
          bsonType: "string",
          enum: ["pending", "verified", "rejected"]
        },
        sustainabilityScore: { bsonType: "int" }
      }
    }
  }
});

// Indexes
db.users.createIndex({ userId: 1 }, { unique: true });
db.users.createIndex({ "personalInfo.email": 1 }, { unique: true });
db.users.createIndex({ "address.coordinates": "2dsphere" });
db.users.createIndex({ role: 1 });
db.users.createIndex({ accountStatus: 1 });
```

## 2. GarbageCollections Collection

```javascript
db.createCollection("garbageCollections", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["collectionId", "userId", "collectionDetails", "status", "createdAt"],
      properties: {
        collectionId: {
          bsonType: "string",
          description: "Unique identifier for the collection"
        },
        userId: {
          bsonType: "objectId",
          description: "Reference to the user who requested the collection"
        },
        collectorId: {
          bsonType: "objectId",
          description: "Reference to the collector assigned to the collection"
        },
        factoryId: {
          bsonType: "objectId",
          description: "Reference to the factory that will receive the collection"
        },
        collectionDetails: {
          bsonType: "object",
          required: ["type"],
          properties: {
            type: {
              bsonType: "string",
              enum: ["plastic", "paper", "metal", "glass", "electronic", "organic", "other"]
            },
            subType: { bsonType: "string" },
            weight: { bsonType: "double" },
            quality: {
              bsonType: "string",
              enum: ["poor", "fair", "good", "excellent"]
            },
            images: { bsonType: "array" },
            description: { bsonType: "string" }
          }
        },
        visionInference: {
          bsonType: "object",
          properties: {
            material_type: { bsonType: "string" },
            sub_type: { bsonType: "string" },
            quality_score: { bsonType: "double" },
            inferenceId: { bsonType: "string" }
          }
        },
        location: {
          bsonType: "object",
          properties: {
            pickupAddress: { bsonType: "string" },
            coordinates: {
              bsonType: "object",
              required: ["type", "coordinates"],
              properties: {
                type: { bsonType: "string" },
                coordinates: { bsonType: "array" }
              }
            }
          }
        },
        scheduling: {
          bsonType: "object",
          properties: {
            requestedDate: { bsonType: "date" },
            scheduledDate: { bsonType: "date" },
            actualPickupDate: { bsonType: "date" },
            preferredTimeSlot: { bsonType: "string" }
          }
        },
        tokenCalculation: {
          bsonType: "object",
          properties: {
            baseRate: { bsonType: "double" },
            qualityMultiplier: { bsonType: "double" },
            bonusTokens: { bsonType: "double" },
            totalTokensIssued: { bsonType: "double" }
          }
        },
        status: {
          bsonType: "string",
          enum: ["requested", "scheduled", "in_progress", "collected", "delivered", "verified", "rejected", "completed"]
        },
        verification: {
          bsonType: "object",
          properties: {
            collectorNotes: { bsonType: "string" },
            factoryFeedback: { bsonType: "string" },
            qualityImages: { bsonType: "array" },
            rejectionReason: { bsonType: "string" }
          }
        },
        logistics: {
          bsonType: "object",
          properties: {
            estimatedPickupTime: { bsonType: "date" },
            actualPickupTime: { bsonType: "date" },
            deliveryToFactory: { bsonType: "date" },
            transportCost: { bsonType: "double" }
          }
        },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

// Indexes
db.garbageCollections.createIndex({ collectionId: 1 }, { unique: true });
db.garbageCollections.createIndex({ userId: 1 });
db.garbageCollections.createIndex({ collectorId: 1 });
db.garbageCollections.createIndex({ factoryId: 1 });
db.garbageCollections.createIndex({ status: 1 });
db.garbageCollections.createIndex({ "location.coordinates": "2dsphere" });
db.garbageCollections.createIndex({ "scheduling.scheduledDate": 1 });
```

## 3. Factories Collection

```javascript
db.createCollection("factories", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["factoryId", "name", "location", "status"],
      properties: {
        factoryId: {
          bsonType: "string",
          description: "Unique identifier for the factory"
        },
        name: { bsonType: "string" },
        description: { bsonType: "string" },
        contactInfo: {
          bsonType: "object",
          properties: {
            email: { bsonType: "string" },
            phone: { bsonType: "string" },
            website: { bsonType: "string" },
            contactPerson: { bsonType: "string" }
          }
        },
        location: {
          bsonType: "object",
          required: ["address", "coordinates"],
          properties: {
            address: { bsonType: "string" },
            city: { bsonType: "string" },
            state: { bsonType: "string" },
            zipCode: { bsonType: "string" },
            coordinates: {
              bsonType: "object",
              required: ["type", "coordinates"],
              properties: {
                type: { bsonType: "string" },
                coordinates: { bsonType: "array" }
              }
            }
          }
        },
        acceptedMaterials: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["type"],
            properties: {
              type: { bsonType: "string" },
              subTypes: { bsonType: "array" },
              minQuality: { bsonType: "string" },
              ratePerKg: { bsonType: "double" }
            }
          }
        },
        operatingHours: {
          bsonType: "object",
          properties: {
            monday: { bsonType: "string" },
            tuesday: { bsonType: "string" },
            wednesday: { bsonType: "string" },
            thursday: { bsonType: "string" },
            friday: { bsonType: "string" },
            saturday: { bsonType: "string" },
            sunday: { bsonType: "string" }
          }
        },
        capacity: {
          bsonType: "object",
          properties: {
            daily: { bsonType: "double" },
            current: { bsonType: "double" }
          }
        },
        certifications: { bsonType: "array" },
        status: {
          bsonType: "string",
          enum: ["active", "inactive", "maintenance"]
        },
        visionFeedback: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              collectionId: { bsonType: "string" },
              actualType: { bsonType: "string" },
              actualSubType: { bsonType: "string" },
              actualQuality: { bsonType: "string" },
              images: { bsonType: "array" },
              notes: { bsonType: "string" },
              timestamp: { bsonType: "date" }
            }
          }
        },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

// Indexes
db.factories.createIndex({ factoryId: 1 }, { unique: true });
db.factories.createIndex({ "location.coordinates": "2dsphere" });
db.factories.createIndex({ status: 1 });
db.factories.createIndex({ "acceptedMaterials.type": 1 });
```

## 4. MaterialRequests Collection

```javascript
db.createCollection("materialRequests", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["requestId", "factoryId", "materialType", "status"],
      properties: {
        requestId: {
          bsonType: "string",
          description: "Unique identifier for the material request"
        },
        factoryId: { bsonType: "objectId" },
        materialType: { bsonType: "string" },
        subType: { bsonType: "string" },
        quantity: { bsonType: "double" },
        qualityRequirement: { bsonType: "string" },
        pricePerKg: { bsonType: "double" },
        urgency: {
          bsonType: "string",
          enum: ["low", "medium", "high", "critical"]
        },
        deadline: { bsonType: "date" },
        status: {
          bsonType: "string",
          enum: ["open", "in_progress", "fulfilled", "cancelled", "expired"]
        },
        fulfilledBy: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              collectionId: { bsonType: "string" },
              quantity: { bsonType: "double" },
              date: { bsonType: "date" }
            }
          }
        },
        notes: { bsonType: "string" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

// Indexes
db.materialRequests.createIndex({ requestId: 1 }, { unique: true });
db.materialRequests.createIndex({ factoryId: 1 });
db.materialRequests.createIndex({ materialType: 1 });
db.materialRequests.createIndex({ status: 1 });
db.materialRequests.createIndex({ deadline: 1 });
```

## 5. Products Collection

```javascript
db.createCollection("products", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["productId", "factoryId", "name", "price", "status"],
      properties: {
        productId: {
          bsonType: "string",
          description: "Unique identifier for the product"
        },
        factoryId: { bsonType: "objectId" },
        name: { bsonType: "string" },
        description: { bsonType: "string" },
        category: { bsonType: "string" },
        subCategory: { bsonType: "string" },
        images: { bsonType: "array" },
        price: { bsonType: "double" },
        tokenPrice: { bsonType: "double" },
        inventory: {
          bsonType: "object",
          properties: {
            available: { bsonType: "int" },
            reserved: { bsonType: "int" },
            sold: { bsonType: "int" }
          }
        },
        specifications: { bsonType: "object" },
        sustainability: {
          bsonType: "object",
          properties: {
            recycledMaterials: { bsonType: "array" },
            carbonFootprint: { bsonType: "double" },
            waterSaved: { bsonType: "double" },
            energySaved: { bsonType: "double" }
          }
        },
        status: {
          bsonType: "string",
          enum: ["draft", "active", "out_of_stock", "discontinued"]
        },
        ratings: {
          bsonType: "object",
          properties: {
            average: { bsonType: "double" },
            count: { bsonType: "int" }
          }
        },
        tags: { bsonType: "array" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

// Indexes
db.products.createIndex({ productId: 1 }, { unique: true });
db.products.createIndex({ factoryId: 1 });
db.products.createIndex({ category: 1 });
db.products.createIndex({ status: 1 });
db.products.createIndex({ "sustainability.recycledMaterials": 1 });
db.products.createIndex({ price: 1 });
db.products.createIndex({ tokenPrice: 1 });
```

## 6. Orders Collection

```javascript
db.createCollection("orders", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["orderId", "userId", "items", "status", "createdAt"],
      properties: {
        orderId: {
          bsonType: "string",
          description: "Unique identifier for the order"
        },
        userId: { bsonType: "objectId" },
        items: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["productId", "quantity", "price"],
            properties: {
              productId: { bsonType: "string" },
              name: { bsonType: "string" },
              quantity: { bsonType: "int" },
              price: { bsonType: "double" },
              tokenPrice: { bsonType: "double" },
              subtotal: { bsonType: "double" },
              tokenSubtotal: { bsonType: "double" }
            }
          }
        },
        payment: {
          bsonType: "object",
          properties: {
            method: { bsonType: "string" },
            totalAmount: { bsonType: "double" },
            totalTokens: { bsonType: "double" },
            transactionId: { bsonType: "string" },
            status: { bsonType: "string" }
          }
        },
        shipping: {
          bsonType: "object",
          properties: {
            address: { bsonType: "string" },
            city: { bsonType: "string" },
            state: { bsonType: "string" },
            zipCode: { bsonType: "string" },
            coordinates: {
              bsonType: "object",
              properties: {
                type: { bsonType: "string" },
                coordinates: { bsonType: "array" }
              }
            },
            method: { bsonType: "string" },
            trackingNumber: { bsonType: "string" },
            estimatedDelivery: { bsonType: "date" },
            actualDelivery: { bsonType: "date" },
            status: { bsonType: "string" }
          }
        },
        status: {
          bsonType: "string",
          enum: ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]
        },
        notes: { bsonType: "string" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

// Indexes
db.orders.createIndex({ orderId: 1 }, { unique: true });
db.orders.createIndex({ userId: 1 });
db.orders.createIndex({ "items.productId": 1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ createdAt: 1 });
db.orders.createIndex({ "shipping.coordinates": "2dsphere" });
```

## 7. EcoTokenTransactions Collection

```javascript
db.createCollection("ecoTokenTransactions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["transactionId", "userId", "type", "amount", "status", "timestamp"],
      properties: {
        transactionId: {
          bsonType: "string",
          description: "Unique identifier for the transaction"
        },
        userId: { bsonType: "objectId" },
        type: {
          bsonType: "string",
          enum: ["collection_reward", "product_purchase", "referral_bonus", "admin_adjustment", "transfer"]
        },
        amount: { bsonType: "double" },
        relatedId: { bsonType: "string" },
        description: { bsonType: "string" },
        balanceBefore: { bsonType: "double" },
        balanceAfter: { bsonType: "double" },
        status: {
          bsonType: "string",
          enum: ["pending", "completed", "failed", "reversed"]
        },
        metadata: { bsonType: "object" },
        timestamp: { bsonType: "date" }
      }
    }
  }
});

// Indexes
db.ecoTokenTransactions.createIndex({ transactionId: 1 }, { unique: true });
db.ecoTokenTransactions.createIndex({ userId: 1 });
db.ecoTokenTransactions.createIndex({ type: 1 });
db.ecoTokenTransactions.createIndex({ status: 1 });
db.ecoTokenTransactions.createIndex({ timestamp: 1 });
db.ecoTokenTransactions.createIndex({ relatedId: 1 });
```

## 8. ProductReviews Collection

```javascript
db.createCollection("productReviews", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["reviewId", "userId", "productId", "rating", "createdAt"],
      properties: {
        reviewId: {
          bsonType: "string",
          description: "Unique identifier for the review"
        },
        userId: { bsonType: "objectId" },
        productId: { bsonType: "string" },
        orderId: { bsonType: "string" },
        rating: {
          bsonType: "int",
          minimum: 1,
          maximum: 5
        },
        title: { bsonType: "string" },
        content: { bsonType: "string" },
        images: { bsonType: "array" },
        helpfulVotes: { bsonType: "int" },
        verified: { bsonType: "bool" },
        status: {
          bsonType: "string",
          enum: ["pending", "approved", "rejected"]
        },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

// Indexes
db.productReviews.createIndex({ reviewId: 1 }, { unique: true });
db.productReviews.createIndex({ userId: 1 });
db.productReviews.createIndex({ productId: 1 });
db.productReviews.createIndex({ orderId: 1 });
db.productReviews.createIndex({ rating: 1 });
db.productReviews.createIndex({ status: 1 });
```

## 9. SystemConfiguration Collection

```javascript
db.createCollection("systemConfiguration", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["configId", "category", "key", "value"],
      properties: {
        configId: {
          bsonType: "string",
          description: "Unique identifier for the configuration"
        },
        category: { bsonType: "string" },
        key: { bsonType: "string" },
        value: { bsonType: "object" },
        description: { bsonType: "string" },
        lastUpdated: { bsonType: "date" },
        updatedBy: { bsonType: "string" }
      }
    }
  }
});

// Indexes
db.systemConfiguration.createIndex({ configId: 1 }, { unique: true });
db.systemConfiguration.createIndex({ category: 1, key: 1 }, { unique: true });
```

## 10. Analytics Collection

```javascript
db.createCollection("analytics", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["analyticsId", "type", "period", "data", "createdAt"],
      properties: {
        analyticsId: {
          bsonType: "string",
          description: "Unique identifier for the analytics record"
        },
        type: {
          bsonType: "string",
          enum: ["collection", "user", "factory", "product", "order", "sustainability"]
        },
        period: {
          bsonType: "string",
          enum: ["daily", "weekly", "monthly", "quarterly", "yearly"]
        },
        startDate: { bsonType: "date" },
        endDate: { bsonType: "date" },
        data: { bsonType: "object" },
        metadata: { bsonType: "object" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

// Indexes
db.analytics.createIndex({ analyticsId: 1 }, { unique: true });
db.analytics.createIndex({ type: 1 });
db.analytics.createIndex({ period: 1 });
db.analytics.createIndex({ startDate: 1, endDate: 1 });
```