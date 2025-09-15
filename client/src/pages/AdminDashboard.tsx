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
import {
  BarChart3,
  Users,
  Factory,
  Recycle,
  DollarSign,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Bell,
  X,
  Leaf,
  MoreHorizontal,
  Download,
  Filter,
  Clock
} from 'lucide-react';

// Helper function to calculate payment for a collection
function calculatePayment(collection: CollectionForPayment): number {
  // Use the stored calculated amount if available, otherwise calculate
  if (collection.payment?.calculatedAmount) {
    return collection.payment.calculatedAmount;
  }
  
  // Fallback calculation: base rate per kg depending on waste type (matching backend logic)
  const COLLECTOR_PAYMENT_RATES: { [key: string]: { baseRate: number; qualityMultipliers: { [key: string]: number } } } = {
    plastic: {
      baseRate: 12,
      qualityMultipliers: {
        excellent: 1.4,
        good: 1.2,
        fair: 1.0,
        poor: 0.7
      }
    },
    paper: {
      baseRate: 8,
      qualityMultipliers: {
        excellent: 1.3,
        good: 1.1,
        fair: 1.0,
        poor: 0.6
      }
    },
    metal: {
      baseRate: 25,
      qualityMultipliers: {
        excellent: 1.5,
        good: 1.2,
        fair: 1.0,
        poor: 0.8
      }
    },
    glass: {
      baseRate: 3,
      qualityMultipliers: {
        excellent: 1.3,
        good: 1.1,
        fair: 1.0,
        poor: 0.5
      }
    },
    electronic: {
      baseRate: 35,
      qualityMultipliers: {
        excellent: 1.6,
        good: 1.3,
        fair: 1.0,
        poor: 0.7
      }
    },
    organic: {
      baseRate: 2,
      qualityMultipliers: {
        excellent: 1.2,
        good: 1.0,
        fair: 0.8,
        poor: 0.5
      }
    },
    other: {
      baseRate: 5,
      qualityMultipliers: {
        excellent: 1.2,
        good: 1.0,
        fair: 0.8,
        poor: 0.6
      }
    }
  };

  // Volume bonuses (minimum kg required)
  const volumeBonuses: { [key: number]: number } = {
    50: 1.1,   // 10% bonus for 50kg+
    100: 1.15, // 15% bonus for 100kg+
    200: 1.2   // 20% bonus for 200kg+
  };

  const type = collection.collectionDetails?.type || 'other';
  const weight = Number(collection.collectionDetails?.weight) || 0;
  const quality = collection.collectionDetails?.quality || 'fair';

  // Get base rate for waste type
  const wasteRates = COLLECTOR_PAYMENT_RATES[type] || COLLECTOR_PAYMENT_RATES.other;
  const baseRate = wasteRates.baseRate;
  const qualityMultiplier = wasteRates.qualityMultipliers[quality] || wasteRates.qualityMultipliers.fair;

  // Calculate base payment
  let basePayment = baseRate * weight * qualityMultiplier;

  // Apply volume bonus
  let volumeMultiplier = 1;
  if (weight >= 200) volumeMultiplier = volumeBonuses[200];
  else if (weight >= 100) volumeMultiplier = volumeBonuses[100];
  else if (weight >= 50) volumeMultiplier = volumeBonuses[50];

  // Calculate final payment (simplified without distance and time bonuses for frontend)
  const totalPayment = basePayment * volumeMultiplier;

  return Math.round(totalPayment * 100) / 100; // Round to 2 decimal places
}

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
              <p className="text-sm text-gray-500">Manage your EcoChain ecosystem</p>
            </div>

            <div className="flex items-center gap-4">
              {/* WebSocket Status */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isWebSocketConnected
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                {isWebSocketConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
                <span>{isWebSocketConnected ? 'Live Updates' : 'Disconnected'}</span>
              </div>

              {/* Refresh Button */}
              <button
                onClick={refreshAdminData}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${loading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md'
                  }`}
              >
                <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-5 z-50 space-y-2 max-w-sm">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className="bg-white border border-yellow-300 rounded-lg shadow-lg p-4 flex items-start gap-3"
              style={{ animation: 'slideInRight 0.3s ease-out' }}
            >
              <Bell className="text-yellow-500 mt-0.5" size={18} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{notification}</p>
              </div>
              <button
                onClick={() => setNotifications(prev => prev.filter((_, i) => i !== index))}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'payments', label: 'Pending Payments', icon: DollarSign, badge: collectionsForPayment.length },
              { id: 'history', label: 'Payment History', icon: Clock }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as 'overview' | 'payments' | 'history');
                    if (tab.id === 'overview') {
                      setTimeout(refreshAdminData, 100);
                    } else if (tab.id === 'payments') {
                      console.log('💰 Switching to Pending Payments tab');
                      setTimeout(refreshAdminData, 100);
                    } else if (tab.id === 'history') {
                      console.log('📋 Switching to Payment History tab');
                      setTimeout(() => {
                        fetchPaymentHistory();
                        fetchPaymentStats();
                      }, 100);
                    }
                  }}
                  className={`flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors relative ${activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                  {tab.badge && tab.badge > 0 && (
                    <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{systemStats.totalUsers.toLocaleString()}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Users className="text-blue-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Collectors</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{systemStats.totalCollectors}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <Recycle className="text-green-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Partner Factories</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{systemStats.totalFactories}</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Factory className="text-purple-600" size={24} />
                  </div>
                </div>
              </div>

              <div className={`rounded-xl border p-6 ${systemStats.pendingPayments > 0
                ? 'bg-amber-50 border-amber-200'
                : 'bg-white border-gray-200'
                }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                    <p className={`text-3xl font-bold mt-2 ${systemStats.pendingPayments > 0 ? 'text-amber-600' : 'text-gray-900'
                      }`}>
                      {systemStats.pendingPayments}
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${systemStats.pendingPayments > 0 ? 'bg-amber-100' : 'bg-green-50'
                    }`}>
                    {systemStats.pendingPayments > 0 ? (
                      <AlertCircle className="text-amber-600" size={24} />
                    ) : (
                      <CheckCircle className="text-green-600" size={24} />
                    )}
                  </div>
                </div>
                {systemStats.pendingPayments > 0 && (
                  <p className="text-sm text-amber-600 font-medium mt-4">Requires immediate attention</p>
                )}
              </div>
            </div>

            {/* Pending Payments Alert */}
            {collectionsForPayment.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="text-amber-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-amber-800">Payment Approvals Required</h3>
                    <p className="text-amber-700 mt-1">
                      {collectionsForPayment.length} collection{collectionsForPayment.length !== 1 ? 's' : ''} waiting for payment approval and processing.
                    </p>
                    <button
                      onClick={() => setActiveTab('payments')}
                      className="mt-3 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                    >
                      Review Payments
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Collections</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{systemStats.totalCollections}</p>
                  </div>
                  <Recycle className="text-green-600" size={24} />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed Collections</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{systemStats.completedCollections}</p>
                  </div>
                  <CheckCircle className="text-green-600" size={24} />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">EcoTokens Issued</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{systemStats.totalEcoTokensIssued.toLocaleString()}</p>
                  </div>
                  <Leaf className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            {/* Management Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Users Management */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                    <Users className="text-gray-400" size={20} />
                  </div>
                </div>
                <div className="p-6">
                  <div className="overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="pb-3">ID</th>
                          <th className="pb-3">User</th>
                          <th className="pb-3">Role</th>
                          <th className="pb-3"></th>
                        </tr>
                      </thead>
                      <tbody className="space-y-3">
                        {users.slice(0, 3).map(user => (
                          <tr key={user._id} className="border-t border-gray-100">
                            <td className="py-3">
                              <div>
                                <p className="text-gray-500 text-xs">{user._id.slice(-6)}</p>
                              </div>
                            </td>
                            <td className="py-3">
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                                <p className="text-gray-500 text-xs">{user.email}</p>
                              </div>
                            </td>
                            <td className="py-3">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                                }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="py-3">
                              <button className="text-gray-400 hover:text-gray-600">
                                <MoreHorizontal size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Factories Management */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Factory Partners</h3>
                    <Factory className="text-gray-400" size={20} />
                  </div>
                </div>
                <div className="p-6">
                  <div className="overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="pb-3">ID</th>
                          <th className="pb-3">Factory</th>
                          <th className="pb-3">Output</th>
                          <th className="pb-3"></th>
                        </tr>
                      </thead>
                      <tbody className="space-y-3">
                        {factories.slice(0, 3).map(factory => (
                          <tr key={factory._id} className="border-t border-gray-100">
                            <td className="py-3">
                              <div>
                                <p className="text-gray-500 text-xs">{factory._id.slice(-6)}</p>
                              </div>
                            </td>
                            <td className="py-3">
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{factory.name}</p>
                                <p className="text-gray-500 text-xs">{factory.email}</p>
                              </div>
                            </td>
                            <td className="py-3">
                              <div>
                                <p className="font-semibold text-green-600 text-sm">{factory.materialsProcessed} kg</p>
                                <p className="text-gray-500 text-xs">{factory.productsListed} products</p>
                              </div>
                            </td>
                            <td className="py-3">
                              <button className="text-gray-400 hover:text-gray-600">
                                <MoreHorizontal size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Collectors Management */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Top Collectors</h3>
                    <Recycle className="text-gray-400" size={20} />
                  </div>
                </div>
                <div className="p-6">
                  <div className="overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="pb-3">ID</th>
                          <th className="pb-3">Collector</th>
                          <th className="pb-3">Performance</th>
                          <th className="pb-3"></th>
                        </tr>
                      </thead>
                      <tbody className="space-y-3">
                        {collectors.slice(0, 3).map(collector => (
                          <tr key={collector._id} className="border-t border-gray-100">
                            <td className="py-3">
                              <div>
                                <p className="text-gray-500 text-xs">{collector._id.slice(-6)}</p>
                              </div>
                            </td>
                            <td className="py-3">
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{collector.name}</p>
                                <p className="text-gray-500 text-xs">{collector.email}</p>
                              </div>
                            </td>
                            <td className="py-3">
                              <div>
                                <p className="font-semibold text-green-600 text-sm">{collector.completedCollections} completed</p>
                                <p className="text-gray-500 text-xs">★ {collector.rating} ({collector.completionRate}%)</p>
                              </div>
                            </td>
                            <td className="py-3">
                              <button className="text-gray-400 hover:text-gray-600">
                                <MoreHorizontal size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {collectionsForPayment.length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Collector Payment Approvals</h3>
                      <p className="text-sm text-gray-500 mt-1">{collectionsForPayment.length} collection{collectionsForPayment.length !== 1 ? 's' : ''} pending approval</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        <Download size={16} />
                        Export
                      </button>
                      <button
                        onClick={refreshAdminData}
                        disabled={loading}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg ${loading ? 'bg-gray-100 text-gray-400' : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                      >
                        <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                        Refresh
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collector</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waste Details</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {collectionsForPayment.map(collection => {
                        const calculatedPayment = calculatePayment(collection);
                        return (
                          <tr key={collection._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-medium text-green-600 text-sm">{collection.collectionId}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-medium text-gray-900 text-sm">{collection.collectorId?.personalInfo?.name}</div>
                                <div className="text-gray-500 text-xs">{collection.collectorId?.personalInfo?.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{collection.userId?.personalInfo?.name}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900 capitalize">{collection.collectionDetails?.type}</div>
                                <div className="text-xs text-gray-500">{collection.collectionDetails?.weight} kg • {collection.collectionDetails?.quality}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-green-600">₹{calculatedPayment}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleProcessPayment(collection._id)}
                                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectCollection(collection._id)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">All Payments Current</h3>
                <p className="text-gray-500">No collector payments are pending approval at this time.</p>
              </div>
            )}
          </div>
        )}

        {/* Payment History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Payment Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Payment History</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                  <select
                    value={paymentFilters.action}
                    onChange={(e) => setPaymentFilters({ ...paymentFilters, action: e.target.value as '' | 'approved' | 'rejected' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">All Actions</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Waste Type</label>
                  <select
                    value={paymentFilters.wasteType}
                    onChange={(e) => setPaymentFilters({ ...paymentFilters, wasteType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                  <input
                    type="date"
                    value={paymentFilters.dateFrom}
                    onChange={(e) => setPaymentFilters({ ...paymentFilters, dateFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                  <input
                    type="date"
                    value={paymentFilters.dateTo}
                    onChange={(e) => setPaymentFilters({ ...paymentFilters, dateTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={fetchPaymentHistory}
                  disabled={loading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm ${loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                >
                  <Filter size={16} />
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Payment Statistics */}
            {paymentStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Payments</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{paymentStats.overview.totalPayments}</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <BarChart3 className="text-blue-600" size={24} />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Amount</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">₹{paymentStats.overview.totalAmountPaid.toLocaleString()}</p>
                    </div>
                    <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
                      <DollarSign className="text-green-600" size={24} />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Approved</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">{paymentStats.overview.approvedPayments}</p>
                    </div>
                    <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
                      <CheckCircle className="text-green-600" size={24} />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Rejected</p>
                      <p className="text-3xl font-bold text-red-600 mt-2">{paymentStats.overview.rejectedPayments}</p>
                    </div>
                    <div className="h-12 w-12 bg-red-50 rounded-lg flex items-center justify-center">
                      <AlertCircle className="text-red-600" size={24} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment History Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                  <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Download size={16} />
                    Export
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collector</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waste</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentHistory.length > 0 ? paymentHistory.map((payment) => (
                      <tr key={payment.paymentId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.processedAt
                          ? new Date(payment.processedAt).toLocaleDateString() + ' ' + new Date(payment.processedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-green-600 text-sm">{payment.collectionId}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{payment.collectorName || 'N/A'}</div>
                            <div className="text-gray-500 text-xs">{payment.collectorEmail || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{payment.userName || 'N/A'}</div>
                            <div className="text-gray-500 text-xs">{payment.userName || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 capitalize">{payment.wasteType || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{payment.weight || 0} kg</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-green-600">₹{(payment.amount || 0).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${payment.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                            }`}>
                            {payment.status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {payment.adminNotes || 'No notes'}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="text-gray-500">
                            {loading ? (
                              <div className="flex items-center justify-center gap-2">
                                <RefreshCw className="animate-spin" size={20} />
                                <span>Loading payment history...</span>
                              </div>
                            ) : (
                              <div>
                                <Clock className="mx-auto text-gray-400 mb-3" size={32} />
                                <p className="text-lg font-medium">No payment history found</p>
                                <p className="text-sm">Try adjusting your filters or check back later</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;