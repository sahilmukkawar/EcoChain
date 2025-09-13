import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useEcoChain } from '../contexts/EcoChainContext.tsx';
import { marketplaceAPI } from '../services/api.ts';

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
  const { totalEcoTokens } = useEcoChain();
  
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: user?.name || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    phone: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState<'money' | 'tokens' | 'mixed'>('money');
  const [tokensToUse, setTokensToUse] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<number>(1); // 1: Shipping, 2: Review, 3: Confirmation

  // Calculate payment details based on payment method with proper rounding
  const maxTokensUsable = Math.min(tokenTotal, totalEcoTokens);
  const tokenValue = Math.round(tokensToUse * 0.1 * 100) / 100; // 1 token = ₹0.1 with proper rounding
  
  let finalMoneyAmount = 0;
  let finalTokenAmount = 0;
  
  switch (paymentMethod) {
    case 'money':
      finalMoneyAmount = Math.round(cartTotal * 100) / 100;
      finalTokenAmount = 0;
      break;
    case 'tokens':
      finalMoneyAmount = 0;
      finalTokenAmount = Math.round(tokenTotal);
      break;
    case 'mixed':
      finalTokenAmount = Math.round(tokensToUse);
      finalMoneyAmount = Math.max(0, Math.round((cartTotal - tokenValue) * 100) / 100);
      break;
  }

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
        
        // Prepare order data with consistent structure
        const orderData = {
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity
          })),
          payment: {
            method: paymentMethod === 'money' ? 'cash' as const : 
                   paymentMethod === 'tokens' ? 'token' as const : 'cash' as const, // mixed uses cash with tokens
            tokensUsed: finalTokenAmount
          },
          shipping: {
            fullName: shippingInfo.fullName,
            address: shippingInfo.address,
            city: shippingInfo.city,
            state: shippingInfo.state,
            zipCode: shippingInfo.zipCode,
            country: shippingInfo.country,
            phone: shippingInfo.phone
          },
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
      } catch (err: any) {
        console.error('Error creating order:', err);
        
        // Extract detailed error message
        let errorMessage = 'Failed to process your order. Please try again.';
        
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        // Log additional details for debugging
        console.error('Error details:', {
          status: err.response?.status,
          data: err.response?.data,
          paymentMethod,
          finalTokenAmount,
          finalMoneyAmount,
          cart: cart.length
        });
        
        setError(errorMessage);
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some products to your cart before checking out.</p>
          <button 
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            onClick={() => navigate('/marketplace')}
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>
        <div className="flex justify-between mb-8">
          <div className={`flex-1 text-center pb-4 border-b-2 ${step >= 1 ? 'border-green-500 text-green-600' : 'border-gray-300 text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${step >= 1 ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
              1
            </div>
            <span className="font-medium">Shipping</span>
          </div>
          <div className={`flex-1 text-center pb-4 border-b-2 ${step >= 2 ? 'border-green-500 text-green-600' : 'border-gray-300 text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${step >= 2 ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
              2
            </div>
            <span className="font-medium">Review</span>
          </div>
          <div className={`flex-1 text-center pb-4 border-b-2 ${step >= 3 ? 'border-green-500 text-green-600' : 'border-gray-300 text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${step >= 3 ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
              3
            </div>
            <span className="font-medium">Confirmation</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3">
          {step === 1 && (
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-6">Shipping Information</h2>
                <div className="mb-4">
                  <label htmlFor="fullName" className="block text-gray-700 font-medium mb-2">Full Name *</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={shippingInfo.fullName}
                    onChange={handleShippingChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="address" className="block text-gray-700 font-medium mb-2">Address *</label>
                  <textarea
                    id="address"
                    name="address"
                    value={shippingInfo.address}
                    onChange={handleShippingChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="city" className="block text-gray-700 font-medium mb-2">City *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={shippingInfo.city}
                      onChange={handleShippingChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="state" className="block text-gray-700 font-medium mb-2">State *</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={shippingInfo.state}
                      onChange={handleShippingChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="zipCode" className="block text-gray-700 font-medium mb-2">ZIP Code *</label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={shippingInfo.zipCode}
                      onChange={handleShippingChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="country" className="block text-gray-700 font-medium mb-2">Country *</label>
                    <select
                      id="country"
                      name="country"
                      value={shippingInfo.country}
                      onChange={handleShippingChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="India">India</option>
                      <option value="USA">USA</option>
                      <option value="UK">UK</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={shippingInfo.phone}
                    onChange={handleShippingChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-between">
                <button 
                  type="button" 
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  onClick={() => navigate('/marketplace')}
                >
                  Continue Shopping
                </button>
                <button 
                  type="submit" 
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Continue to Review
                </button>
              </div>
            </form>
          )}
          
          {step === 2 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6">Order Review</h2>
              
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Items in Your Order</h3>
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex border-b border-gray-200 pb-4">
                      <div className="w-20 h-20 rounded-md overflow-hidden mr-4">
                        <img 
                          src={item.product.imageUrl || '/logo192.png'} 
                          alt={item.product.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold">{item.product.name}</h4>
                        <p className="text-gray-600 text-sm mb-2">{item.product.description}</p>
                        <div className="flex justify-between">
                          <span>₹{Math.round(item.product.price * 100) / 100} + {Math.round(item.product.tokenPrice)} Tokens</span>
                          <span>Qty: {item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-bold">{shippingInfo.fullName}</p>
                  <p>{shippingInfo.address}</p>
                  <p>{shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}</p>
                  <p>{shippingInfo.country}</p>
                  <p>Phone: {shippingInfo.phone}</p>
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                <div className="space-y-4">
                  <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="money"
                      checked={paymentMethod === 'money'}
                      onChange={() => setPaymentMethod('money')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Pay with Money</div>
                      <div className="text-sm text-gray-600">Total: ₹{Math.round(cartTotal * 100) / 100}</div>
                    </div>
                  </label>
                  
                  <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="tokens"
                      checked={paymentMethod === 'tokens'}
                      onChange={() => setPaymentMethod('tokens')}
                      className="mt-1"
                      disabled={totalEcoTokens < Math.round(tokenTotal)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">Pay with EcoTokens</div>
                      <div className="text-sm text-gray-600">
                        Total: {Math.round(tokenTotal)} tokens (You have: {totalEcoTokens})
                      </div>
                      {totalEcoTokens < Math.round(tokenTotal) && (
                        <div className="text-xs text-red-500">Insufficient tokens</div>
                      )}
                    </div>
                  </label>
                  
                  <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mixed"
                      checked={paymentMethod === 'mixed'}
                      onChange={() => setPaymentMethod('mixed')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Mix Payment (Tokens + Money)</div>
                      <div className="text-sm text-gray-600">Use both tokens and money</div>
                      {paymentMethod === 'mixed' && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium mb-2">
                            Tokens to use: {tokensToUse} (Value: ₹{tokenValue.toFixed(2)})
                          </label>
                          <input
                            type="range"
                            min="0"
                            max={Math.min(totalEcoTokens, Math.floor(cartTotal / 0.1))}
                            value={tokensToUse}
                            onChange={(e) => setTokensToUse(parseInt(e.target.value))}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0 tokens</span>
                            <span>{Math.min(totalEcoTokens, Math.floor(cartTotal / 0.1))} tokens max</span>
                          </div>
                          <div className="mt-2 text-sm">
                            <div>Tokens: {tokensToUse} tokens (₹{tokenValue.toFixed(2)})</div>
                            <div>Money: ₹{finalMoneyAmount.toFixed(2)}</div>
                            <div className="font-semibold border-t pt-1 mt-1">Total Value: ₹{(finalMoneyAmount + tokenValue).toFixed(2)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="mb-8">
                <label htmlFor="orderNotes" className="block text-gray-700 font-medium mb-2">Order Notes (Optional)</label>
                <textarea
                  id="orderNotes"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={3}
                  placeholder="Any special instructions for your order?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium mb-3">Payment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Cart Total (Money):</span>
                    <span>₹{Math.round(cartTotal * 100) / 100}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cart Total (Tokens):</span>
                    <span>{Math.round(tokenTotal)} tokens</span>
                  </div>
                  <hr className="my-2" />
                  {paymentMethod === 'money' && (
                    <div className="flex justify-between font-semibold text-green-600">
                      <span>You will pay:</span>
                      <span>₹{finalMoneyAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {paymentMethod === 'tokens' && (
                    <div className="flex justify-between font-semibold text-blue-600">
                      <span>You will pay:</span>
                      <span>{finalTokenAmount} tokens</span>
                    </div>
                  )}
                  {paymentMethod === 'mixed' && (
                    <>
                      <div className="flex justify-between text-blue-600">
                        <span>Tokens:</span>
                        <span>{finalTokenAmount} tokens</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Money:</span>
                        <span>₹{finalMoneyAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total Value:</span>
                        <span>₹{(finalMoneyAmount + (finalTokenAmount * 0.1)).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between">
                <button 
                  type="button" 
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  onClick={goBack}
                >
                  Back to Shipping
                </button>
                <button 
                  type="button" 
                  className={`bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="lg:w-1/3">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h3 className="text-lg font-bold mb-4">Order Summary</h3>
            <div className="space-y-3 mb-4">
              {cart.map(item => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span>{item.product.name} x {item.quantity}</span>
                  <div className="text-right">
                    <div className="text-green-600">₹{Math.round((item.product.price * item.quantity) * 100) / 100}</div>
                    <div className="text-blue-600 text-xs">{Math.round(item.product.tokenPrice * item.quantity)} tokens</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Items (Money):</span>
                  <span>₹{Math.round(cartTotal * 100) / 100}</span>
                </div>
                <div className="flex justify-between">
                  <span>Items (Tokens):</span>
                  <span>{Math.round(tokenTotal)} tokens</span>
                </div>
                <hr className="my-2" />
                {paymentMethod === 'money' && (
                  <div className="flex justify-between font-bold text-green-600">
                    <span>Total to Pay:</span>
                    <span>₹{finalMoneyAmount.toFixed(2)}</span>
                  </div>
                )}
                {paymentMethod === 'tokens' && (
                  <div className="flex justify-between font-bold text-blue-600">
                    <span>Total to Pay:</span>
                    <span>{finalTokenAmount} tokens</span>
                  </div>
                )}
                {paymentMethod === 'mixed' && (
                  <>
                    <div className="flex justify-between text-blue-600">
                      <span>Tokens:</span>
                      <span>{finalTokenAmount} tokens</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Money:</span>
                      <span>₹{finalMoneyAmount.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;