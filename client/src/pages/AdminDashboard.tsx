import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import adminService, { 
  CollectionForPayment, 
  AdminStats, 
  UserData, 
  CollectorData, 
  FactoryData,
  PaymentHistoryItem,
  PaymentStatistics
} from '../services/adminService.ts';
import websocketService from '../services/websocketService.ts';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [factories, setFactories] = useState<FactoryData[]>([]);
  const [collectors, setCollectors] = useState<CollectorData[]>([]);
  const [collectionsForPayment, setCollectionsForPayment] = useState<CollectionForPayment[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStatistics | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'history'>('overview');
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  
  // Add CSS for notification animation
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  const [paymentFilters, setPaymentFilters] = useState<{
    action: '' | 'approved' | 'rejected';
    wasteType: string;
    dateFrom: string;
    dateTo: string;
  }>({
    action: '',
    wasteType: '',
    dateFrom: '',
    dateTo: ''
  });
  const [systemStats, setSystemStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCollectors: 0,
    totalFactories: 0,
    totalCollections: 0,
    pendingPayments: 0,
    completedCollections: 0,
    totalEcoTokensIssued: 0
  });

  // Handle collector payment processing
  const handleProcessPayment = async (collectionId: string) => {
    try {
      const result = await adminService.processCollectorPayment(collectionId, {
        approveCollection: true,
        paymentMethod: 'digital_transfer',
        adminNotes: 'Payment approved and processed via admin dashboard'
      });
      
      if (result.success) {
        // Remove the processed collection from the list
        setCollectionsForPayment(prev => 
          prev.filter(collection => collection._id !== collectionId)
        );
        
        // Update pending payments count
        setSystemStats(prev => ({
          ...prev,
          pendingPayments: prev.pendingPayments - 1,
          completedCollections: prev.completedCollections + 1
        }));
        
        // Refresh payment history to show the new payment
        await fetchPaymentHistory();
        
        // Refresh all admin data to update counts and lists
        await refreshAdminData();
        
        const paymentInfo = result.data.collectorPayment;
        alert(`✅ Payment of ₹${paymentInfo.amount} processed successfully for ${result.data.collectorName}`);
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      alert(`❌ Failed to process payment: ${error.message}`);
    }
  };
  
  // Handle collection rejection
  const handleRejectCollection = async (collectionId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
      const result = await adminService.processCollectorPayment(collectionId, {
        approveCollection: false,
        adminNotes: reason
      });
      
      if (result.success) {
        // Remove the rejected collection from the list
        setCollectionsForPayment(prev => 
          prev.filter(collection => collection._id !== collectionId)
        );
        
        // Update pending payments count
        setSystemStats(prev => ({
          ...prev,
          pendingPayments: prev.pendingPayments - 1
        }));
        
        // Refresh payment history to show the rejection
        await fetchPaymentHistory();
        
        // Refresh all admin data to update counts and lists
        await refreshAdminData();
        
        alert(`Collection rejected: ${reason}`);
      }
    } catch (error: any) {
      console.error('Rejection error:', error);
      alert(`❌ Failed to reject collection: ${error.message}`);
    }
  };

  // Fetch payment history
  const fetchPaymentHistory = useCallback(async () => {
    try {
      console.log('🔍 Fetching payment history with filters:', paymentFilters);
      
      // Prepare filters with proper typing
      const filters: {
        page: number;
        limit: number;
        action?: 'approved' | 'rejected';
        wasteType?: string;
        dateFrom?: string;
        dateTo?: string;
      } = {
        page: 1,
        limit: 100, // Increase limit to ensure we get all records
      };
      
      // Only add action if it's a valid value
      if (paymentFilters.action === 'approved' || paymentFilters.action === 'rejected') {
        filters.action = paymentFilters.action;
      }
      
      // Add other filters if they have values
      if (paymentFilters.wasteType) {
        filters.wasteType = paymentFilters.wasteType;
      }
      if (paymentFilters.dateFrom) {
        filters.dateFrom = paymentFilters.dateFrom;
      }
      if (paymentFilters.dateTo) {
        filters.dateTo = paymentFilters.dateTo;
      }
      
      const response = await adminService.getPaymentHistory(filters);
      
      console.log('📊 Payment history response:', response);
      
      if (response.success) {
        console.log(`✅ Setting ${response.data.payments.length} payment records`);
        setPaymentHistory(response.data.payments);
      } else {
        console.warn('❌ Payment history response not successful:', response);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch payment history:', error);
      console.warn('Failed to fetch payment history:', error.message);
    }
  }, [paymentFilters]);

  // Fetch payment statistics
  const fetchPaymentStats = useCallback(async () => {
    try {
      console.log('📊 Fetching payment statistics...');
      const response = await adminService.getPaymentStatistics();
      
      console.log('📊 Payment statistics response:', response);
      
      if (response.success) {
        console.log('✅ Setting payment statistics:', response.data);
        setPaymentStats(response.data);
      } else {
        console.warn('❌ Payment statistics response not successful:', response);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch payment statistics:', error);
      console.warn('Failed to fetch payment statistics:', error.message);
    }
  }, []);

  // Refresh all admin data
  const refreshAdminData = useCallback(async () => {
    try {
      console.log('🔄 Refreshing admin dashboard data...');
      setLoading(true);
      
      // Fetch collections for payment
      try {
        console.log('Fetching collections for payment...');
        const paymentsResponse = await adminService.getCollectionsForPayment();
        console.log('Collections for payment response:', paymentsResponse);
        
        if (paymentsResponse && paymentsResponse.success && paymentsResponse.data && Array.isArray(paymentsResponse.data.collections)) {
          setCollectionsForPayment(paymentsResponse.data.collections);
        } else {
          setCollectionsForPayment([]);
        }
      } catch (paymentsError: any) {
        console.warn('Failed to fetch collections for payment:', paymentsError.message);
        setCollectionsForPayment([]);
      }
      
      // Fetch updated stats
      try {
        console.log('Fetching admin stats...');
        const statsResponse = await adminService.getAdminStats();
        console.log('Admin stats response:', statsResponse);
        
        if (statsResponse && statsResponse.success && statsResponse.data) {
          setSystemStats({
            totalUsers: statsResponse.data.totalUsers || 0,
            totalCollectors: statsResponse.data.totalCollectors || 0,
            totalFactories: statsResponse.data.totalFactories || 0,
            totalCollections: statsResponse.data.totalCollections || 0,
            pendingPayments: statsResponse.data.pendingPayments || 0,
            completedCollections: statsResponse.data.completedCollections || 0,
            totalEcoTokensIssued: statsResponse.data.totalEcoTokensIssued || 0
          });
        }
      } catch (statsError: any) {
        console.warn('Failed to fetch admin stats:', statsError.message);
      }
      
      // Fetch payment history and statistics
      await fetchPaymentHistory();
      await fetchPaymentStats();
      
      setLoading(false);
      console.log('✅ Admin dashboard data refreshed successfully');
    } catch (error: any) {
      console.error('❌ Error refreshing admin data:', error);
      setLoading(false);
    }
  }, [fetchPaymentHistory, fetchPaymentStats]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let statsData = {
          totalUsers: 0,
          totalCollectors: 0,
          totalFactories: 0,
          totalCollections: 0,
          pendingPayments: 0,
          completedCollections: 0,
          totalEcoTokensIssued: 0
        };
        let collectionsData: CollectionForPayment[] = [];
        
        try {
          // Try to fetch admin stats
          console.log('Fetching admin stats...');
          const statsResponse = await adminService.getAdminStats();
          console.log('Admin stats response:', statsResponse);
          
          if (statsResponse && statsResponse.success && statsResponse.data) {
            statsData = {
              totalUsers: statsResponse.data.totalUsers || 0,
              totalCollectors: statsResponse.data.totalCollectors || 0,
              totalFactories: statsResponse.data.totalFactories || 0,
              totalCollections: statsResponse.data.totalCollections || 0,
              pendingPayments: statsResponse.data.pendingPayments || 0,
              completedCollections: statsResponse.data.completedCollections || 0,
              totalEcoTokensIssued: statsResponse.data.totalEcoTokensIssued || 0
            };
          }
        } catch (statsError: any) {
          console.warn('Failed to fetch admin stats, using defaults:', statsError.message);
          // Use mock data when backend is not available
          statsData = {
            totalUsers: 156,
            totalCollectors: 12,
            totalFactories: 5,
            totalCollections: 89,
            pendingPayments: 3,
            completedCollections: 86,
            totalEcoTokensIssued: 12450
          };
        }
        
        try {
          // Try to fetch collections for payment
          console.log('Fetching collections for payment...');
          const paymentsResponse = await adminService.getCollectionsForPayment();
          console.log('Collections for payment response:', paymentsResponse);
          
          if (paymentsResponse && paymentsResponse.success && paymentsResponse.data && Array.isArray(paymentsResponse.data.collections)) {
            collectionsData = paymentsResponse.data.collections;
          }
        } catch (paymentsError: any) {
          console.warn('Failed to fetch collections for payment, using empty array:', paymentsError.message);
          // Mock data for demonstration when backend is not available
          collectionsData = [];
        }
        
        // Set the data regardless of API success/failure
        setSystemStats(statsData);
        setCollectionsForPayment(collectionsData);
        
        // Fetch payment history and statistics
        fetchPaymentHistory();
        fetchPaymentStats();
        
        // Fetch real users data
        try {
          console.log('Fetching real users data...');
          const usersResponse = await adminService.getAllUsers();
          console.log('Users response:', usersResponse);
          
          if (usersResponse && usersResponse.success && usersResponse.data && Array.isArray(usersResponse.data.users)) {
            setUsers(usersResponse.data.users);
          } else {
            console.warn('Invalid users response format:', usersResponse);
            setUsers([]);
          }
        } catch (usersError: any) {
          console.warn('Failed to fetch users, using empty array:', usersError.message);
          setUsers([]);
        }
        
        // Fetch real factories data
        try {
          console.log('Fetching real factories data...');
          const factoriesResponse = await adminService.getAllFactories();
          console.log('Factories response:', factoriesResponse);
          
          if (factoriesResponse && factoriesResponse.success && factoriesResponse.data && Array.isArray(factoriesResponse.data.factories)) {
            setFactories(factoriesResponse.data.factories);
          } else {
            console.warn('Invalid factories response format:', factoriesResponse);
            setFactories([]);
          }
        } catch (factoriesError: any) {
          console.warn('Failed to fetch factories, using empty array:', factoriesError.message);
          setFactories([]);
        }
        
        // Fetch real collectors data
        try {
          console.log('Fetching real collectors data...');
          const collectorsResponse = await adminService.getAllCollectors();
          console.log('Collectors response:', collectorsResponse);
          
          if (collectorsResponse && collectorsResponse.success && collectorsResponse.data && Array.isArray(collectorsResponse.data.collectors)) {
            setCollectors(collectorsResponse.data.collectors);
          } else {
            console.warn('Invalid collectors response format:', collectorsResponse);
            setCollectors([]);
          }
        } catch (collectorsError: any) {
          console.warn('Failed to fetch collectors, using empty array:', collectorsError.message);
          setCollectors([]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Critical error in fetchAdminData:', err);
        setError('Failed to load admin dashboard data. Please check if the backend server is running.');
        setLoading(false);
      }
    };

    // Check user role and load data accordingly
    if (user && user.role === 'admin') {
      fetchAdminData();
    } else {
      setError('You do not have permission to access this dashboard');
      setLoading(false);
    }
  }, [user]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (user?.role === 'admin') {
      // Connect to WebSocket for real-time updates
      websocketService.connect().then(() => {
        console.log('✅ Admin Dashboard connected to WebSocket for real-time updates');
        setIsWebSocketConnected(true);
        
        // Subscribe to garbage collection updates
        websocketService.subscribe(['garbage_collection', 'admin_payment']);
        
        // Handle collection status updates
        const handleCollectionUpdate = (message: any) => {
          console.log('📡 WebSocket: Collection update received:', message);
          
          // If a collection was marked as 'collected', refresh admin data
          if (message.changeType === 'collected' || 
              (message.data && message.data.status === 'collected')) {
            console.log('🔄 Collection marked as collected, refreshing admin data...');
            
            // Add notification
            const collectionId = message.data?.collectionId || 'Unknown';
            setNotifications(prev => [
              ...prev.slice(-4), // Keep only last 4 notifications
              `New collection ${collectionId} ready for payment approval! 💰`
            ]);
            
            // Auto-dismiss notification after 10 seconds
            setTimeout(() => {
              setNotifications(prev => prev.slice(1));
            }, 10000);
            
            setTimeout(refreshAdminData, 1000); // Small delay to ensure backend is updated
          }
          
          // If payment was processed, refresh data
          if (message.changeType === 'payment_processed' || 
              message.type === 'admin_payment') {
            console.log('🔄 Payment processed, refreshing admin data...');
            setTimeout(refreshAdminData, 1000);
          }
        };
        
        // Listen for garbage collection updates
        websocketService.on('garbage_collection', handleCollectionUpdate);
        websocketService.on('admin_payment', handleCollectionUpdate);
        
        // Cleanup on unmount
        return () => {
          websocketService.off('garbage_collection', handleCollectionUpdate);
          websocketService.off('admin_payment', handleCollectionUpdate);
        };
      }).catch(error => {
        console.warn('⚠️ Failed to connect to WebSocket for real-time updates:', error);
        setIsWebSocketConnected(false);
      });
    }
    
    return () => {
      if (websocketService.isConnectedToServer()) {
        websocketService.disconnect();
        setIsWebSocketConnected(false);
      }
    };
  }, [user, refreshAdminData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen mt-8">
        <div>Loading admin dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-8">
        <div className="text-red-700 p-3 bg-red-100 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container max-w-7xl mx-auto px-4 py-6">
      <div className="dashboard-header flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Portal</h1>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
            isWebSocketConnected ? 'bg-green-200 border border-green-300 text-green-800' : 'bg-red-200 border border-red-300 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isWebSocketConnected ? 'bg-green-500 shadow-[0_0_5px_rgba(76,175,80,0.7)] animate-pulse' : 'bg-red-500'
            }`}></div>
            <span>
              {isWebSocketConnected ? 'Live Updates ON' : 'Live Updates OFF'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Real-time Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-5 right-5 z-50">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className="bg-green-200 border border-green-300 rounded-lg p-4 mb-2 max-w-sm shadow-lg text-green-800 font-bold animate-slideInRight"
            >
              {notification}
              <button
                onClick={() => setNotifications(prev => prev.filter((_, i) => i !== index))}
                className="float-right bg-none border-none text-lg cursor-pointer text-green-800 ml-2"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Navigation Tabs */}
      <div className="mb-5 border-b border-gray-300">
        <div className="flex gap-0">
          <button
            className={`px-6 py-3 text-base font-bold border border-gray-300 rounded-t-lg transition-all ${
              activeTab === 'overview' 
                ? 'bg-blue-500 text-white border-b-2 border-b-blue-500' 
                : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => {
              setActiveTab('overview');
              // Refresh data when switching to overview
              setTimeout(refreshAdminData, 100);
            }}
          >
            📊 Overview
          </button>
          <button
            className={`px-6 py-3 text-base font-bold border border-gray-300 rounded-t-lg transition-all relative ${
              activeTab === 'payments' 
                ? 'bg-blue-500 text-white border-b-2 border-b-blue-500' 
                : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => {
              console.log('💰 Switching to Pending Payments tab');
              setActiveTab('payments');
              // Force refresh payment data when switching to this tab
              setTimeout(refreshAdminData, 100);
            }}
          >
            💰 Pending Payments 
            {collectionsForPayment.length > 0 && (
              <span className="bg-yellow-500 text-black px-1.5 py-0.5 rounded-full text-xs ml-1 absolute -top-2 -right-2">
                {collectionsForPayment.length}
              </span>
            )}
          </button>
          <button
            className={`px-6 py-3 text-base font-bold border border-gray-300 rounded-t-lg transition-all ${
              activeTab === 'history' 
                ? 'bg-blue-500 text-white border-b-2 border-b-blue-500' 
                : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => {
              console.log('📋 Switching to Payment History tab');
              setActiveTab('history');
              // Force refresh payment history when switching to this tab
              setTimeout(() => {
                fetchPaymentHistory();
                fetchPaymentStats();
              }, 100);
            }}
          >
            📋 Payment History
          </button>
        </div>
      </div>
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Refresh Button */}
          <div className="mb-4 flex justify-end">
            <button
              onClick={refreshAdminData}
              disabled={loading}
              className={`px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 ${
                loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {loading ? '🔄 Refreshing...' : '🔄 Refresh Data'}
            </button>
          </div>
          
          {/* System Overview */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
              <h3 className="text-gray-600 mb-2">Users</h3>
              <p className="text-2xl font-bold">{systemStats.totalUsers || 0}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
              <h3 className="text-gray-600 mb-2">Collectors</h3>
              <p className="text-2xl font-bold">{systemStats.totalCollectors || 0}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
              <h3 className="text-gray-600 mb-2">Factories</h3>
              <p className="text-2xl font-bold">{systemStats.totalFactories || 0}</p>
            </div>
          </section>
          
          {/* Secondary Stats */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
              <h3 className="text-gray-600 mb-2">Waste Collections</h3>
              <p className="text-2xl font-bold">{systemStats.totalCollections || 0}</p>
            </div>
            <div className={`rounded-lg p-4 shadow ${
              systemStats.pendingPayments > 0 
                ? 'bg-yellow-50 border-2 border-yellow-400' 
                : 'bg-white border border-gray-200'
            }`}>
              <h3 className={`${
                systemStats.pendingPayments > 0 ? 'text-yellow-800' : 'text-gray-600'
              } mb-2`}>
                Pending Payments
              </h3>
              <p className={`text-2xl font-bold ${
                systemStats.pendingPayments > 0 ? 'text-yellow-800' : 'text-gray-600'
              }`}>
                {systemStats.pendingPayments || 0}
              </p>
              {systemStats.pendingPayments > 0 && (
                <p className="text-sm text-yellow-800 mt-1">⚠️ Requires attention</p>
              )}
            </div>
            <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
              <h3 className="text-gray-600 mb-2">EcoTokens</h3>
              <p className="text-2xl font-bold">{(systemStats?.totalEcoTokensIssued ?? 0).toLocaleString()}</p>
            </div>
          </section>
      
      {/* Collector Payment Management - Prominent Section */}
      {collectionsForPayment.length > 0 && (
        <section id="payments" className="mt-6 bg-white p-6 rounded-xl shadow border-2 border-yellow-500">
          <div className="flex items-center mb-5">
            <div className="bg-yellow-500 text-black p-2 rounded-full mr-3 text-xl">💰</div>
            <div>
              <h2 className="m-0 text-yellow-800">Collector Payments Required</h2>
              <p className="m-1 mt-0 text-gray-600">{collectionsForPayment.length} collection{collectionsForPayment.length !== 1 ? 's' : ''} waiting for payment approval</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg overflow-hidden border border-gray-300">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-4 text-left border-b-2 border-gray-300 font-bold">Collection ID</th>
                  <th className="px-3 py-4 text-left border-b-2 border-gray-300 font-bold">Collector</th>
                  <th className="px-3 py-4 text-left border-b-2 border-gray-300 font-bold">User</th>
                  <th className="px-3 py-4 text-left border-b-2 border-gray-300 font-bold">Waste Type</th>
                  <th className="px-3 py-4 text-left border-b-2 border-gray-300 font-bold">Weight</th>
                  <th className="px-3 py-4 text-left border-b-2 border-gray-300 font-bold">Calculated Payment (₹)</th>
                  <th className="px-3 py-4 text-left border-b-2 border-gray-300 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {collectionsForPayment.map((collection) => {
                  // Calculate payment using Indian industry standards (simplified calculation here)
                  const wasteType = collection.collectionDetails?.type || 'other';
                  const weight = collection.collectionDetails?.weight || 0;
                  const quality = collection.collectionDetails?.quality || 'fair';
                  
                  // Base rates per kg in INR (simplified version)
                  const baseRates = {
                    plastic: 12,
                    paper: 8, 
                    metal: 25,
                    glass: 3,
                    electronic: 35,
                    organic: 2,
                    other: 5
                  };
                  
                  const qualityMultipliers = {
                    excellent: 1.4,
                    good: 1.2,
                    fair: 1.0,
                    poor: 0.7
                  };
                  
                  const baseRate = baseRates[wasteType] || baseRates.other;
                  const qualityMultiplier = qualityMultipliers[quality] || qualityMultipliers.fair;
                  const calculatedPayment = Math.round(baseRate * weight * qualityMultiplier);
                  
                  return (
                    <tr key={collection._id} className="bg-gray-50 hover:bg-gray-100">
                      <td className="px-3 py-4 border-b border-gray-200 font-bold text-blue-600">{collection.collectionId}</td>
                      <td className="px-3 py-4 border-b border-gray-200">
                        <div>
                          <div className="font-bold">{collection.collectorId?.personalInfo?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-600">{collection.collectorId?.personalInfo?.email || ''}</div>
                        </div>
                      </td>
                      <td className="px-3 py-4 border-b border-gray-200">
                        {collection.userId?.personalInfo?.name || 'Unknown'}
                      </td>
                      <td className="px-3 py-4 border-b border-gray-200 capitalize">
                        <div>
                          <div className="font-bold">{collection.collectionDetails?.type || 'N/A'}</div>
                          <div className="text-xs text-gray-600">Quality: {collection.collectionDetails?.quality || 'fair'}</div>
                        </div>
                      </td>
                      <td className="px-3 py-4 border-b border-gray-200 font-bold">
                        {collection.collectionDetails?.weight || 0} kg
                      </td>
                      <td className="px-3 py-4 border-b border-gray-200 font-bold text-green-600">
                        <div>
                          <div className="text-lg">₹{calculatedPayment}</div>
                          <div className="text-xs text-gray-600">@₹{baseRate}/kg × {qualityMultiplier}</div>
                        </div>
                      </td>
                      <td className="px-3 py-4 border-b border-gray-200">
                        <div className="flex gap-2">
                          <button 
                            className="px-4 py-2.5 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold shadow-md transition-all"
                            onClick={() => handleProcessPayment(collection._id)}
                          >
                            ✅ Approve & Pay
                          </button>
                          <button 
                            className="px-4 py-2.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold shadow-md transition-all"
                            onClick={() => handleRejectCollection(collection._id)}
                          >
                            ❌ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
      
      {/* No Pending Payments Message */}
      {collectionsForPayment.length === 0 && (
        <section className="mt-6 bg-green-200 p-5 rounded-lg border border-green-300">
          <div className="flex items-center">
            <div className="bg-green-500 text-white p-2 rounded-full mr-3 text-lg">✅</div>
            <div>
              <h3 className="m-0 text-green-800">All Payments Up to Date</h3>
              <p className="m-1 mt-0 text-green-800">No collector payments are pending at this time.</p>
            </div>
          </div>
        </section>
      )}
      
      <div className="features-grid mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="feature-card bg-white p-5 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">User Management</h3>
          <p className="text-gray-600 mb-4">Oversee users and roles</p>
          <div className="bg-white rounded-lg overflow-hidden shadow border border-gray-200 mt-4">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-3 text-left border-b border-gray-300">ID</th>
                  <th className="px-3 py-3 text-left border-b border-gray-300">Name</th>
                  <th className="px-3 py-3 text-left border-b border-gray-300">Email</th>
                  <th className="px-3 py-3 text-left border-b border-gray-300">Role</th>
                  <th className="px-3 py-3 text-left border-b border-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 border-b border-gray-200 text-blue-600 font-bold">{user._id.slice(-6)}</td>
                    <td className="px-3 py-3 border-b border-gray-200 font-bold">{user.name}</td>
                    <td className="px-3 py-3 border-b border-gray-200">{user.email}</td>
                    <td className="px-3 py-3 border-b border-gray-200 capitalize">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        user.role === 'admin' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-b border-gray-200">
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors">View</button>
                        <button className="px-3 py-1.5 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded transition-colors">Edit</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-5 text-center italic text-gray-600">
                      {loading ? 'Loading users...' : 'No users found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="feature-card bg-white p-5 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Factory Management</h3>
          <p className="text-gray-600 mb-4">Manage recycling facilities</p>
          <div className="bg-white rounded-lg overflow-hidden shadow border border-gray-200 mt-4">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-3 text-left border-b border-gray-300">ID</th>
                  <th className="px-3 py-3 text-left border-b border-gray-300">Name</th>
                  <th className="px-3 py-3 text-left border-b border-gray-300">Materials Processed</th>
                  <th className="px-3 py-3 text-left border-b border-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {factories.length > 0 ? factories.map((factory) => (
                  <tr key={factory._id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 border-b border-gray-200 text-blue-600 font-bold">{factory._id.slice(-6)}</td>
                    <td className="px-3 py-3 border-b border-gray-200">
                      <div>
                        <div className="font-bold">{factory.name}</div>
                        <div className="text-xs text-gray-600">{factory.email}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3 border-b border-gray-200">
                      <div className="font-bold text-green-700">{factory.materialsProcessed} kg</div>
                      <div className="text-xs text-gray-600">{factory.productsListed} products listed</div>
                    </td>
                    <td className="px-3 py-3 border-b border-gray-200">
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors">View</button>
                        <button className="px-3 py-1.5 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded transition-colors">Edit</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-5 text-center italic text-gray-600">
                      {loading ? 'Loading factories...' : 'No factories found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="feature-card bg-white p-5 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Collector Management</h3>
          <p className="text-gray-600 mb-4">Manage waste collectors</p>
          <div className="bg-white rounded-lg overflow-hidden shadow border border-gray-200 mt-4">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-3 text-left border-b border-gray-300">ID</th>
                  <th className="px-3 py-3 text-left border-b border-gray-300">Name</th>
                  <th className="px-3 py-3 text-left border-b border-gray-300">Collections</th>
                  <th className="px-3 py-3 text-left border-b border-gray-300">Rating</th>
                  <th className="px-3 py-3 text-left border-b border-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {collectors.length > 0 ? collectors.map((collector) => (
                  <tr key={collector._id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 border-b border-gray-200 text-blue-600 font-bold">{collector._id.slice(-6)}</td>
                    <td className="px-3 py-3 border-b border-gray-200">
                      <div>
                        <div className="font-bold">{collector.name}</div>
                        <div className="text-xs text-gray-600">{collector.email}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3 border-b border-gray-200">
                      <div className="font-bold text-green-700">{collector.completedCollections}</div>
                      <div className="text-xs text-gray-600">{collector.pendingCollections} pending</div>
                    </td>
                    <td className="px-3 py-3 border-b border-gray-200">
                      <div className="flex items-center gap-1">
                        <span className="text-lg">⭐</span>
                        <span className="font-bold">{collector.rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-600">({collector.completionRate}%)</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 border-b border-gray-200">
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors">View</button>
                        <button className="px-3 py-1.5 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded transition-colors">Edit</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-5 text-center italic text-gray-600">
                      {loading ? 'Loading collectors...' : 'No collectors found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="feature-card bg-white p-5 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Analytics</h3>
          <p className="text-gray-600">Business intelligence</p>
        </div>
        <div className="feature-card bg-white p-5 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Configuration</h3>
          <p className="text-gray-600">System and rules</p>
        </div>
      </div>
        </>
      )}
      
      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <>
          {/* Refresh Button */}
          <div className="mb-4 flex justify-end">
            <button
              onClick={refreshAdminData}
              disabled={loading}
              className={`px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 ${
                loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {loading ? '🔄 Refreshing...' : '🔄 Refresh Payments'}
            </button>
          </div>
          
          {/* Alert for Pending Payments */}
          {collectionsForPayment.length > 0 && (
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-5 flex items-center shadow-md">
              <div className="text-xl mr-3">⚠️</div>
              <div>
                <strong className="text-yellow-800">Action Required: </strong>
                <span className="text-yellow-800">
                  {collectionsForPayment.length} collector payment{collectionsForPayment.length !== 1 ? 's' : ''} waiting for approval.
                </span>
              </div>
            </div>
          )}
          
          {/* Collector Payment Management - Prominent Section */}
          {collectionsForPayment.length > 0 && (
            <section className="bg-white p-6 rounded-xl shadow border-2 border-yellow-500">
              <div className="flex items-center mb-5">
                <div className="bg-yellow-500 text-black p-2 rounded-full mr-3 text-xl">💰</div>
                <div>
                  <h2 className="m-0 text-yellow-800">Collector Payments Required</h2>
                  <p className="m-1 mt-0 text-gray-600">{collectionsForPayment.length} collection{collectionsForPayment.length !== 1 ? 's' : ''} waiting for payment approval</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg overflow-hidden border border-gray-300">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-4 text-left border-b-2 border-gray-300 font-bold">Collection ID</th>
                      <th className="px-3 py-4 text-left border-b-2 border-gray-300 font-bold">Collector</th>
                      <th className="px-3 py-4 text-left border-b-2 border-gray-300 font-bold">User</th>
                      <th className="px-3 py-4 text-left border-b-2 border-gray-300 font-bold">Waste Type</th>
                      <th className="px-3 py-4 text-left border-b-2 border-gray-300 font-bold">Weight</th>
                      <th className="px-3 py-4 text-left border-b-2 border-gray-300 font-bold">Calculated Payment (₹)</th>
                      <th className="px-3 py-4 text-left border-b-2 border-gray-300 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collectionsForPayment.map((collection) => {
                      // Calculate payment using Indian industry standards (simplified calculation here)
                      const wasteType = collection.collectionDetails?.type || 'other';
                      const weight = collection.collectionDetails?.weight || 0;
                      const quality = collection.collectionDetails?.quality || 'fair';
                      
                      // Base rates per kg in INR (simplified version)
                      const baseRates = {
                        plastic: 12,
                        paper: 8, 
                        metal: 25,
                        glass: 3,
                        electronic: 35,
                        organic: 2,
                        other: 5
                      };
                      
                      const qualityMultipliers = {
                        excellent: 1.4,
                        good: 1.2,
                        fair: 1.0,
                        poor: 0.7
                      };
                      
                      const baseRate = baseRates[wasteType] || baseRates.other;
                      const qualityMultiplier = qualityMultipliers[quality] || qualityMultipliers.fair;
                      const calculatedPayment = Math.round(baseRate * weight * qualityMultiplier);
                      
                      return (
                        <tr key={collection._id} className="bg-gray-50 hover:bg-gray-100">
                          <td className="px-3 py-4 border-b border-gray-200 font-bold text-blue-600">{collection.collectionId}</td>
                          <td className="px-3 py-4 border-b border-gray-200">
                            <div>
                              <div className="font-bold">{collection.collectorId?.personalInfo?.name || 'Unknown'}</div>
                              <div className="text-xs text-gray-600">{collection.collectorId?.personalInfo?.email || ''}</div>
                            </div>
                          </td>
                          <td className="px-3 py-4 border-b border-gray-200">
                            {collection.userId?.personalInfo?.name || 'Unknown'}
                          </td>
                          <td className="px-3 py-4 border-b border-gray-200 capitalize">
                            <div>
                              <div className="font-bold">{collection.collectionDetails?.type || 'N/A'}</div>
                              <div className="text-xs text-gray-600">Quality: {collection.collectionDetails?.quality || 'fair'}</div>
                            </div>
                          </td>
                          <td className="px-3 py-4 border-b border-gray-200 font-bold">
                            {collection.collectionDetails?.weight || 0} kg
                          </td>
                          <td className="px-3 py-4 border-b border-gray-200 font-bold text-green-600">
                            <div>
                              <div className="text-lg">₹{calculatedPayment}</div>
                              <div className="text-xs text-gray-600">@₹{baseRate}/kg × {qualityMultiplier}</div>
                            </div>
                          </td>
                          <td className="px-3 py-4 border-b border-gray-200">
                            <div className="flex gap-2">
                              <button 
                                className="px-4 py-2.5 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold shadow-md transition-all"
                                onClick={() => handleProcessPayment(collection._id)}
                              >
                                ✅ Approve & Pay
                              </button>
                              <button 
                                className="px-4 py-2.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold shadow-md transition-all"
                                onClick={() => handleRejectCollection(collection._id)}
                              >
                                ❌ Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          
          {/* No Pending Payments Message */}
          {collectionsForPayment.length === 0 && (
            <section className="bg-green-200 p-5 rounded-lg border border-green-300">
              <div className="flex items-center">
                <div className="bg-green-500 text-white p-2 rounded-full mr-3 text-lg">✅</div>
                <div>
                  <h3 className="m-0 text-green-800">All Payments Up to Date</h3>
                  <p className="m-1 mt-0 text-green-800">No collector payments are pending at this time.</p>
                </div>
              </div>
            </section>
          )}
        </>
      )}
      
      {/* Payment History Tab */}
      {activeTab === 'history' && (
        <>
          {/* Payment History Filters */}
          <div className="bg-white rounded-lg p-5 shadow border border-gray-200 mb-5">
            <h3 className="text-lg font-semibold mb-4">Filter Payment History</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <select
                  value={paymentFilters.action}
                  onChange={(e) => setPaymentFilters({...paymentFilters, action: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">All Actions</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Waste Type</label>
                <select
                  value={paymentFilters.wasteType}
                  onChange={(e) => setPaymentFilters({...paymentFilters, wasteType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">All Types</option>
                  <option value="plastic">Plastic</option>
                  <option value="paper">Paper</option>
                  <option value="metal">Metal</option>
                  <option value="glass">Glass</option>
                  <option value="electronic">Electronic</option>
                  <option value="organic">Organic</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={paymentFilters.dateFrom}
                  onChange={(e) => setPaymentFilters({...paymentFilters, dateFrom: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={paymentFilters.dateTo}
                  onChange={(e) => setPaymentFilters({...paymentFilters, dateTo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={fetchPaymentHistory}
                disabled={loading}
                className={`px-4 py-2 rounded-md font-medium ${
                  loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                Apply Filters
              </button>
            </div>
          </div>
          
          {/* Payment Statistics */}
          {paymentStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
                <h3 className="text-gray-600 mb-2">Total Payments</h3>
                <p className="text-2xl font-bold">{paymentStats.totalPayments}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
                <h3 className="text-gray-600 mb-2">Total Amount</h3>
                <p className="text-2xl font-bold">₹{(paymentStats?.totalAmount ?? 0).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
                <h3 className="text-gray-600 mb-2">Approved Payments</h3>
                <p className="text-2xl font-bold text-green-600">{paymentStats.approvedPayments}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
                <h3 className="text-gray-600 mb-2">Rejected Payments</h3>
                <p className="text-2xl font-bold text-red-600">{paymentStats.rejectedPayments}</p>
              </div>
            </div>
          )}
          
          {/* Payment History Table */}
          <div className="bg-white rounded-lg overflow-hidden shadow border border-gray-200">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Payment History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-3 text-left border-b border-gray-300 font-bold">Date</th>
                    <th className="px-3 py-3 text-left border-b border-gray-300 font-bold">Collection ID</th>
                    <th className="px-3 py-3 text-left border-b border-gray-300 font-bold">Collector</th>
                    <th className="px-3 py-3 text-left border-b border-gray-300 font-bold">User</th>
                    <th className="px-3 py-3 text-left border-b border-gray-300 font-bold">Waste Type</th>
                    <th className="px-3 py-3 text-left border-b border-gray-300 font-bold">Weight</th>
                    <th className="px-3 py-3 text-left border-b border-gray-300 font-bold">Amount (₹)</th>
                    <th className="px-3 py-3 text-left border-b border-gray-300 font-bold">Status</th>
                    <th className="px-3 py-3 text-left border-b border-gray-300 font-bold">Admin Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.length > 0 ? paymentHistory.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 border-b border-gray-200">
                        {payment.timestamp ? new Date(payment.timestamp).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-3 py-3 border-b border-gray-200 font-bold text-blue-600">
                        {payment.collectionId}
                      </td>
                      <td className="px-3 py-3 border-b border-gray-200">
                        <div>
                          <div className="font-bold">{payment.collectorName || 'N/A'}</div>
                          <div className="text-xs text-gray-600">{payment.collectorEmail || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-200">
                        <div>
                          <div className="font-bold">{payment.userName || 'N/A'}</div>
                          <div className="text-xs text-gray-600">{payment.userEmail || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-200 capitalize">
                        {payment.wasteType || 'N/A'}
                      </td>
                      <td className="px-3 py-3 border-b border-gray-200 font-bold">
                        {(payment.weight || 0)} kg
                      </td>
                      <td className="px-3 py-3 border-b border-gray-200 font-bold text-green-600">
                        ₹{(payment?.amount ?? 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-3 border-b border-gray-200">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          payment.status === 'approved' 
                            ? 'bg-green-200 text-green-800' 
                            : payment.status === 'rejected' 
                              ? 'bg-red-200 text-red-800' 
                              : 'bg-gray-200 text-gray-800'
                        }`}>
                          {payment.status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-200 text-sm">
                        {payment.adminNotes || 'No notes'}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={9} className="px-5 py-5 text-center italic text-gray-600">
                        {loading ? 'Loading payment history...' : 'No payment history found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;