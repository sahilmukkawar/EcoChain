import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext.tsx';
import { useNavigate } from 'react-router-dom';
import { useEcoChain } from '../contexts/EcoChainContext.tsx';

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
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some eco-friendly products to your cart and pay with money or EcoTokens!</p>
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Shopping Cart</h1>
        {cart.length > 0 && (
          <button
            onClick={handleClearCart}
            disabled={isClearing}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {isClearing ? 'Clearing...' : 'Clear All'}
          </button>
        )}
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left">Product</th>
                  <th className="py-3 px-4 text-center">Price</th>
                  <th className="py-3 px-4 text-center">Quantity</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.product.id} className="border-b border-gray-200">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <img 
                          src={item.product.imageUrl || '/logo192.png'} 
                          alt={item.product.name} 
                          className="w-16 h-16 object-cover rounded-md mr-4"
                        />
                        <div>
                          <h3 className="font-bold">{item.product.name}</h3>
                          <p className="text-gray-600 text-sm">{item.product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="font-semibold text-green-600">₹{item.product.price}</div>
                      <div className="text-sm text-blue-600 font-medium">{item.product.tokenPrice} tokens</div>
                      <div className="text-xs text-gray-500 mt-1">or mix both</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <button 
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-l"
                          onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.product.id, parseInt(e.target.value) || 1)}
                          className="w-12 h-8 text-center border-y border-gray-300"
                        />
                        <button 
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-r"
                          onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="font-semibold text-green-600">₹{Math.round((item.product.price * item.quantity) * 100) / 100}</div>
                      <div className="text-sm text-blue-600 font-medium">{Math.round(item.product.tokenPrice * item.quantity)} tokens</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="lg:w-1/3">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span>Money Total:</span>
                <span className="font-semibold text-green-600">₹{finalCartTotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Token Total:</span>
                <span className="font-semibold text-blue-600">{finalTokenTotal} tokens</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Items in Cart:</span>
                <span>{cart.length} {cart.length === 1 ? 'item' : 'items'}</span>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg mt-3">
                <div className="flex justify-between text-sm">
                  <span>Your EcoTokens:</span>
                  <span className="font-medium">{totalEcoTokens} tokens</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {totalEcoTokens >= finalTokenTotal ? 
                    '✓ You have enough tokens!' : 
                    `Need ${finalTokenTotal - totalEcoTokens} more tokens`
                  }
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="text-sm text-gray-600 mb-2">
                <div className="font-medium mb-1">Payment Options:</div>
                <div className="text-xs space-y-1">
                  <div>• Pay with money (₹{finalCartTotal})</div>
                  <div>• Pay with tokens ({finalTokenTotal} tokens)</div>
                  <div>• Mix both payment methods</div>
                </div>
              </div>
              <button 
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
              </button>
              <button 
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                onClick={() => navigate('/marketplace')}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;