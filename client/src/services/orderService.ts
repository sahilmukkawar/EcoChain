import api from './api.ts';
import { CartItem } from '../contexts/CartContext';

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  tokenPrice: number;
}

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  totalPrice: number;
  totalTokenPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: Address;
  paymentMethod: 'cash_on_delivery' | 'online_payment' | 'token_payment' | 'mixed_payment';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CreateOrderData {
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: 'cash_on_delivery' | 'online_payment' | 'token_payment' | 'mixed_payment';
  tokenAmount?: number; // Amount of tokens to use for payment
}

const orderService = {
  // Create a new order
  createOrder: async (orderData: CreateOrderData): Promise<Order> => {
    const response = await api.post('/orders', orderData);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create order');
  },

  // Get all orders for the current user
  getUserOrders: async (): Promise<Order[]> => {
    const response = await api.get('/orders/user');
    if (response.data.success) {
      return response.data.data || [];
    }
    throw new Error(response.data.message || 'Failed to fetch orders');
  },

  // Get order by ID
  getOrderById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch order');
  },

  // Cancel an order
  cancelOrder: async (id: string): Promise<Order> => {
    const response = await api.put(`/orders/${id}/cancel`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to cancel order');
  },

  // Calculate order summary (preview before placing order)
  calculateOrderSummary: async (items: CartItem[], tokenAmount: number): Promise<{
    subtotal: number;
    tokenDiscount: number;
    shippingCost: number;
    tax: number;
    total: number;
    tokensUsed: number;
  }> => {
    const response = await api.post('/orders/calculate', { items, tokenAmount });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to calculate order');
  },

  // Track order status
  trackOrder: async (trackingNumber: string): Promise<{
    status: string;
    location: string;
    estimatedDelivery: string;
    updates: { status: string; timestamp: string; location: string }[];
  }> => {
    const response = await api.get(`/orders/track/${trackingNumber}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to track order');
  },
};

export default orderService;
export { orderService };
export type { OrderItem, Order, Address, CreateOrderData };