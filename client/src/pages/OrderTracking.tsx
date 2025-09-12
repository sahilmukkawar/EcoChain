import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketplaceAPI } from '../services/api.ts';
import './OrderTracking.css';

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
      <div className="order-tracking-container">
        <div className="loading">Loading order tracking information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-tracking-container">
        <div className="error-message">
          {error}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-tracking-container">
        <div className="error-message">
          Order not found.
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <div className="order-tracking-container">
      <div className="tracking-header">
        <h1>Order Tracking</h1>
        <p>Tracking Number: {order.shipping?.trackingNumber || 'N/A'}</p>
      </div>

      <div className="tracking-status">
        <h2>Order Status</h2>
        <div className="status-steps">
          {statusSteps.map((step, index) => (
            <div key={step.id} className={`step ${step.completed ? 'completed' : ''}`}>
              <div className="step-icon">
                {step.completed ? '✓' : index + 1}
              </div>
              <div className="step-label">{step.label}</div>
              {index < statusSteps.length - 1 && (
                <div className={`step-line ${step.completed ? 'completed' : ''}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="order-details">
        <div className="order-info">
          <h2>Order Information</h2>
          <div className="info-row">
            <span>Order Number:</span>
            <span>{order.orderId}</span>
          </div>
          <div className="info-row">
            <span>Order Date:</span>
            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="info-row">
            <span>Status:</span>
            <span className="status-badge">{order.status}</span>
          </div>
          <div className="info-row">
            <span>Payment Method:</span>
            <span>{order.paymentMethod === 'token' ? 'EcoTokens' : 'Cash on Delivery'}</span>
          </div>
        </div>

        <div className="shipping-info">
          <h2>Shipping Information</h2>
          <div className="shipping-address">
            <p><strong>{order.shippingAddress?.fullName || 'N/A'}</strong></p>
            <p>{order.shippingAddress?.address || 'N/A'}</p>
            <p>{order.shippingAddress?.city || 'N/A'}, {order.shippingAddress?.state || 'N/A'} {order.shippingAddress?.zipCode || 'N/A'}</p>
            <p>{order.shippingAddress?.country || 'N/A'}</p>
            <p>Phone: {order.shippingAddress?.phone || 'N/A'}</p>
          </div>
          <div className="delivery-estimate">
            <p>Estimated Delivery: {order.estimatedDelivery || '3-5 business days'}</p>
          </div>
        </div>
      </div>

      <div className="order-items">
        <h2>Items in Your Order</h2>
        <div className="items-list">
          {order.orderItems.map((item, index) => (
            <div key={index} className="order-item">
              <div className="item-image">
                <img src={item.product.images?.[0] || '/logo192.png'} alt={item.product.name} />
              </div>
              <div className="item-details">
                <h3>{item.product.name}</h3>
                <p>{item.product.description}</p>
                <div className="item-quantity">
                  Quantity: {item.quantity}
                </div>
                <div className="item-price">
                  ₹{item.price * item.quantity} + {item.tokenPrice * item.quantity} Tokens
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="actions">
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