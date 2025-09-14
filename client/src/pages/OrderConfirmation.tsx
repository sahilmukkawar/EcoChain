import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketplaceAPI } from '../services/api.ts';

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
      <div className="max-w-4xl mx-auto px-5 py-5">
        <div className="text-center py-5 text-lg">Loading order details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-5 py-5">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-5 py-5">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Order not found.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-5">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-5">
          ✓
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Order Confirmed!</h1>
        <p className="text-gray-600 text-lg">Thank you for your purchase. Your order has been received.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-white p-5 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">Order Details</h2>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Order Number:</span>
            <span>{order.orderId}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Order Date:</span>
            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Status:</span>
            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              {order.status}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Payment Method:</span>
            <span>{order.payment.method === 'token' ? 'EcoTokens' : order.payment.method === 'cash' ? 'Cash on Delivery' : 'Card Payment'}</span>
          </div>
          {order.shipping?.trackingNumber && (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span>Tracking Number:</span>
              <span className="font-mono">{order.shipping.trackingNumber}</span>
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">Shipping Information</h2>
          <div className="mb-4">
            <p className="font-bold">{order.shipping.address?.name || 'N/A'}</p>
            <p>{order.shipping.address?.street || 'N/A'}</p>
            <p>{order.shipping.address?.city || 'N/A'}, {order.shipping.address?.state || 'N/A'} {order.shipping.address?.zipCode || 'N/A'}</p>
            <p>{order.shipping.address?.country || 'N/A'}</p>
            <p>Phone: {order.shipping.address?.phone || 'N/A'}</p>
          </div>
          <div className="pt-4 border-t border-gray-200 text-green-500 font-bold">
            <p>Estimated Delivery: {order.shipping.estimatedDelivery ? new Date(order.shipping.estimatedDelivery).toLocaleDateString() : '3-5 business days'}</p>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Items in Your Order</h2>
        {order.orderItems && order.orderItems.length > 0 ? (
          <div className="flex flex-col gap-5">
            {order.orderItems.map((item, index) => (
              <div key={index} className="flex gap-5 p-5 bg-white rounded-lg shadow-md">
                <div className="w-24 h-24 rounded-md overflow-hidden">
                  <img 
                    src={item.productId?.productInfo?.images?.[0] || '/logo192.png'} 
                    alt={item.productId?.productInfo?.name || 'Product'} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{item.productId?.productInfo?.name || 'Unknown Product'}</h3>
                  <p className="text-gray-600 mb-3">{item.productId?.productInfo?.description || 'No description available'}</p>
                  <div className="font-bold mb-2">
                    Quantity: {item.quantity}
                  </div>
                  <div className="font-bold text-gray-800">
                    ₹{Math.round((item.unitPrice || 0) * 100) / 100} each • Total: ₹{Math.round((item.totalPrice || 0) * 100) / 100}
                    {item.ecoTokensUsed && item.ecoTokensUsed > 0 && (
                      <span className="text-green-600 ml-2">+ {Math.round(item.ecoTokensUsed)} tokens used</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-100 p-5 rounded-lg text-center">
            <p className="text-gray-600">No items found in this order.</p>
          </div>
        )}
      </div>

      <div className="bg-white p-5 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">Order Summary</h2>
        <div className="flex justify-between py-2 border-b border-gray-200">
          <span>Subtotal:</span>
          <span>₹{Math.round((order.billing.subtotal || 0) * 100) / 100}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-200">
          <span>EcoTokens Used:</span>
          <span>{Math.round(order.billing.ecoTokensApplied || 0)} tokens (₹{Math.round((order.billing.ecoTokenValue || 0) * 100) / 100})</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-200">
          <span>Taxes (18% GST):</span>
          <span>₹{Math.round((order.billing.taxes || 0) * 100) / 100}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-200">
          <span>Shipping:</span>
          <span>₹{Math.round((order.billing.shippingCharges || 0) * 100) / 100}</span>
        </div>
        {order.billing.discount > 0 && (
          <div className="flex justify-between py-2 border-b border-gray-200 text-green-600">
            <span>Discount:</span>
            <span>-₹{Math.round((order.billing.discount || 0) * 100) / 100}</span>
          </div>
        )}
        <div className="flex justify-between py-2 border-b border-gray-200 font-bold text-lg text-gray-800">
          <span>Total Paid:</span>
          <span>₹{Math.round((order.billing.finalAmount || 0) * 100) / 100}</span>
        </div>
        {order.billing.ecoTokensApplied > 0 && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg">
            <div className="text-sm text-green-800">
              <div className="font-semibold">EcoToken Savings:</div>
              <div>You saved ₹{Math.round((order.billing.ecoTokenValue || 0) * 100) / 100} by using {Math.round(order.billing.ecoTokensApplied || 0)} EcoTokens!</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-5">
        <button 
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          onClick={() => navigate('/marketplace')}
        >
          Continue Shopping
        </button>
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          onClick={() => navigate(`/order-tracking/${order.shipping?.trackingNumber || order._id}`)}
        >
          Track Order
        </button>
        <button 
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          onClick={() => navigate('/dashboard')}
        >
          View Order History
        </button>
      </div>
    </div>
  );
};

export default OrderConfirmation;