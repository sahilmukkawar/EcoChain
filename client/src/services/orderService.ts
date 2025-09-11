import api from './api';
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
    const response = await api.post<Order>('/orders', orderData);
    return response.data;
  },

  // Get all orders for the current user
  getUserOrders: async (): Promise<Order[]> => {
    const response = await api.get<Order[]>('/orders/user');
    return response.data;
  },

  // Get order by ID
  getOrderById: async (id: string): Promise<Order> => {
    const response = await api.get<Order>(`/orders/${id}`);
    return response.data;
  },

  // Cancel an order
  cancelOrder: async (id: string): Promise<Order> => {
    const response = await api.put<Order>(`/orders/${id}/cancel`);
    return response.data;
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
    return response.data;
  },

  // Track order status
  trackOrder: async (trackingNumber: string): Promise<{
    status: string;
    location: string;
    estimatedDelivery: string;
    updates: { status: string; timestamp: string; location: string }[];
  }> => {
    const response = await api.get(`/orders/track/${trackingNumber}`);
    return response.data;
  },
};

export default orderService;