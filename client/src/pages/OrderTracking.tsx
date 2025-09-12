import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketplaceAPI } from '../services/api.ts';

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  tokenPrice: number;
  product: {
    name: string;
    description: string;
    images: string[];
  };
}

interface Order {
  _id: string;
  orderId: string;
  userId: string;
  orderItems: OrderItem[];
  totalAmount: number;
  totalTokens: number;
  status: string;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  paymentMethod: string;
  createdAt: string;
  estimatedDelivery: string;
  shipping: {
    trackingNumber?: string;
  };
}

const OrderTracking: React.FC = () => {
  const { trackingNumber } = useParams<{ trackingNumber: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        // In a real app, you would have a specific endpoint for tracking by tracking number
        // For now, we'll get all user orders and find the one with matching tracking number
        const response = await marketplaceAPI.getUserOrders();
        
        if (response.data.success) {
          // Find order by tracking number
          const foundOrder = response.data.data.find((order: Order) => 
            order.shipping?.trackingNumber === trackingNumber
          );
          
          if (foundOrder) {
            setOrder(foundOrder);
          } else {
            // Try to get order by ID if tracking number is actually an order ID
            try {
              const orderResponse = await marketplaceAPI.getOrderById(trackingNumber || '');
              if (orderResponse.data.success) {
                setOrder(orderResponse.data.data);
              } else {
                throw new Error('Order not found');
              }
            } catch {
              throw new Error('Order not found');
            }
          }
        } else {
          throw new Error(response.data.message || 'Failed to fetch order');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (trackingNumber) {
      fetchOrder();
    }
  }, [trackingNumber]);

  // Get status steps based on order status
  const getStatusSteps = () => {
    const steps = [
      { id: 'placed', label: 'Order Placed', completed: false },
      { id: 'confirmed', label: 'Confirmed', completed: false },
      { id: 'processing', label: 'Processing', completed: false },
      { id: 'shipped', label: 'Shipped', completed: false },
      { id: 'delivered', label: 'Delivered', completed: false }
    ];

    const currentStatus = order?.status.toLowerCase() || '';
    const statusIndex = steps.findIndex(step => step.id === currentStatus);

    if (statusIndex >= 0) {
      for (let i = 0; i <= statusIndex; i++) {
        steps[i].completed = true;
      }
    }

    return steps;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-5 py-5">
        <div className="text-center py-5 text-lg">Loading order tracking information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-5 py-5">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-5 py-5">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Order not found.
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <div className="max-w-4xl mx-auto px-5 py-5">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Order Tracking</h1>
        <p className="text-gray-600 text-lg">Tracking Number: {order.shipping?.trackingNumber || 'N/A'}</p>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md mb-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Order Status</h2>
        <div className="flex flex-col md:flex-row justify-between relative mb-6 md:mb-0">
          {statusSteps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center md:items-start relative flex-1 mb-8 md:mb-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 z-10 ${
                step.completed 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-300 text-gray-500'
              }`}>
                {step.completed ? '✓' : index + 1}
              </div>
              <div className={`text-center md:text-left ${
                step.completed 
                  ? 'text-green-500 font-bold' 
                  : 'text-gray-500'
              }`}>
                {step.label}
              </div>
              {index < statusSteps.length - 1 && (
                <div className={`absolute top-5 left-full w-full h-1 -translate-y-1/2 hidden md:block ${
                  step.completed ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-white p-5 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">Order Information</h2>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Order Number:</span>
            <span>{order.orderId}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Order Date:</span>
            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Status:</span>
            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              {order.status}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Payment Method:</span>
            <span>{order.paymentMethod === 'token' ? 'EcoTokens' : 'Cash on Delivery'}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">Shipping Information</h2>
          <div className="mb-4">
            <p className="font-bold">{order.shippingAddress?.fullName || 'N/A'}</p>
            <p>{order.shippingAddress?.address || 'N/A'}</p>
            <p>{order.shippingAddress?.city || 'N/A'}, {order.shippingAddress?.state || 'N/A'} {order.shippingAddress?.zipCode || 'N/A'}</p>
            <p>{order.shippingAddress?.country || 'N/A'}</p>
            <p>Phone: {order.shippingAddress?.phone || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-lg shadow-md mb-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">Items in Your Order</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {order.orderItems.map((item, index) => (
            <div key={index} className="bg-gray-100 p-4 rounded-lg flex items-center">
              <div className="w-24 h-24 flex-shrink-0">
                <img src={item.product.images?.[0] || '/logo192.png'} alt={item.product.name} className="w-full h-full object-cover" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-800">{item.product.name}</h3>
                <p className="text-gray-600">{item.product.description}</p>
                <div className="mt-2">
                  <span className="text-gray-500">Quantity: {item.quantity}</span>
                </div>
                <div className="mt-2">
                  <span className="text-gray-800">₹{item.price * item.quantity} + {item.tokenPrice * item.quantity} Tokens</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </button>
        <button 
          className="btn btn-primary" 
          onClick={() => window.print()}
        >
          Print Tracking Information
        </button>
      </div>
    </div>
  );
};

export default OrderTracking;