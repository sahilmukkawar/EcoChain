import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { useEcoChain } from '../contexts/EcoChainContext';

const Cart: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal, tokenTotal } = useCart();
  const { totalEcoTokens } = useEcoChain();
  const navigate = useNavigate();
  const [isClearing, setIsClearing] = useState(false);

  const handleQuantityChange = (productId: string, quantity: number) => {
    const parsedQuantity = parseInt(quantity.toString());
    if (!isNaN(parsedQuantity) && parsedQuantity >= 0) {
      updateQuantity(productId, parsedQuantity);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear all items from your cart?')) {
      setIsClearing(true);
      try {
        clearCart();
      } finally {
        setIsClearing(false);
      }
    }
  };

  // Calculate totals with proper rounding
  const finalCartTotal = Math.round(cartTotal * 100) / 100;
  const finalTokenTotal = Math.round(tokenTotal);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
                <p className="text-sm text-gray-500">Review your eco-friendly selections</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v5a2 2 0 002 2h2a2 2 0 002-2v-5" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Discover amazing eco-friendly products and pay with money or EcoTokens!
            </p>
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
              <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
              <p className="text-sm text-gray-500">{cart.length} item{cart.length !== 1 ? 's' : ''} in your cart</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Cart Items Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-eco-green-50 text-eco-green-700 border border-eco-green-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v5a2 2 0 002 2h2a2 2 0 002-2v-5" />
                </svg>
                <span>{cart.length} Items</span>
              </div>

              {/* Clear Cart Button */}
              {cart.length > 0 && (
                <button
                  onClick={handleClearCart}
                  disabled={isClearing}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${isClearing
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md'
                    }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {isClearing ? 'Clearing...' : 'Clear All'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Cart Items</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {cart.map((item) => (
                  <div key={item.product.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex gap-6">
                      {/* Product Image */}
                      <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
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

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {item.product.name}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {item.product.description}
                            </p>
                          </div>
                          <button 
                            className="text-red-500 hover:text-red-700 p-2 -m-2 transition-colors"
                            onClick={() => removeFromCart(item.product.id)}
                            title="Remove from cart"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          {/* Pricing */}
                          <div>
                            <div className="text-lg font-bold text-eco-green-600">
                              ₹{item.product.price}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                              {item.product.tokenPrice} tokens
                            </div>
                            <div className="text-xs text-gray-500 mt-1">or mix both</div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center bg-gray-100 rounded-lg">
                              <button 
                                className="w-10 h-10 flex items-center justify-center hover:bg-gray-200 rounded-l-lg transition-colors"
                                onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.product.id, parseInt(e.target.value) || 1)}
                                className="w-16 h-10 text-center bg-transparent border-0 focus:outline-none"
                              />
                              <button 
                                className="w-10 h-10 flex items-center justify-center hover:bg-gray-200 rounded-r-lg transition-colors"
                                onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </button>
                            </div>

                            {/* Item Total */}
                            <div className="text-right">
                              <div className="text-lg font-bold text-eco-green-600">
                                ₹{Math.round((item.product.price * item.quantity) * 100) / 100}
                              </div>
                              <div className="text-sm text-gray-600">
                                {Math.round(item.product.tokenPrice * item.quantity)} tokens
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-8">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Totals */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Money Total</span>
                    <span className="text-xl font-bold text-eco-green-600">₹{finalCartTotal}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Token Total</span>
                    <span className="text-xl font-bold text-eco-green-600">{finalTokenTotal} tokens</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Items in Cart</span>
                    <span className="font-medium">{cart.length} {cart.length === 1 ? 'item' : 'items'}</span>
                  </div>
                </div>

                {/* EcoTokens Balance */}
                <div className="bg-eco-green-50 p-4 rounded-lg border border-eco-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-eco-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <span className="font-medium text-eco-green-800">Your EcoTokens</span>
                  </div>
                  <div className="text-2xl font-bold text-eco-green-600 mb-1">
                    {totalEcoTokens} tokens
                  </div>
                  <div className={`text-sm font-medium ${
                    totalEcoTokens >= finalTokenTotal ? 'text-eco-green-700' : 'text-amber-600'
                  }`}>
                    {totalEcoTokens >= finalTokenTotal ? 
                      '✓ You have enough tokens!' : 
                      `Need ${finalTokenTotal - totalEcoTokens} more tokens`
                    }
                  </div>
                </div>

                {/* Payment Options */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Payment Options</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-eco-green-500 rounded-full"></div>
                      <span>Pay with money (₹{finalCartTotal})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-eco-green-500 rounded-full"></div>
                      <span>Pay with tokens ({finalTokenTotal} tokens)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-eco-green-500 rounded-full"></div>
                      <span>Mix both payment methods</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button 
                    className="w-full flex items-center justify-center gap-2 bg-eco-green-600 hover:bg-eco-green-700 text-white font-medium py-3 px-4 rounded-lg transition-all shadow-sm hover:shadow-md"
                    onClick={() => navigate('/checkout')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
                    </svg>
                    Proceed to Checkout
                  </button>
                  
                  <button 
                    className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-all shadow-sm hover:shadow-md"
                    onClick={() => navigate('/marketplace')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
