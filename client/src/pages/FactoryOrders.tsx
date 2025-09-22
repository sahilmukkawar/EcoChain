import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { marketplaceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import websocketService, { WebSocketMessage } from '../services/websocketService';
import api from '../services/api';

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
  userId: {
    _id: string;
    personalInfo: {
      name: string;
      email: string;
    };
  };
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
  timeline?: {
    placedAt?: string;
    confirmedAt?: string;
    shippedAt?: string;
    deliveredAt?: string;
  };
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

const FactoryOrders: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Fetch factory orders
  const fetchOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // This would need to be implemented in the backend to get orders for factory's products
      const response = await api.get('/orders/factory');
      if (response.data.success) {
        setOrders(response.data.data);
        setError(null);
      } else {
        throw new Error(response.data.message || 'Failed to fetch orders');
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      let errorMessage = 'Failed to load orders. ';
      if (err.response) {
        errorMessage += `Server responded with status ${err.response.status}. `;
        if (err.response.data && err.response.data.message) {
          errorMessage += err.response.data.message;
        }
      } else if (err.request) {
        errorMessage += 'No response received from server. Please check your connection.';
      } else {
        errorMessage += err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle real-time order updates
  const handleOrderUpdate = (message: WebSocketMessage) => {
    if (message.type === 'sync' && message.entityType === 'order' && message.changeType === 'update') {
      // Update the order in the local state if it exists
      const updatedOrders = [...orders];
      let hasChanges = false;
      
      message.changes.forEach((change: any) => {
        const orderIndex = updatedOrders.findIndex(order => order._id === change._id);
        if (orderIndex !== -1) {
          updatedOrders[orderIndex] = {
            ...updatedOrders[orderIndex],
            status: change.status,
            timeline: change.timeline ? { ...updatedOrders[orderIndex].timeline, ...change.timeline } : updatedOrders[orderIndex].timeline
          };
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        setOrders(updatedOrders);
      }
    }
  };

  useEffect(() => {
    fetchOrders();
    
    // Subscribe to order updates
    websocketService.subscribe(['order']);
    websocketService.on('sync', handleOrderUpdate);
    
    // Clean up WebSocket listener
    return () => {
      websocketService.off('sync', handleOrderUpdate);
    };
  }, []);

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId);
      
      const response = await api.put(`/orders/${orderId}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        // Update the order in the local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { ...order, status: newStatus }
              : order
          )
        );
        
        // Show success message
        alert(`Order status updated to ${newStatus}`);
      } else {
        throw new Error(response.data.message || 'Failed to update order status');
      }
    } catch (err: any) {
      console.error('Error updating order status:', err);
      let errorMessage = 'Failed to update order status. ';
      if (err.response) {
        errorMessage += `Server responded with status ${err.response.status}. `;
        if (err.response.data && err.response.data.message) {
          errorMessage += err.response.data.message;
        }
      } else if (err.request) {
        errorMessage += 'No response received from server. Please check your connection.';
      } else {
        errorMessage += err.message;
      }
      alert(errorMessage);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Get next valid status options
  const getNextStatusOptions = (currentStatus: string) => {
    const statusTransitions: Record<string, string[]> = {
      placed: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered', 'returned'],
      delivered: ['returned'],
      cancelled: [],
      returned: []
    };
    
    return statusTransitions[currentStatus] || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-green-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading factory orders...</p>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
            <p className="text-red-600 text-sm mb-6 leading-relaxed">{error}</p>
            <button 
              onClick={() => fetchOrders()}
              disabled={loading}
              className="bg-eco-green-600 hover:bg-eco-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? 'Retrying...' : 'Try Again'}
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
              <h1 className="text-2xl font-bold text-gray-900">Factory Orders</h1>
              <p className="text-sm text-gray-500">Manage and track customer orders for your products</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Refresh Button */}
              <button
                onClick={() => fetchOrders(true)}
                disabled={refreshing}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${refreshing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-eco-green-500 hover:bg-eco-green-600 text-white shadow-sm hover:shadow-md'
                  }`}
              >
                <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Yet</h3>
              <p className="text-gray-600 mb-6">You don't have any customer orders for your products yet.</p>
              <Link 
                to="/factory-product-management" 
                className="inline-flex items-center gap-2 bg-eco-green-600 hover:bg-eco-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Manage Your Products
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Customer Orders</h2>
              <p className="text-sm text-gray-500 mt-1">{orders.length} orders found</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.orderId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{order.userId?.personalInfo?.name || 'Unknown Customer'}</div>
                        <div className="text-gray-500 text-xs">{order.userId?.personalInfo?.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex -space-x-2">
                          {order.orderItems.slice(0, 3).map((item, index) => (
                            <img
                              key={index}
                              className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                              src={item.productId?.productInfo?.images?.[0] || '/uploads/default-product.svg'}
                              alt={item.productId?.productInfo?.name}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/uploads/default-product.svg';
                              }}
                            />
                          ))}
                          {order.orderItems.length > 3 && (
                            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-xs font-medium text-gray-800 ring-2 ring-white">
                              +{order.orderItems.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'delivered' ? 'bg-eco-green-100 text-eco-green-800' :
                          order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'confirmed' ? 'bg-amber-100 text-amber-800' :
                          order.status === 'placed' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{order.billing?.finalAmount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col gap-2">
                          <Link 
                            to={`/order-tracking/${order.shipping?.trackingNumber || order._id}`} 
                            className="text-eco-green-600 hover:text-eco-green-800 font-medium text-sm"
                          >
                            View Details
                          </Link>
                          
                          {/* Status Update Dropdown */}
                          <div className="relative">
                            <select
                              value=""
                              onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                              disabled={updatingOrderId === order._id}
                              className={`block w-full pl-3 pr-10 py-1 text-sm border-gray-300 focus:outline-none focus:ring-eco-green-500 focus:border-eco-green-500 rounded-md ${
                                updatingOrderId === order._id ? 'bg-gray-100' : ''
                              }`}
                            >
                              <option value="">Update Status</option>
                              {getNextStatusOptions(order.status).map((status) => (
                                <option key={status} value={status}>
                                  Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                                </option>
                              ))}
                            </select>
                            {updatingOrderId === order._id && (
                              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-eco-green-600"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FactoryOrders;