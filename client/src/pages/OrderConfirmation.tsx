import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketplaceAPI } from '../services/api';

interface OrderItem {
  productId: {
    _id: string;
    productInfo: {
      name: string;
      description?: string;
      images?: string[];
    };
    pricing?: {
      sellingPrice?: number;
      ecoTokenDiscount?: number;
    };
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  ecoTokensUsed?: number;
}

interface Order {
  _id: string;
  orderId: string;
  userId: string;
  orderItems: OrderItem[];
  billing: {
    subtotal: number;
    ecoTokensApplied: number;
    ecoTokenValue: number;
    taxes: number;
    shippingCharges: number;
    discount: number;
    finalAmount: number;
  };
  status: string;
  shipping: {
    address: {
      name: string;
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      phone: string;
    };
    trackingNumber?: string;
    estimatedDelivery?: string;
  };
  payment: {
    method: string;
    status: string;
  };
  createdAt: string;
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-green-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-red-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Order</h3>
            <p className="text-red-600 text-sm mb-6 leading-relaxed">{error}</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="bg-eco-green-600 hover:bg-eco-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Not Found</h3>
            <p className="text-gray-600 text-sm mb-6">We couldn't find the order you're looking for.</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="bg-eco-green-600 hover:bg-eco-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Action Buttons */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Confirmation</h1>
              <p className="text-sm text-gray-500">Thank you for your eco-friendly purchase!</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Order Status Badge */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                order.status === 'completed' ? 'bg-eco-green-50 text-eco-green-700 border border-eco-green-200' :
                order.status === 'processing' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                order.status === 'shipped' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                <span className="capitalize">{order.status}</span>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-2">
                {order.shipping?.trackingNumber && (
                  <button 
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg transition-all text-sm"
                    onClick={() => navigate(`/order-tracking/${order.shipping?.trackingNumber || order._id}`)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    Track
                  </button>
                )}
                
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-eco-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Order Confirmed!</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Thank you for your purchase. Your order has been received and is being processed. 
            You'll receive updates via email as your order progresses.
          </p>
        </div>

        {/* Order Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Order Details */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Order Number</span>
                <span className="font-medium text-gray-900">{order.orderId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Order Date</span>
                <span className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  order.status === 'completed' ? 'bg-eco-green-100 text-eco-green-800' :
                  order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium text-gray-900">
                  {order.payment.method === 'token' ? 'EcoTokens' : 
                   order.payment.method === 'cash' ? 'Cash on Delivery' : 'Card Payment'}
                </span>
              </div>
              {order.shipping?.trackingNumber && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tracking Number</span>
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{order.shipping.trackingNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Shipping Information</h2>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <div className="font-medium text-gray-900 mb-2">{order.shipping.address?.name || 'N/A'}</div>
                <div className="text-gray-600 space-y-1">
                  <div>{order.shipping.address?.street || 'N/A'}</div>
                  <div>{order.shipping.address?.city || 'N/A'}, {order.shipping.address?.state || 'N/A'} {order.shipping.address?.zipCode || 'N/A'}</div>
                  <div>{order.shipping.address?.country || 'N/A'}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{order.shipping.address?.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-eco-green-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">
                    Estimated Delivery: {order.shipping.estimatedDelivery ? 
                      new Date(order.shipping.estimatedDelivery).toLocaleDateString() : '3-5 business days'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Items in Your Order</h2>
          </div>
          <div className="p-6">
            {order.orderItems && order.orderItems.length > 0 ? (
              <div className="space-y-6">
                {order.orderItems.map((item, index) => (
                  <div key={index} className="flex gap-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex-shrink-0 w-20 h-20 bg-white rounded-lg overflow-hidden shadow-sm">
                      <img 
                        src={item.productId?.productInfo?.images?.[0] || '/uploads/default-product.svg'} 
                        alt={item.productId?.productInfo?.name || 'Product'} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/uploads/default-product.svg';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {item.productId?.productInfo?.name || 'Unknown Product'}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {item.productId?.productInfo?.description || 'No description available'}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Quantity:</span> {item.quantity}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            ₹{Math.round((item.totalPrice || 0) * 100) / 100}
                          </div>
                          <div className="text-sm text-gray-600">
                            ₹{Math.round((item.unitPrice || 0) * 100) / 100} each
                          </div>
                          {item.ecoTokensUsed && item.ecoTokensUsed > 0 && (
                            <div className="text-xs text-eco-green-600 font-medium mt-1">
                              + {Math.round(item.ecoTokensUsed)} tokens used
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No items found in this order.
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">₹{Math.round((order.billing.subtotal || 0) * 100) / 100}</span>
              </div>
              
              {order.billing.ecoTokensApplied > 0 && (
                <div className="flex justify-between items-center text-eco-green-600">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    EcoTokens Discount
                  </span>
                  <span className="font-medium">
                    {Math.round(order.billing.ecoTokensApplied || 0)} tokens (-₹{Math.round((order.billing.ecoTokenValue || 0) * 100) / 100})
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Taxes (18% GST)</span>
                <span className="font-medium text-gray-900">₹{Math.round((order.billing.taxes || 0) * 100) / 100}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-gray-900">₹{Math.round((order.billing.shippingCharges || 0) * 100) / 100}</span>
              </div>
              
              {order.billing.discount > 0 && (
                <div className="flex justify-between items-center text-eco-green-600">
                  <span>Discount</span>
                  <span className="font-medium">-₹{Math.round((order.billing.discount || 0) * 100) / 100}</span>
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Paid</span>
                  <span className="text-xl font-bold text-eco-green-600">
                    ₹{Math.round((order.billing.finalAmount || 0) * 100) / 100}
                  </span>
                </div>
              </div>
            </div>
            
            {order.billing.ecoTokensApplied > 0 && (
              <div className="mt-6 p-4 bg-eco-green-50 rounded-lg border border-eco-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-eco-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-eco-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-eco-green-800">EcoToken Savings!</div>
                    <div className="text-sm text-eco-green-700">
                      You saved ₹{Math.round((order.billing.ecoTokenValue || 0) * 100) / 100} by using {Math.round(order.billing.ecoTokensApplied || 0)} EcoTokens
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action - Continue Shopping */}
        <div className="text-center">
          <button 
            className="inline-flex items-center gap-2 bg-eco-green-600 hover:bg-eco-green-700 text-white font-medium py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
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
  );
};

export default OrderConfirmation;
