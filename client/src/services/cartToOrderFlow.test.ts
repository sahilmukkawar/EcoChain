import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { marketplaceAPI } from './api';
import orderService from './orderService';

// Create a mock for the axios instance
const mock = new MockAdapter(axios);

describe('Complete Cart to Order Flow', () => {
  beforeEach(() => {
    // Reset the mock before each test
    mock.reset();
  });

  it('should complete the full flow from adding products to cart to order confirmation', async () => {
    // Mock data
    const mockProduct = {
      _id: 'product123',
      productInfo: {
        name: 'Recycled Notebook',
        description: 'Eco-friendly notebook made from recycled paper',
        category: 'stationery'
      },
      pricing: {
        costPrice: 50,
        sellingPrice: 40
      },
      inventory: {
        currentStock: 10
      },
      sustainability: {
        recycledMaterialPercentage: 90
      },
      availability: {
        isActive: true
      }
    };

    const mockOrder = {
      _id: 'order123',
      orderId: 'ORD123456',
      userId: 'user123',
      orderItems: [
        {
          productId: 'product123',
          quantity: 2,
          price: 50,
          tokenPrice: 40,
          product: {
            name: 'Recycled Notebook',
            description: 'Eco-friendly notebook made from recycled paper',
            images: ['/uploads/product-images/notebook.jpg']
          }
        }
      ],
      totalAmount: 100,
      totalTokens: 80,
      status: 'placed',
      shippingAddress: {
        fullName: 'John Doe',
        address: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India',
        phone: '9876543210'
      },
      paymentMethod: 'token',
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    // Step 1: Fetch products (Marketplace)
    mock.onGet('/marketplace').reply(200, {
      success: true,
      data: [mockProduct]
    });

    // Step 2: Create order (Checkout)
    mock.onPost('/orders').reply(201, {
      success: true,
      message: 'Order created successfully',
      data: mockOrder
    });

    // Step 3: Get order details (Order Confirmation)
    mock.onGet('/orders/order123').reply(200, {
      success: true,
      data: mockOrder
    });

    // Execute the flow
    // 1. Fetch products (simulating marketplace page)
    const productsResponse = await marketplaceAPI.getProducts();
    expect(productsResponse.status).toBe(200);
    expect(productsResponse.data.data).toHaveLength(1);
    expect(productsResponse.data.data[0].productInfo.name).toBe('Recycled Notebook');

    // 2. Create order (simulating checkout process)
    const orderData = {
      items: [{ productId: 'product123', quantity: 2 }],
      payment: { method: 'token' as const },
      shipping: {
        fullName: 'John Doe',
        address: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India',
        phone: '9876543210'
      }
    };

    const orderResponse = await marketplaceAPI.createOrder(orderData);
    expect(orderResponse.status).toBe(201);
    expect(orderResponse.data.success).toBe(true);
    expect(orderResponse.data.data.orderId).toBeDefined();
    expect(orderResponse.data.data.orderItems).toHaveLength(1);
    expect(orderResponse.data.data.orderItems[0].quantity).toBe(2);

    // 3. Fetch order details (simulating order confirmation page)
    const orderDetailsResponse = await marketplaceAPI.getOrderById('order123');
    expect(orderDetailsResponse.status).toBe(200);
    expect(orderDetailsResponse.data.success).toBe(true);
    expect(orderDetailsResponse.data.data.orderId).toBe('ORD123456');
    expect(orderDetailsResponse.data.data.status).toBe('placed');
    expect(orderDetailsResponse.data.data.totalAmount).toBe(100);
    expect(orderDetailsResponse.data.data.totalTokens).toBe(80);
  });

  it('should handle order creation with insufficient stock', async () => {
    // Mock data for product with insufficient stock
    const orderData = {
      items: [{ productId: 'product123', quantity: 15 }], // Requesting 15, but only 10 available
      payment: { method: 'token' as const },
      shipping: {
        fullName: 'John Doe',
        address: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India',
        phone: '9876543210'
      }
    };

    // Mock API response for insufficient stock
    mock.onPost('/orders').reply(400, {
      success: false,
      message: 'Insufficient stock for Recycled Notebook. Only 10 available.'
    });

    // Try to create order
    try {
      await marketplaceAPI.createOrder(orderData);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.success).toBe(false);
      expect(error.response.data.message).toContain('Insufficient stock');
    }
  });

  it('should handle order creation with invalid product', async () => {
    // Mock data for non-existent product
    const orderData = {
      items: [{ productId: 'invalid123', quantity: 1 }],
      payment: { method: 'token' as const },
      shipping: {
        fullName: 'John Doe',
        address: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India',
        phone: '9876543210'
      }
    };

    // Mock API response for invalid product
    mock.onPost('/orders').reply(400, {
      success: false,
      message: 'Product unknown is not available'
    });

    // Try to create order
    try {
      await marketplaceAPI.createOrder(orderData);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.success).toBe(false);
      expect(error.response.data.message).toContain('not available');
    }
  });
});