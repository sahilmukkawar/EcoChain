import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useEcoChain } from '../contexts/EcoChainContext.tsx';
import { orderService } from '../services/orderService.ts';
import { Order } from '../services/orderService.ts';
import wasteService, { WasteSubmission } from '../services/wasteService.ts';
import { authAPI } from '../services/api.ts';

// Helper function to get CSS classes for order status
const getOrderStatusClass = (status: Order['status'] | 'completed') => {
  switch (status) {
    case 'completed':
    case 'delivered':
      return 'bg-eco-green-100 text-eco-green-800';
    case 'pending':
      return 'bg-amber-100 text-amber-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'shipped':
      return 'bg-purple-100 text-purple-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Helper function to get CSS classes for waste request status
const getWasteRequestStatusClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-eco-green-100 text-eco-green-800';
    case 'requested':
      return 'bg-amber-100 text-amber-800';
    case 'scheduled':
      return 'bg-blue-100 text-blue-800';
    case 'in_progress':
      return 'bg-purple-100 text-purple-800';
    case 'collected':
      return 'bg-indigo-100 text-indigo-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
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
  
  const [wasteRequests, setWasteRequests] = useState<WasteSubmission[]>([]);
  const [wasteLoading, setWasteLoading] = useState<boolean>(true);
  const [wasteError, setWasteError] = useState<string | null>(null);
  
  const [currentTokenBalance, setCurrentTokenBalance] = useState<number>(user?.ecoWallet?.currentBalance || 0);
  const [lastTokenUpdate, setLastTokenUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      console.log('Dashboard useEffect - User detected, initializing...');
      console.log('User initial token balance:', user.ecoWallet?.currentBalance);
      
      setLoading(false);
      
      const userTokenBalance = user.ecoWallet?.currentBalance || 0;
      if (userTokenBalance !== currentTokenBalance) {
        setCurrentTokenBalance(userTokenBalance);
      }
      
      fetchOrders();
      fetchWasteRequests();
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
  
  const fetchLatestUserData = async () => {
    try {
      console.log('Fetching latest user data from database...');
      const response = await authAPI.getCurrentUser();
      if (response.data.success) {
        const latestUserData = response.data.data;
        const newTokenBalance = latestUserData.ecoWallet?.currentBalance || 0;
        
        console.log('Previous token balance:', currentTokenBalance);
        console.log('New token balance from database:', newTokenBalance);
        
        if (newTokenBalance !== currentTokenBalance) {
          setCurrentTokenBalance(newTokenBalance);
          setLastTokenUpdate(new Date());
          console.log('Token balance updated from', currentTokenBalance, 'to', newTokenBalance);
        } else {
          console.log('Token balance unchanged, skipping update');
        }
        
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-green-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading your dashboard...</p>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
            <p className="text-red-600 text-sm mb-6 leading-relaxed">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const handleRefresh = async () => {
    try {
      console.log('Dashboard refresh initiated...');
      setRefreshing(true);
      setError(null);
      
      await Promise.all([
        refreshCollections(),
        fetchOrders(),
        fetchWasteRequests(),
        fetchLatestUserData()
      ]);
      
      console.log('Dashboard refresh completed successfully');
    } catch (error) {
      console.error('Refresh failed:', error);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back, {user?.name}! Track your eco-friendly journey</p>
            </div>

            <div className="flex items-center gap-4">
              {/* EcoTokens Balance */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-eco-green-50 text-eco-green-700 border border-eco-green-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span>{currentTokenBalance} EcoTokens</span>
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${refreshing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-eco-green-600 hover:bg-eco-green-700 text-white shadow-sm hover:shadow-md'
                  }`}
              >
                <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-800 font-medium text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - EcoTokens & Environmental Impact */}
          <div className="lg:col-span-1 space-y-6">
            {/* EcoTokens Card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-eco-green-50 to-eco-green-100">
                <h3 className="text-lg font-semibold text-eco-green-900">Your EcoTokens</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-eco-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-eco-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-eco-green-600">{currentTokenBalance}</div>
                    <div className="text-sm text-gray-600">Available Balance</div>
                  </div>
                </div>
                {lastTokenUpdate && (
                  <div className="text-xs text-gray-500 mb-4 italic">
                    Last updated: {lastTokenUpdate.toLocaleTimeString()}
                  </div>
                )}
                <button 
                  onClick={fetchLatestUserData}
                  className="w-full bg-eco-green-600 hover:bg-eco-green-700 text-white py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Balance
                </button>
              </div>
            </div>

            {/* Environmental Impact Card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Environmental Impact</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center p-3 bg-eco-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-eco-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 104 0 2 2 0 012-2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">CO2 Saved</span>
                  </div>
                  <span className="font-bold text-eco-green-600">{environmentalImpact.co2Saved} kg</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-eco-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-eco-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">Trees Equivalent</span>
                  </div>
                  <span className="font-bold text-eco-green-600">{environmentalImpact.treesEquivalent}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-eco-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-eco-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">Water Saved</span>
                  </div>
                  <span className="font-bold text-eco-green-600">{environmentalImpact.waterSaved} L</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Requests</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{wasteRequests.length}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Weight</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {wasteRequests.reduce((sum, item) => sum + (item.collectionDetails?.weight || 0), 0).toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">kg collected</p>
                  </div>
                  <div className="h-12 w-12 bg-eco-green-50 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-eco-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l-3-9m3 9l3-9" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {wasteRequests.filter(item => item.status === 'completed').length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-eco-green-50 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-eco-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {wasteRequests.filter(item => item.status === 'requested').length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-amber-50 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Waste Collection Requests */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Waste Collection Requests</h2>
                  <Link 
                    to="/collection-request" 
                    className="bg-eco-green-600 hover:bg-eco-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    New Request
                  </Link>
                </div>
              </div>

              {wasteLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eco-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your requests...</p>
                </div>
              ) : wasteError ? (
                <div className="p-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">{wasteError}</p>
                  </div>
                </div>
              ) : wasteRequests.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No collection requests</h3>
                  <p className="text-gray-600 mb-6">Start your eco-friendly journey by submitting your first waste collection request.</p>
                  <Link 
                    to="/collection-request" 
                    className="inline-flex items-center gap-2 bg-eco-green-600 hover:bg-eco-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Submit First Request
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waste Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {wasteRequests.slice(0, 5).map(request => {
                        const estimatedTokens = request.tokenCalculation?.totalTokensIssued || 0;
                        
                        return (
                          <tr key={request._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {request.collectionId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                              {request.collectionDetails?.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {request.collectionDetails?.weight || 0} kg
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                getWasteRequestStatusClass(request.status)
                              }`}>
                                {request.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-eco-green-600">
                              {estimatedTokens}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {request.status === 'completed' && (
                                <span className="text-eco-green-600 font-medium">✅ Earned!</span>
                              )}
                              {request.status === 'requested' && (
                                <span className="text-amber-600">⏳ Waiting</span>
                              )}
                              {request.status === 'scheduled' && (
                                <span className="text-blue-600">📅 Scheduled</span>
                              )}
                              {request.status === 'in_progress' && (
                                <span className="text-purple-600">🚛 Collecting</span>
                              )}
                              {request.status === 'collected' && (
                                <span className="text-indigo-600">📦 Processing</span>
                              )}
                              {request.status === 'rejected' && (
                                <span className="text-red-600">❌ Rejected</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {wasteRequests.length > 5 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
                      <Link 
                        to="/waste-history" 
                        className="text-eco-green-600 hover:text-eco-green-700 font-medium text-sm"
                      >
                        View All {wasteRequests.length} Requests →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Orders Section */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                  <Link 
                    to="/marketplace" 
                    className="text-eco-green-600 hover:text-eco-green-700 font-medium text-sm"
                  >
                    Browse Marketplace →
                  </Link>
                </div>
              </div>

              {ordersLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eco-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your orders...</p>
                </div>
              ) : ordersError ? (
                <div className="p-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">{ordersError}</p>
                  </div>
                </div>
              ) : orders.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v5a2 2 0 002 2h2a2 2 0 002-2v-5" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-600 mb-6">Explore our eco-friendly marketplace to find sustainable products.</p>
                  <Link 
                    to="/marketplace" 
                    className="inline-flex items-center gap-2 bg-eco-green-600 hover:bg-eco-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Browse Marketplace
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens Used</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{order._id.substring(0, 8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              getOrderStatusClass(order.status)
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹{order.totalPrice}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-eco-green-600">
                            {order.totalTokenPrice}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <Link 
                                to={`/order-confirmation/${order._id}`} 
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs font-medium rounded-lg transition-colors"
                              >
                                View
                              </Link>
                              {order.trackingNumber && (
                                <Link 
                                  to={`/order-tracking/${order.trackingNumber}`} 
                                  className="bg-eco-green-500 hover:bg-eco-green-600 text-white px-3 py-1 text-xs font-medium rounded-lg transition-colors"
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
                  {orders.length > 5 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
                      <Link 
                        to="/orders" 
                        className="text-eco-green-600 hover:text-eco-green-700 font-medium text-sm"
                      >
                        View All {orders.length} Orders →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;