import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useEcoChain } from '../contexts/EcoChainContext.tsx';
import { orderService } from '../services/orderService.ts';
import { Order } from '../services/orderService.ts';
import wasteService, { WasteSubmission } from '../services/wasteService.ts';
import { authAPI } from '../services/api.ts';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, updateUser } = useAuth();
  const { 
    collectionHistory, 
    environmentalImpact, 
    totalEcoTokens, 
    refreshCollections 
  } = useEcoChain();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  
  // Add waste collection requests state
  const [wasteRequests, setWasteRequests] = useState<WasteSubmission[]>([]);
  const [wasteLoading, setWasteLoading] = useState<boolean>(true);
  const [wasteError, setWasteError] = useState<string | null>(null);
  
  // Add current token balance state from database
  const [currentTokenBalance, setCurrentTokenBalance] = useState<number>(user?.ecoWallet?.currentBalance || 0);
  const [lastTokenUpdate, setLastTokenUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Set loading to false once we have user data
    if (user) {
      console.log('Dashboard useEffect - User detected, initializing...');
      console.log('User initial token balance:', user.ecoWallet?.currentBalance);
      
      setLoading(false);
      
      // Only update token balance if it's different from current state
      const userTokenBalance = user.ecoWallet?.currentBalance || 0;
      if (userTokenBalance !== currentTokenBalance) {
        setCurrentTokenBalance(userTokenBalance);
      }
      
      // Fetch all dashboard data
      fetchOrders();
      fetchWasteRequests();
      
      // Fetch latest user data only once on initial load
      fetchLatestUserData();
    } else {
      setLoading(false);
    }
  }, [user]);
  
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const userOrders = await orderService.getUserOrders();
      setOrders(userOrders);
      setOrdersError(null);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setOrdersError(err.message || 'Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };
  
  const fetchWasteRequests = async () => {
    try {
      setWasteLoading(true);
      const response = await wasteService.getUserSubmissions();
      setWasteRequests(response.data.collections || []);
      setWasteError(null);
    } catch (err: any) {
      console.error('Error fetching waste requests:', err);
      setWasteError(err.message || 'Failed to load waste requests');
    } finally {
      setWasteLoading(false);
    }
  };
  
  // Function to fetch latest user data including updated token balance
  const fetchLatestUserData = async () => {
    try {
      console.log('Fetching latest user data from database...');
      const response = await authAPI.getCurrentUser();
      if (response.data.success) {
        const latestUserData = response.data.data;
        const newTokenBalance = latestUserData.ecoWallet?.currentBalance || 0;
        
        console.log('Previous token balance:', currentTokenBalance);
        console.log('New token balance from database:', newTokenBalance);
        
        // Only update if the token balance has actually changed
        if (newTokenBalance !== currentTokenBalance) {
          setCurrentTokenBalance(newTokenBalance);
          setLastTokenUpdate(new Date());
          console.log('Token balance updated from', currentTokenBalance, 'to', newTokenBalance);
        } else {
          console.log('Token balance unchanged, skipping update');
        }
        
        // Update user in AuthContext with fresh data (but only if significantly different)
        if (updateUser && (newTokenBalance !== currentTokenBalance || !user?.ecoWallet)) {
          updateUser(latestUserData);
          console.log('Updated user in AuthContext with fresh data');
        }
        
        return newTokenBalance;
      } else {
        console.error('Failed to fetch user data:', response.data.message);
      }
    } catch (err: any) {
      console.error('Error fetching latest user data:', err);
      console.error('Error details:', err.response?.data || err.message);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-32 bg-gray-100 rounded-lg">Loading...</div>;
  if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Error: {error}</div>;

  const handleRefresh = async () => {
    try {
      console.log('Dashboard refresh initiated...');
      setLoading(true);
      
      // Refresh all data in parallel for better performance
      await Promise.all([
        refreshCollections(),
        fetchOrders(),
        fetchWasteRequests(),
        fetchLatestUserData() // Always refresh user token balance
      ]);
      
      console.log('Dashboard refresh completed successfully');
      setLoading(false);
    } catch (error) {
      console.error('Refresh failed:', error);
      setError('Failed to refresh data. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Dashboard</h1>
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          onClick={handleRefresh}
        >
          Refresh Data
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-gray-100 p-6 rounded-xl shadow">
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Your EcoTokens</h3>
              <div className="flex items-center gap-2 text-2xl font-bold text-green-600">
                <span className="text-3xl">🌱</span>
                <span className="token-amount">{currentTokenBalance}</span>
              </div>
              {lastTokenUpdate && (
                <div className="text-xs text-gray-500 mt-1 italic">
                  Last updated: {lastTokenUpdate.toLocaleTimeString()}
                </div>
              )}
              <div className="mt-3">
                <button 
                  onClick={() => {
                    console.log('Manual token balance refresh clicked');
                    fetchLatestUserData();
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg font-medium shadow hover:from-green-600 hover:to-green-700 transition-all"
                >
                  🔄 Refresh Balance
                </button>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Your Environmental Impact</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between">
                  <span>CO2 Saved:</span>
                  <span className="font-medium">{environmentalImpact.co2Saved} kg</span>
                </li>
                <li className="flex justify-between">
                  <span>Trees Equivalent:</span>
                  <span className="font-medium">{environmentalImpact.treesEquivalent}</span>
                </li>
                <li className="flex justify-between">
                  <span>Water Saved:</span>
                  <span className="font-medium">{environmentalImpact.waterSaved} L</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <h3 className="text-gray-600 mb-2">Total Requests</h3>
              <p className="text-2xl font-bold">{wasteRequests.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <h3 className="text-gray-600 mb-2">Total Weight</h3>
              <p className="text-2xl font-bold">
                {wasteRequests.reduce((sum, item) => sum + (item.collectionDetails?.weight || 0), 0).toFixed(2)} kg
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <h3 className="text-gray-600 mb-2">Completed Collections</h3>
              <p className="text-2xl font-bold">
                {wasteRequests.filter(item => item.status === 'completed').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <h3 className="text-gray-600 mb-2">Pending Requests</h3>
              <p className="text-2xl font-bold">
                {wasteRequests.filter(item => item.status === 'requested').length}
              </p>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Your Waste Collection Requests</h2>
            {wasteLoading ? (
              <div className="flex justify-center items-center h-32 bg-gray-50 rounded-lg">
                Loading your requests...
              </div>
            ) : wasteError ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {wasteError}
              </div>
            ) : wasteRequests.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="mb-4">No waste collection requests found.</p>
                <Link 
                  to="/waste-submission" 
                  className="inline-block bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Submit Your First Waste Request
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Requested</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waste Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (kg)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pickup Address</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Tokens</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {wasteRequests.map(request => {
                      const statusClass = `inline-block px-2 py-1 text-xs font-medium rounded capitalize ${
                        request.status === 'completed' ? 'bg-green-100 text-green-800' :
                        request.status === 'requested' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        request.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                        request.status === 'collected' ? 'bg-indigo-100 text-indigo-800' :
                        request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`;
                      const estimatedTokens = request.tokenCalculation?.totalTokensIssued || 0;
                      
                      return (
                        <tr key={request._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{request.collectionId}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 capitalize">
                            {request.collectionDetails?.type}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {request.collectionDetails?.weight || 0}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 capitalize">
                            {request.collectionDetails?.quality || 'fair'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={statusClass}>
                              {request.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {request.location?.pickupAddress || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {estimatedTokens}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {request.status === 'requested' && (
                              <span className="text-gray-500">Waiting for collector</span>
                            )}
                            {request.status === 'scheduled' && (
                              <span className="text-blue-600">Collector assigned</span>
                            )}
                            {request.status === 'in_progress' && (
                              <span className="text-purple-600">Collection in progress</span>
                            )}
                            {request.status === 'collected' && (
                              <span className="text-indigo-600">Collected, processing...</span>
                            )}
                            {request.status === 'completed' && (
                              <span className="text-green-600 font-medium">✅ Tokens earned!</span>
                            )}
                            {request.status === 'rejected' && (
                              <span className="text-red-600 font-medium">❌ Rejected</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Your Orders</h2>
            {ordersLoading ? (
              <div className="flex justify-center items-center h-32 bg-gray-50 rounded-lg">
                Loading your orders...
              </div>
            ) : ordersError ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {ordersError}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                You haven't placed any orders yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens Used</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {order._id.substring(0, 8)}...
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded capitalize ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                            order.status === 'delivered' ? 'bg-indigo-100 text-indigo-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          ₹{order.totalPrice}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {order.totalTokenPrice}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <Link 
                              to={`/order-confirmation/${order._id}`} 
                              className="inline-block bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                              View
                            </Link>
                            {order.trackingNumber && (
                              <Link 
                                to={`/order-tracking/${order.trackingNumber}`} 
                                className="inline-block bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded text-xs font-medium transition-colors"
                              >
                                Track
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;