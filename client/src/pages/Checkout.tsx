import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { orderService, OrderItem, CreateOrderData, Address } from '../services/orderService.ts';
import '../Checkout.css';

const Checkout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Mock cart data - will be replaced with real cart implementation
  const cart = useMemo(() => [], []);
  const cartTotal = 0;
  const tokenTotal = 0;
  const clearCart = () => {};
  
  const [address, setAddress] = useState<Address>({
    street: user?.address || '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });
  
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'online_payment' | 'token_payment' | 'mixed_payment'>('mixed_payment');
  const [tokenAmount, setTokenAmount] = useState<number>(0);
  const [maxTokens, setMaxTokens] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSummary, setOrderSummary] = useState<{
    subtotal: number;
    tokenDiscount: number;
    shippingCost: number;
    tax: number;
    total: number;
    tokensUsed: number;
  } | null>(null);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0) {
      navigate('/marketplace');
    }
  }, [cart, navigate]);

  // Set max tokens based on user's available tokens and cart token total
  useEffect(() => {
    if (user && user.ecoTokens) {
      setMaxTokens(Math.min(user.ecoTokens, tokenTotal));
    }
  }, [user, tokenTotal]);

  // Calculate order summary when token amount changes
  useEffect(() => {
    const calculateSummary = async () => {
      try {
        if (cart.length > 0) {
          const summary = await orderService.calculateOrderSummary(cart, tokenAmount);
          setOrderSummary(summary);
        }
      } catch (err) {
        console.error('Error calculating order summary:', err);
        setError('Failed to calculate order summary');
      }
    };

    calculateSummary();
  }, [cart, tokenAmount]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTokenAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setTokenAmount(Math.min(value, maxTokens));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (!address.street || !address.city || !address.state || !address.postalCode) {
        throw new Error('Please fill in all address fields');
      }

      // Create order items from cart
      const items: OrderItem[] = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        tokenPrice: item.product.tokenPrice
      }));

      // Create order data
      const orderData: CreateOrderData = {
        items,
        shippingAddress: address,
        paymentMethod,
        tokenAmount
      };

      // Submit order
      const order = await orderService.createOrder(orderData);
      
      // Clear cart and redirect to order confirmation
      clearCart();
      navigate(`/order-confirmation/${order._id}`);
    } catch (err: any) {
      console.error('Error placing order:', err);
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Processing your order...</div>;
  }

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="checkout-grid">
        <div className="checkout-form-container">
          <form onSubmit={handleSubmit} className="checkout-form">
            <h2>Shipping Address</h2>
            <div className="form-group">
              <label htmlFor="street">Street Address</label>
              <input
                type="text"
                id="street"
                name="street"
                value={address.street}
                onChange={handleAddressChange}
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={address.city}
                  onChange={handleAddressChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="state">State</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={address.state}
                  onChange={handleAddressChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="postalCode">Postal Code</label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={address.postalCode}
                  onChange={handleAddressChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={address.country}
                  onChange={handleAddressChange}
                  required
                />
              </div>
            </div>
            
            <h2>Payment Method</h2>
            <div className="payment-methods">
              <div className="payment-method">
                <input
                  type="radio"
                  id="mixed_payment"
                  name="paymentMethod"
                  value="mixed_payment"
                  checked={paymentMethod === 'mixed_payment'}
                  onChange={() => setPaymentMethod('mixed_payment')}
                />
                <label htmlFor="mixed_payment">Cash + EcoTokens</label>
              </div>
              
              <div className="payment-method">
                <input
                  type="radio"
                  id="cash_on_delivery"
                  name="paymentMethod"
                  value="cash_on_delivery"
                  checked={paymentMethod === 'cash_on_delivery'}
                  onChange={() => setPaymentMethod('cash_on_delivery')}
                />
                <label htmlFor="cash_on_delivery">Cash on Delivery</label>
              </div>
              
              <div className="payment-method">
                <input
                  type="radio"
                  id="online_payment"
                  name="paymentMethod"
                  value="online_payment"
                  checked={paymentMethod === 'online_payment'}
                  onChange={() => setPaymentMethod('online_payment')}
                />
                <label htmlFor="online_payment">Online Payment</label>
              </div>
              
              {maxTokens >= tokenTotal && (
                <div className="payment-method">
                  <input
                    type="radio"
                    id="token_payment"
                    name="paymentMethod"
                    value="token_payment"
                    checked={paymentMethod === 'token_payment'}
                    onChange={() => setPaymentMethod('token_payment')}
                  />
                  <label htmlFor="token_payment">EcoTokens Only</label>
                </div>
              )}
            </div>
            
            {(paymentMethod === 'mixed_payment' || paymentMethod === 'token_payment') && (
              <div className="token-payment-section">
                <h3>Use EcoTokens</h3>
                <div className="token-slider-container">
                  <input
                    type="range"
                    min="0"
                    max={maxTokens}
                    value={tokenAmount}
                    onChange={handleTokenAmountChange}
                    className="token-slider"
                  />
                  <div className="token-amount-display">
                    <span>{tokenAmount}</span> / {maxTokens} available tokens
                  </div>
                </div>
              </div>
            )}
            
            <button 
              type="submit" 
              className="place-order-button"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </form>
        </div>
        
        <div className="order-summary">
          <h2>Order Summary</h2>
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.product.id} className="cart-item">
                <div className="item-image">
                  <img src={item.product.imageUrl || '/logo192.png'} alt={item.product.name} />
                </div>
                <div className="item-details">
                  <h3>{item.product.name}</h3>
                  <p className="item-quantity">Qty: {item.quantity}</p>
                  <p className="item-price">
                    ₹{item.product.price} + {item.product.tokenPrice} tokens
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="summary-details">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{orderSummary?.subtotal || cartTotal}</span>
            </div>
            
            {orderSummary && orderSummary.tokenDiscount > 0 && (
              <div className="summary-row discount">
                <span>Token Discount</span>
                <span>-₹{orderSummary.tokenDiscount}</span>
              </div>
            )}
            
            <div className="summary-row">
              <span>Shipping</span>
              <span>₹{orderSummary?.shippingCost || 0}</span>
            </div>
            
            <div className="summary-row">
              <span>Tax</span>
              <span>₹{orderSummary?.tax || 0}</span>
            </div>
            
            <div className="summary-row total">
              <span>Total</span>
              <span>₹{orderSummary?.total || cartTotal}</span>
            </div>
            
            {orderSummary && orderSummary.tokensUsed > 0 && (
              <div className="tokens-used">
                <span>EcoTokens Used</span>
                <span>{orderSummary.tokensUsed}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;