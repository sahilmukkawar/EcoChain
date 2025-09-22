import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../context/AuthContext';
import { useEcoChain } from '../contexts/EcoChainContext';
import { marketplaceAPI } from '../services/api';

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
  const [step, setStep] = useState<number>(1);

  // Calculate payment details
  const maxTokensUsable = Math.min(tokenTotal, totalEcoTokens);
  const tokenValue = Math.round(tokensToUse * 2 * 100) / 100;
  
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

  const taxes = Math.round(cartTotal * 0.18 * 100) / 100;
  const shipping = cartTotal > 500 ? 0 : 50;
  
  let displayFinalTotal = 0;
  switch (paymentMethod) {
    case 'money':
      displayFinalTotal = Math.round((cartTotal + taxes + shipping) * 100) / 100;
      break;
    case 'tokens':
      const tokenDeduction = Math.round(tokenTotal) * 2;
      displayFinalTotal = Math.max(0, Math.round((cartTotal + taxes + shipping - tokenDeduction) * 100) / 100);
      break;
    case 'mixed':
      displayFinalTotal = Math.max(0, Math.round((cartTotal + taxes + shipping - tokenValue) * 100) / 100);
      break;
  }

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingInfo({
      ...shippingInfo,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!shippingInfo.fullName || !shippingInfo.address || !shippingInfo.city || 
          !shippingInfo.state || !shippingInfo.zipCode || !shippingInfo.phone) {
        setError('Please fill in all required shipping information.');
        return;
      }
      setError(null);
      setStep(2);
      return;
    }
    
    if (step === 2) {
      try {
        setIsLoading(true);
        setError(null);
        
        const orderData = {
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity
          })),
          payment: {
            method: paymentMethod === 'money' ? 'cash' as const : 
                   paymentMethod === 'tokens' ? 'token' as const : 'cash' as const,
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
        
        const response = await marketplaceAPI.createOrder(orderData);
        
        if (response.data.success) {
          clearCart();
          navigate(`/order-confirmation/${response.data.data._id}`);
        } else {
          throw new Error(response.data.message || 'Failed to create order');
        }
      } catch (err: any) {
        console.error('Error creating order:', err);
        
        let errorMessage = 'Failed to process your order. Please try again.';
        
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError(null);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
                <p className="text-sm text-gray-500">Complete your eco-friendly purchase</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v5a2 2 0 002 2h2a2 2 0 002-2v-5" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-lg text-gray-600 mb-8">Add some products to your cart before checking out.</p>
            <button 
              className="inline-flex items-center gap-2 bg-eco-green-600 hover:bg-eco-green-700 text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              onClick={() => navigate('/marketplace')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Browse Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
              <p className="text-sm text-gray-500">Complete your eco-friendly purchase</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-eco-green-50 text-eco-green-700 border border-eco-green-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v5a2 2 0 002 2h2a2 2 0 002-2v-5" />
                </svg>
                <span>{cart.length} Items</span>
              </div>

              <button
                onClick={() => navigate('/cart')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-8">
              {/* Step 1 */}
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= 1 ? 'bg-eco-green-500 text-white' : 'bg-gray-300 text-gray-500'
                }`}>
                  {step > 1 ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="font-semibold">1</span>
                  )}
                </div>
                <span className={`ml-3 font-medium ${step >= 1 ? 'text-eco-green-600' : 'text-gray-500'}`}>
                  Shipping Info
                </span>
              </div>

              {/* Connector */}
              <div className={`w-16 h-1 ${step >= 2 ? 'bg-eco-green-500' : 'bg-gray-300'}`}></div>

              {/* Step 2 */}
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= 2 ? 'bg-eco-green-500 text-white' : 'bg-gray-300 text-gray-500'
                }`}>
                  {step > 2 ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="font-semibold">2</span>
                  )}
                </div>
                <span className={`ml-3 font-medium ${step >= 2 ? 'text-eco-green-600' : 'text-gray-500'}`}>
                  Review & Payment
                </span>
              </div>

              {/* Connector */}
              <div className={`w-16 h-1 ${step >= 3 ? 'bg-eco-green-500' : 'bg-gray-300'}`}></div>

              {/* Step 3 */}
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= 3 ? 'bg-eco-green-500 text-white' : 'bg-gray-300 text-gray-500'
                }`}>
                  <span className="font-semibold">3</span>
                </div>
                <span className={`ml-3 font-medium ${step >= 3 ? 'text-eco-green-600' : 'text-gray-500'}`}>
                  Confirmation
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-800 font-medium text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">Shipping Information</h2>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={shippingInfo.fullName}
                      onChange={handleShippingChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={shippingInfo.address}
                      onChange={handleShippingChange}
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={shippingInfo.city}
                        onChange={handleShippingChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={shippingInfo.state}
                        onChange={handleShippingChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={shippingInfo.zipCode}
                        onChange={handleShippingChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                        Country *
                      </label>
                      <select
                        id="country"
                        name="country"
                        value={shippingInfo.country}
                        onChange={handleShippingChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green-500 focus:border-transparent"
                      >
                        <option value="India">India</option>
                        <option value="USA">USA</option>
                        <option value="UK">UK</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={shippingInfo.phone}
                      onChange={handleShippingChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex justify-between pt-6">
                    <button 
                      type="button" 
                      className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-all"
                      onClick={() => navigate('/cart')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to Cart
                    </button>
                    <button 
                      type="submit" 
                      className="flex items-center gap-2 bg-eco-green-600 hover:bg-eco-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all"
                    >
                      Continue to Review
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-8">
                {/* Order Items */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {cart.map(item => (
                        <div key={item.product.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="w-16 h-16 bg-white rounded-lg overflow-hidden shadow-sm">
                            <img 
                              src={item.product.imageUrl || '/uploads/default-product.svg'} 
                              alt={item.product.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/uploads/default-product.svg';
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{item.product.name}</h4>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-1">{item.product.description}</p>
                            <div className="flex justify-between items-center">
                              <div className="text-sm">
                                <span className="text-eco-green-600">₹{Math.round(item.product.price * 100) / 100}</span>
                                <span className="text-gray-400 mx-1">+</span>
                                <span className="text-eco-green-600">{Math.round(item.product.tokenPrice)} tokens</span>
                              </div>
                              <span className="text-sm font-medium text-gray-900">Qty: {item.quantity}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900">Shipping Address</h3>
                  </div>
                  <div className="p-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="font-semibold text-gray-900 mb-1">{shippingInfo.fullName}</div>
                      <div className="text-gray-600 space-y-1">
                        <div>{shippingInfo.address}</div>
                        <div>{shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}</div>
                        <div>{shippingInfo.country}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{shippingInfo.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Money Payment */}
                    <label className="flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="money"
                        checked={paymentMethod === 'money'}
                        onChange={() => setPaymentMethod('money')}
                        className="mt-1 text-eco-green-600 focus:ring-eco-green-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium text-gray-900">Pay with Money</span>
                        </div>
                        <div className="text-sm text-gray-600">Total: ₹{Math.round(cartTotal * 100) / 100}</div>
                      </div>
                    </label>
                    
                    {/* Token Payment */}
                    <label className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                      totalEcoTokens < Math.round(tokenTotal) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="tokens"
                        checked={paymentMethod === 'tokens'}
                        onChange={() => setPaymentMethod('tokens')}
                        disabled={totalEcoTokens < Math.round(tokenTotal)}
                        className="mt-1 text-eco-green-600 focus:ring-eco-green-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-5 h-5 text-eco-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                          <span className="font-medium text-gray-900">Pay with EcoTokens</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Total: {Math.round(tokenTotal)} tokens (You have: {totalEcoTokens})
                        </div>
                        {totalEcoTokens < Math.round(tokenTotal) && (
                          <div className="text-xs text-red-500 mt-1">Insufficient tokens</div>
                        )}
                      </div>
                    </label>
                    
                    {/* Mixed Payment */}
                    <label className="flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="mixed"
                        checked={paymentMethod === 'mixed'}
                        onChange={() => setPaymentMethod('mixed')}
                        className="mt-1 text-eco-green-600 focus:ring-eco-green-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <span className="font-medium text-gray-900">Mix Payment (Tokens + Money)</span>
                        </div>
                        <div className="text-sm text-gray-600 mb-3">Use both tokens and money</div>
                        {paymentMethod === 'mixed' && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Tokens to use: {tokensToUse} (Value: ₹{tokenValue.toFixed(2)})
                            </label>
                            <input
                              type="range"
                              min="0"
                              max={Math.min(totalEcoTokens, tokenTotal)}
                              value={tokensToUse}
                              onChange={(e) => setTokensToUse(parseInt(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                              <span>0 tokens</span>
                              <span>{Math.min(totalEcoTokens, tokenTotal)} tokens max</span>
                            </div>
                            <div className="mt-3 p-3 bg-white rounded border">
                              <div className="text-sm space-y-1">
                                <div className="flex justify-between">
                                  <span>Tokens:</span>
                                  <span className="text-eco-green-600">{tokensToUse} tokens (₹{tokenValue.toFixed(2)})</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Money:</span>
                                  <span className="text-eco-green-600">₹{finalMoneyAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-semibold border-t pt-1 mt-2">
                                  <span>Total Value:</span>
                                  <span>₹{(finalMoneyAmount + tokenValue).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Order Notes */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900">Order Notes (Optional)</h3>
                  </div>
                  <div className="p-6">
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      rows={3}
                      placeholder="Any special instructions for your order?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <button 
                    type="button" 
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-all"
                    onClick={goBack}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Shipping
                  </button>
                  <button 
                    type="button" 
                    className={`flex items-center gap-2 bg-eco-green-600 hover:bg-eco-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all ${
                      isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Place Order
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-8">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.product.name} × {item.quantity}</span>
                      <div className="text-right">
                        <div className="text-eco-green-600 font-medium">
                          ₹{Math.round((item.product.price * item.quantity) * 100) / 100}
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.round(item.product.tokenPrice * item.quantity)} tokens
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{Math.round(cartTotal * 100) / 100}</span>
                  </div>
                  
                  {paymentMethod !== 'money' && (
                    <div className="flex justify-between text-sm text-eco-green-600">
                      <span>EcoTokens Used</span>
                      <span className="font-medium">
                        {paymentMethod === 'tokens' ? Math.round(tokenTotal) : tokensToUse} tokens 
                        {` (-₹${((paymentMethod === 'tokens' ? Math.round(tokenTotal) : tokensToUse) * 2).toFixed(2)})`}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxes (18% GST)</span>
                    <span className="font-medium">₹{taxes.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-eco-green-600">
                        ₹{displayFinalTotal.toFixed(2)}
                      </span>
                    </div>
                    
                    {paymentMethod !== 'money' && (
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        {paymentMethod === 'tokens' 
                          ? `Paid with ${Math.round(tokenTotal)} tokens` 
                          : `${tokensToUse} tokens + ₹${displayFinalTotal.toFixed(2)}`
                        }
                      </div>
                    )}
                  </div>
                </div>

                {/* EcoTokens Balance */}
                <div className="bg-eco-green-50 p-4 rounded-lg border border-eco-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-eco-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <span className="text-sm font-medium text-eco-green-800">Your EcoTokens</span>
                  </div>
                  <div className="text-lg font-bold text-eco-green-600">
                    {totalEcoTokens} tokens available
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
