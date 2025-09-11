import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService, Order } from '../services/orderService.ts';
import '../OrderConfirmation.css';

const OrderConfirmation: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!orderId) {
          throw new Error('Order ID is missing');
        }
        
        setLoading(true);
        const orderData = await orderService.getOrderById(orderId);
        setOrder(orderData);
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError(err.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return <div className="loading">Loading order details...</div>;
  }

  if (error) {
    return (
      <div className="order-confirmation-container">
        <div className="error-message">{error}</div>
        <Link to="/marketplace" className="back-button">Back to Marketplace</Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-confirmation-container">
        <div className="error-message">Order not found</div>
        <Link to="/marketplace" className="back-button">Back to Marketplace</Link>
      </div>
    );
  }

  // Calculate totals
  const itemsTotal = order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const tokensUsed = order.items.reduce((total, item) => total + (item.tokenPrice * item.quantity), 0);

  return (
    <div className="order-confirmation-container">
      <div className="order-confirmation-card">
        <div className="order-success-header">
          <div className="success-icon">✓</div>
          <h1>Order Placed Successfully!</h1>
          <p>Thank you for your order. We've received your request and will process it shortly.</p>
        </div>
        
        <div className="order-details">
          <div className="order-info">
            <h2>Order Information</h2>
            <div className="info-row">
              <span>Order ID:</span>
              <span>{order._id}</span>
            </div>
            <div className="info-row">
              <span>Order Date:</span>
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="info-row">
              <span>Order Status:</span>
              <span className={`status-badge ${order.status}`}>{order.status}</span>
            </div>
            <div className="info-row">
              <span>Payment Method:</span>
              <span>{order.paymentMethod.replace('_', ' ').toUpperCase()}</span>
            </div>
            <div className="info-row">
              <span>Payment Status:</span>
              <span className={`status-badge ${order.paymentStatus}`}>{order.paymentStatus}</span>
            </div>
          </div>
          
          <div className="shipping-info">
            <h2>Shipping Information</h2>
            <p>
              {order.shippingAddress.street}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
              {order.shippingAddress.country}
            </p>
            
            {order.trackingNumber && (
              <div className="tracking-info">
                <h3>Tracking Number</h3>
                <p>{order.trackingNumber}</p>
                <Link to={`/order-tracking/${order.trackingNumber}`} className="track-button">
                  Track Order
                </Link>
              </div>
            )}
          </div>
        </div>
        
        <div className="order-items">
          <h2>Order Items</h2>
          <div className="items-table">
            <div className="table-header">
              <div className="item-col">Item</div>
              <div className="quantity-col">Quantity</div>
              <div className="price-col">Price</div>
              <div className="tokens-col">Tokens</div>
              <div className="total-col">Total</div>
            </div>
            
            {order.items.map((item, index) => (
              <div className="table-row" key={index}>
                <div className="item-col">Product #{item.productId.substring(0, 8)}</div>
                <div className="quantity-col">{item.quantity}</div>
                <div className="price-col">₹{item.price}</div>
                <div className="tokens-col">{item.tokenPrice}</div>
                <div className="total-col">₹{item.price * item.quantity}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="order-summary">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Items Total:</span>
            <span>₹{itemsTotal}</span>
          </div>
          
          {tokensUsed > 0 && (
            <div className="summary-row tokens">
              <span>EcoTokens Used:</span>
              <span>{tokensUsed} tokens</span>
            </div>
          )}
          
          <div className="summary-row">
            <span>Shipping:</span>
            <span>₹{order.totalPrice - itemsTotal}</span>
          </div>
          
          <div className="summary-row total">
            <span>Total Paid:</span>
            <span>₹{order.totalPrice}</span>
          </div>
        </div>
        
        <div className="action-buttons">
          <Link to="/marketplace" className="continue-shopping">
            Continue Shopping
          </Link>
          <Link to="/dashboard" className="view-orders">
            View All Orders
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;