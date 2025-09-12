import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { marketplaceAPI } from '../services/api.ts';
import './Checkout.css';

interface ShippingInfo {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cart, cartTotal, tokenTotal, clearCart } = useCart();
  const { user } = useAuth();
  
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: user?.name || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    phone: user?.phone || ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState<'token' | 'cash' | 'card'>('token');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<number>(1); // 1: Shipping, 2: Review, 3: Confirmation

  // Calculate totals
  const totalEcoTokens = user?.ecoWallet?.currentBalance || 0;
  const maxTokensUsable = Math.min(tokenTotal, totalEcoTokens);
  const finalTotal = cartTotal - (maxTokensUsable * 5); // Assuming 1 token = ₹5 value

  // Handle shipping info changes
  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingInfo({
      ...shippingInfo,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      // Validate shipping info
      if (!shippingInfo.fullName || !shippingInfo.address || !shippingInfo.city || 
          !shippingInfo.state || !shippingInfo.zipCode || !shippingInfo.phone) {
        setError('Please fill in all required shipping information.');
        return;
      }
      setStep(2);
      return;
    }
    
    if (step === 2) {
      // Proceed to checkout
      try {
        setIsLoading(true);
        setError(null);
        
        // Prepare order data
        const orderData = {
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity
          })),
          payment: {
            method: paymentMethod
          },
          shipping: shippingInfo,
          notes: orderNotes
        };
        
        // Create order
        const response = await marketplaceAPI.createOrder(orderData);
        
        if (response.data.success) {
          // Clear cart
          clearCart();
          // Navigate to confirmation page
          navigate(`/order-confirmation/${response.data.data._id}`);
        } else {
          throw new Error(response.data.message || 'Failed to create order');
        }
      } catch (err) {
        console.error('Error creating order:', err);
        setError('Failed to process your order. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Go back to previous step
  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="checkout-container">
        <div className="empty-cart-message">
          <h2>Your cart is empty</h2>
          <p>Add some products to your cart before checking out.</p>
          <button className="btn btn-primary" onClick={() => navigate('/marketplace')}>
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <div className="checkout-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Shipping</span>
          </div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Review</span>
          </div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Confirmation</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="checkout-content">
        <div className="checkout-form">
          {step === 1 && (
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h2>Shipping Information</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name *</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={shippingInfo.fullName}
                      onChange={handleShippingChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="address">Address *</label>
                  <textarea
                    id="address"
                    name="address"
                    value={shippingInfo.address}
                    onChange={handleShippingChange}
                    required
                    rows={3}
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={shippingInfo.city}
                      onChange={handleShippingChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="state">State *</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={shippingInfo.state}
                      onChange={handleShippingChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="zipCode">ZIP Code *</label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={shippingInfo.zipCode}
                      onChange={handleShippingChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="country">Country *</label>
                    <select
                      id="country"
                      name="country"
                      value={shippingInfo.country}
                      onChange={handleShippingChange}
                      required
                    >
                      <option value="India">India</option>
                      <option value="USA">USA</option>
                      <option value="UK">UK</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={shippingInfo.phone}
                    onChange={handleShippingChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => navigate('/marketplace')}>
                  Continue Shopping
                </button>
                <button type="submit" className="btn btn-primary">
                  Continue to Review
                </button>
              </div>
            </form>
          )}
          
          {step === 2 && (
            <div className="review-step">
              <h2>Order Review</h2>
              
              <div className="order-summary">
                <h3>Items in Your Order</h3>
                <div className="order-items">
                  {cart.map(item => (
                    <div key={item.product.id} className="order-item">
                      <div className="item-image">
                        <img src={item.product.imageUrl || '/logo192.png'} alt={item.product.name} />
                      </div>
                      <div className="item-details">
                        <h4>{item.product.name}</h4>
                        <p>{item.product.description}</p>
                        <div className="item-price">
                          <span>₹{item.product.price} + {item.product.tokenPrice} Tokens</span>
                          <span>Qty: {item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="shipping-summary">
                <h3>Shipping Information</h3>
                <div className="shipping-details">
                  <p><strong>{shippingInfo.fullName}</strong></p>
                  <p>{shippingInfo.address}</p>
                  <p>{shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}</p>
                  <p>{shippingInfo.country}</p>
                  <p>Phone: {shippingInfo.phone}</p>
                </div>
              </div>
              
              <div className="payment-section">
                <h3>Payment Method</h3>
                <div className="payment-options">
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="token"
                      checked={paymentMethod === 'token'}
                      onChange={() => setPaymentMethod('token')}
                    />
                    EcoTokens ({totalEcoTokens} available)
                  </label>
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                    />
                    Cash on Delivery
                  </label>
                </div>
              </div>
              
              <div className="order-notes">
                <label htmlFor="orderNotes">Order Notes (Optional)</label>
                <textarea
                  id="orderNotes"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={3}
                  placeholder="Any special instructions for your order?"
                />
              </div>
              
              <div className="order-totals">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>₹{cartTotal}</span>
                </div>
                <div className="total-row">
                  <span>EcoTokens Applied:</span>
                  <span>{maxTokensUsable} tokens</span>
                </div>
                <div className="total-row final-total">
                  <span>Total:</span>
                  <span>₹{finalTotal}</span>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={goBack}>
                  Back to Shipping
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="order-summary-sidebar">
          <h3>Order Summary</h3>
          <div className="summary-items">
            {cart.map(item => (
              <div key={item.product.id} className="summary-item">
                <span>{item.product.name} x {item.quantity}</span>
                <span>₹{item.product.price * item.quantity} + {item.product.tokenPrice * item.quantity} Tokens</span>
              </div>
            ))}
          </div>
          
          <div className="summary-totals">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>₹{cartTotal}</span>
            </div>
            <div className="total-row">
              <span>EcoTokens:</span>
              <span>-{maxTokensUsable} tokens</span>
            </div>
            <div className="total-row final-total">
              <span>Total:</span>
              <span>₹{finalTotal}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;