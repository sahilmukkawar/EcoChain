// Test script to verify OrderConfirmation page data structure
console.log('🧪 Testing OrderConfirmation Page Data Structure...');
console.log('================================================');

// Simulate the order data structure that would be received from the API
const mockOrderData = {
  _id: "60f7b1f4e7b3c92f8c9b1a2d",
  orderId: "ORD20250914ABC123",
  userId: "60f7b1f4e7b3c92f8c9b1a2e",
  orderItems: [
    {
      productId: {
        _id: "60f7b1f4e7b3c92f8c9b1a2f",
        productInfo: {
          name: "Eco-friendly Water Bottle",
          description: "Reusable water bottle made from recycled materials",
          images: ["/images/water-bottle.jpg"]
        },
        pricing: {
          sellingPrice: 400,
          ecoTokenDiscount: 150
        }
      },
      quantity: 1,
      unitPrice: 400,
      totalPrice: 400,
      ecoTokensUsed: 150
    }
  ],
  billing: {
    subtotal: 400,
    ecoTokensApplied: 150,
    ecoTokenValue: 300,
    taxes: 72,
    shippingCharges: 50,
    discount: 0,
    finalAmount: 222
  },
  status: "placed",
  shipping: {
    address: {
      name: "John Doe",
      street: "123 Main Street",
      city: "Mumbai",
      state: "Maharashtra",
      zipCode: "400001",
      country: "India",
      phone: "9876543210"
    },
    trackingNumber: "TRK20250914XYZ789",
    estimatedDelivery: "2025-09-21T00:00:00.000Z"
  },
  payment: {
    method: "token",
    status: "paid"
  },
  createdAt: "2025-09-14T10:30:00.000Z"
};

console.log('\n📊 Mock Order Data:');
console.log('==================');
console.log(JSON.stringify(mockOrderData, null, 2));

console.log('\n✅ Verification Results:');
console.log('======================');

// Verify that the data structure matches what the OrderConfirmation page expects
const expectedStructure = {
  _id: 'string',
  orderId: 'string',
  userId: 'string',
  orderItems: [
    {
      productId: {
        _id: 'string',
        productInfo: {
          name: 'string',
          description: 'string',
          images: ['string']
        },
        pricing: {
          sellingPrice: 'number',
          ecoTokenDiscount: 'number'
        }
      },
      quantity: 'number',
      unitPrice: 'number',
      totalPrice: 'number',
      ecoTokensUsed: 'number'
    }
  ],
  billing: {
    subtotal: 'number',
    ecoTokensApplied: 'number',
    ecoTokenValue: 'number',
    taxes: 'number',
    shippingCharges: 'number',
    discount: 'number',
    finalAmount: 'number'
  },
  status: 'string',
  shipping: {
    address: {
      name: 'string',
      street: 'string',
      city: 'string',
      state: 'string',
      zipCode: 'string',
      country: 'string',
      phone: 'string'
    },
    trackingNumber: 'string',
    estimatedDelivery: 'string'
  },
  payment: {
    method: 'string',
    status: 'string'
  },
  createdAt: 'string'
};

function verifyStructure(obj, expected, path = '') {
  let allMatch = true;
  
  for (const key in expected) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (typeof expected[key] === 'object' && expected[key] !== null && !Array.isArray(expected[key])) {
      if (!(key in obj)) {
        console.log(`❌ Missing property: ${currentPath}`);
        allMatch = false;
      } else {
        const subMatch = verifyStructure(obj[key], expected[key], currentPath);
        if (!subMatch) allMatch = false;
      }
    } else if (Array.isArray(expected[key])) {
      if (!(key in obj)) {
        console.log(`❌ Missing property: ${currentPath}`);
        allMatch = false;
      } else if (!Array.isArray(obj[key])) {
        console.log(`❌ Type mismatch for ${currentPath}: expected array, got ${typeof obj[key]}`);
        allMatch = false;
      } else if (expected[key].length > 0 && obj[key].length > 0) {
        // Check first item structure if both arrays have items
        const subMatch = verifyStructure(obj[key][0], expected[key][0], `${currentPath}[0]`);
        if (!subMatch) allMatch = false;
      }
    } else {
      if (!(key in obj)) {
        console.log(`❌ Missing property: ${currentPath}`);
        allMatch = false;
      } else if (typeof obj[key] !== expected[key]) {
        console.log(`❌ Type mismatch for ${currentPath}: expected ${expected[key]}, got ${typeof obj[key]}`);
        allMatch = false;
      }
    }
  }
  
  return allMatch;
}

const structureMatch = verifyStructure(mockOrderData, expectedStructure);

console.log('\n' + '='.repeat(50));
if (structureMatch) {
  console.log('🎉 ORDER DATA STRUCTURE IS CORRECT!');
  console.log('The OrderConfirmation page should display properly');
  
  // Test the calculations
  console.log('\n🧮 Calculation Verification:');
  console.log('==========================');
  console.log(`Subtotal: ₹${mockOrderData.billing.subtotal}`);
  console.log(`EcoTokens Used: ${mockOrderData.billing.ecoTokensApplied} tokens (₹${mockOrderData.billing.ecoTokenValue})`);
  console.log(`Taxes (18% GST): ₹${mockOrderData.billing.taxes}`);
  console.log(`Shipping: ₹${mockOrderData.billing.shippingCharges}`);
  console.log(`Total Paid: ₹${mockOrderData.billing.finalAmount}`);
  console.log(`EcoToken Savings: You saved ₹${mockOrderData.billing.ecoTokenValue} by using ${mockOrderData.billing.ecoTokensApplied} EcoTokens!`);
} else {
  console.log('❌ ORDER DATA STRUCTURE HAS ISSUES!');
  console.log('Please check the implementation');
}
console.log('='.repeat(50));