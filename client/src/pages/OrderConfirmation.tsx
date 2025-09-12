import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketplaceAPI } from '../services/api.ts';
import './OrderConfirmation.css';

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

const OrderConfirmation: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await marketplaceAPI.getOrderById(orderId || '');
        
        if (response.data.success) {
          setOrder(response.data.data);
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

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="order-confirmation-container">
        <div className="loading">Loading order details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-confirmation-container">
        <div className="error-message">
          {error}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-confirmation-container">
        <div className="error-message">
          Order not found.
        </div>
      </div>
    );
  }

  return (
    <div className="order-confirmation-container">
      <div className="confirmation-header">
        <div className="success-icon">✓</div>
        <h1>Order Confirmed!</h1>
        <p>Thank you for your purchase. Your order has been received.</p>
      </div>

      <div className="order-details">
        <div className="order-info">
          <h2>Order Details</h2>
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

      <div className="order-totals">
        <div className="total-row">
          <span>Subtotal:</span>
          <span>₹{order.totalAmount}</span>
        </div>
        <div className="total-row">
          <span>EcoTokens Used:</span>
          <span>{order.totalTokens} tokens</span>
        </div>
        <div className="total-row final-total">
          <span>Total Paid:</span>
          <span>₹{order.totalAmount - (order.totalTokens * 5)}</span>
        </div>
      </div>

      <div className="actions">
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/marketplace')}
        >
          Continue Shopping
        </button>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/dashboard')}
        >
          View Order History
        </button>
      </div>
    </div>
  );
};

export default OrderConfirmation;