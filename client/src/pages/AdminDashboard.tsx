import React, { useState, useEffect, useCallback } from 'react';
import '../App.css';
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
      <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading admin dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ margin: '32px' }}>
        <div style={{ color: 'red', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Admin Portal</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '20px',
            backgroundColor: isWebSocketConnected ? '#d4edda' : '#f8d7da',
            border: `1px solid ${isWebSocketConnected ? '#c3e6cb' : '#f5c6cb'}`,
            fontSize: '0.875rem'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isWebSocketConnected ? '#28a745' : '#dc3545'
            }}></div>
            <span style={{ color: isWebSocketConnected ? '#155724' : '#721c24', fontWeight: 'bold' }}>
              {isWebSocketConnected ? 'Live Updates ON' : 'Live Updates OFF'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Real-time Notifications */}
      {notifications.length > 0 && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
          {notifications.map((notification, index) => (
            <div
              key={index}
              style={{
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '8px',
                maxWidth: '350px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                color: '#155724',
                fontWeight: 'bold',
                animation: 'slideInRight 0.3s ease-out'
              }}
            >
              {notification}
              <button
                onClick={() => setNotifications(prev => prev.filter((_, i) => i !== index))}
                style={{
                  float: 'right',
                  background: 'none',
                  border: 'none',
                  fontSize: '16px',
                  cursor: 'pointer',
                  color: '#155724',
                  marginLeft: '8px'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Navigation Tabs */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <div style={{ display: 'flex', gap: '0' }}>
          <button
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: 'bold',
              backgroundColor: activeTab === 'overview' ? '#2196F3' : '#f8f9fa',
              color: activeTab === 'overview' ? 'white' : '#495057',
              border: '1px solid #ddd',
              borderBottom: activeTab === 'overview' ? '2px solid #2196F3' : '1px solid #ddd',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={() => {
              setActiveTab('overview');
              // Refresh data when switching to overview
              setTimeout(refreshAdminData, 100);
            }}
          >
            📊 Overview
          </button>
          <button
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: 'bold',
              backgroundColor: activeTab === 'payments' ? '#2196F3' : '#f8f9fa',
              color: activeTab === 'payments' ? 'white' : '#495057',
              border: '1px solid #ddd',
              borderBottom: activeTab === 'payments' ? '2px solid #2196F3' : '1px solid #ddd',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={() => {
              console.log('💰 Switching to Pending Payments tab');
              setActiveTab('payments');
              // Force refresh payment data when switching to this tab
              setTimeout(refreshAdminData, 100);
            }}
          >
            💰 Pending Payments {collectionsForPayment.length > 0 && <span style={{backgroundColor: '#ffc107', color: '#000', padding: '2px 6px', borderRadius: '10px', fontSize: '0.75rem', marginLeft: '4px'}}>{collectionsForPayment.length}</span>}
          </button>
          <button
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: 'bold',
              backgroundColor: activeTab === 'history' ? '#2196F3' : '#f8f9fa',
              color: activeTab === 'history' ? 'white' : '#495057',
              border: '1px solid #ddd',
              borderBottom: activeTab === 'history' ? '2px solid #2196F3' : '1px solid #ddd',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
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
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={refreshAdminData}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: loading ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {loading ? '🔄 Refreshing...' : '🔄 Refresh Data'}
            </button>
          </div>
          
          {/* System Overview */}
          <section className="stats-section" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'16px'}}>
            <div className="stat-card"><h3>Users</h3><p>{systemStats.totalUsers || 0}</p></div>
            <div className="stat-card"><h3>Collectors</h3><p>{systemStats.totalCollectors || 0}</p></div>
            <div className="stat-card"><h3>Factories</h3><p>{systemStats.totalFactories || 0}</p></div>
          </section>
          
          {/* Secondary Stats */}
          <section className="stats-section" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'16px', marginTop: '16px'}}>
            <div className="stat-card"><h3>Waste Collections</h3><p>{systemStats.totalCollections || 0}</p></div>
            <div className="stat-card" style={{backgroundColor: systemStats.pendingPayments > 0 ? '#fff3cd' : '#f8f9fa', border: systemStats.pendingPayments > 0 ? '2px solid #ffc107' : '1px solid #dee2e6'}}>
              <h3 style={{color: systemStats.pendingPayments > 0 ? '#856404' : '#495057'}}>Pending Payments</h3>
              <p style={{color: systemStats.pendingPayments > 0 ? '#856404' : '#495057', fontSize: '2rem', fontWeight: 'bold'}}>{systemStats.pendingPayments || 0}</p>
              {systemStats.pendingPayments > 0 && (
                <p style={{fontSize: '0.875rem', color: '#856404', margin: '4px 0 0 0'}}>⚠️ Requires attention</p>
              )}
            </div>
            <div className="stat-card"><h3>EcoTokens</h3><p>{(systemStats.totalEcoTokensIssued || 0).toLocaleString()}</p></div>
          </section>
      
      {/* Collector Payment Management - Prominent Section */}
      {collectionsForPayment.length > 0 && (
        <section id="payments" style={{marginTop: '24px', backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '2px solid #ffc107'}}>
          <div style={{display: 'flex', alignItems: 'center', marginBottom: '20px'}}>
            <div style={{backgroundColor: '#ffc107', color: '#000', padding: '8px', borderRadius: '50%', marginRight: '12px', fontSize: '1.5rem'}}>💰</div>
            <div>
              <h2 style={{margin: 0, color: '#856404'}}>Collector Payments Required</h2>
              <p style={{margin: '4px 0 0 0', color: '#666'}}>{collectionsForPayment.length} collection{collectionsForPayment.length !== 1 ? 's' : ''} waiting for payment approval</p>
            </div>
          </div>
          
          <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Collection ID</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Collector</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>User</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Waste Type</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Weight</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Calculated Payment (₹)</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Actions</th>
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
                    <tr key={collection._id} style={{backgroundColor: '#fefefe'}}>
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#0066cc' }}>{collection.collectionId}</td>
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid #eee' }}>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{collection.collectorId?.personalInfo?.name || 'Unknown'}</div>
                          <div style={{ fontSize: '0.875rem', color: '#666' }}>{collection.collectorId?.personalInfo?.email || ''}</div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid #eee' }}>
                        {collection.userId?.personalInfo?.name || 'Unknown'}
                      </td>
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid #eee', textTransform: 'capitalize' }}>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{collection.collectionDetails?.type || 'N/A'}</div>
                          <div style={{ fontSize: '0.875rem', color: '#666' }}>Quality: {collection.collectionDetails?.quality || 'fair'}</div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                        {collection.collectionDetails?.weight || 0} kg
                      </td>
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#28a745' }}>
                        <div>
                          <div style={{ fontSize: '1.1rem' }}>₹{calculatedPayment}</div>
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>@₹{baseRate}/kg × {qualityMultiplier}</div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid #eee' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            style={{ 
                              padding: '10px 16px', 
                              fontSize: '0.875rem', 
                              backgroundColor: '#28a745', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '6px', 
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              boxShadow: '0 2px 4px rgba(40, 167, 69, 0.3)',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => handleProcessPayment(collection._id)}
                            onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#218838'}
                            onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#28a745'}
                          >
                            ✅ Approve & Pay
                          </button>
                          <button 
                            style={{ 
                              padding: '10px 16px', 
                              fontSize: '0.875rem', 
                              backgroundColor: '#dc3545', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '6px', 
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              boxShadow: '0 2px 4px rgba(220, 53, 69, 0.3)',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => handleRejectCollection(collection._id)}
                            onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#c82333'}
                            onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#dc3545'}
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
        <section style={{marginTop: '24px', backgroundColor: '#d4edda', padding: '20px', borderRadius: '8px', border: '1px solid #c3e6cb'}}>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <div style={{backgroundColor: '#28a745', color: '#fff', padding: '8px', borderRadius: '50%', marginRight: '12px', fontSize: '1.2rem'}}>✅</div>
            <div>
              <h3 style={{margin: 0, color: '#155724'}}>All Payments Up to Date</h3>
              <p style={{margin: '4px 0 0 0', color: '#155724'}}>No collector payments are pending at this time.</p>
            </div>
          </div>
        </section>
      )}
      
      <div className="features-grid" style={{marginTop:16}}>
        <div className="feature-card">
          <h3>User Management</h3>
          <p>Oversee users and roles</p>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginTop: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f5f5f5' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Role</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? users.map((user) => (
                  <tr key={user._id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee', color: '#0066cc', fontWeight: 'bold' }}>{user._id.slice(-6)}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{user.name}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{user.email}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee', textTransform: 'capitalize' }}>
                      <span style={{ 
                        backgroundColor: user.role === 'admin' ? '#ff9800' : '#4caf50', 
                        color: 'white', 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={{ 
                          padding: '6px 12px', 
                          fontSize: '0.875rem', 
                          backgroundColor: '#1976d2', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px', 
                          cursor: 'pointer' 
                        }}>View</button>
                        <button style={{ 
                          padding: '6px 12px', 
                          fontSize: '0.875rem', 
                          backgroundColor: '#ff9800', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px', 
                          cursor: 'pointer' 
                        }}>Edit</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '20px', textAlign: 'center', fontStyle: 'italic', color: '#666' }}>
                      {loading ? 'Loading users...' : 'No users found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="feature-card">
          <h3>Factory Management</h3>
          <p>Manage recycling facilities</p>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginTop: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f5f5f5' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Materials Processed</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {factories.length > 0 ? factories.map((factory) => (
                  <tr key={factory._id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee', color: '#0066cc', fontWeight: 'bold' }}>{factory._id.slice(-6)}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{factory.name}</div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>{factory.email}</div>
                      </div>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <div style={{ fontWeight: 'bold', color: '#2e7d32' }}>{factory.materialsProcessed} kg</div>
                      <div style={{ fontSize: '0.875rem', color: '#666' }}>{factory.productsListed} products listed</div>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={{ 
                          padding: '6px 12px', 
                          fontSize: '0.875rem', 
                          backgroundColor: '#1976d2', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px', 
                          cursor: 'pointer' 
                        }}>View</button>
                        <button style={{ 
                          padding: '6px 12px', 
                          fontSize: '0.875rem', 
                          backgroundColor: '#ff9800', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px', 
                          cursor: 'pointer' 
                        }}>Edit</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} style={{ padding: '20px', textAlign: 'center', fontStyle: 'italic', color: '#666' }}>
                      {loading ? 'Loading factories...' : 'No factories found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="feature-card">
          <h3>Collector Management</h3>
          <p>Manage waste collectors</p>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginTop: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f5f5f5' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Collections</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Rating</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {collectors.length > 0 ? collectors.map((collector) => (
                  <tr key={collector._id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee', color: '#0066cc', fontWeight: 'bold' }}>{collector._id.slice(-6)}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{collector.name}</div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>{collector.email}</div>
                      </div>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <div style={{ fontWeight: 'bold', color: '#2e7d32' }}>{collector.completedCollections}</div>
                      <div style={{ fontSize: '0.875rem', color: '#666' }}>{collector.pendingCollections} pending</div>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '1.2rem' }}>⭐</span>
                        <span style={{ fontWeight: 'bold' }}>{collector.rating.toFixed(1)}</span>
                        <span style={{ fontSize: '0.875rem', color: '#666' }}>({collector.completionRate}%)</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={{ 
                          padding: '6px 12px', 
                          fontSize: '0.875rem', 
                          backgroundColor: '#1976d2', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px', 
                          cursor: 'pointer' 
                        }}>View</button>
                        <button style={{ 
                          padding: '6px 12px', 
                          fontSize: '0.875rem', 
                          backgroundColor: '#ff9800', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px', 
                          cursor: 'pointer' 
                        }}>Edit</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '20px', textAlign: 'center', fontStyle: 'italic', color: '#666' }}>
                      {loading ? 'Loading collectors...' : 'No collectors found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="feature-card"><h3>Analytics</h3><p>Business intelligence</p></div>
        <div className="feature-card"><h3>Configuration</h3><p>System and rules</p></div>
      </div>
        </>
      )}
      
      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <>
          {/* Refresh Button */}
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={refreshAdminData}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: loading ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {loading ? '🔄 Refreshing...' : '🔄 Refresh Payments'}
            </button>
          </div>
          
          {/* Alert for Pending Payments */}
          {collectionsForPayment.length > 0 && (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 2px 4px rgba(255, 193, 7, 0.3)'
            }}>
              <div style={{ fontSize: '1.5rem', marginRight: '12px' }}>⚠️</div>
              <div>
                <strong style={{ color: '#856404' }}>Action Required: </strong>
                <span style={{ color: '#856404' }}>
                  {collectionsForPayment.length} collector payment{collectionsForPayment.length !== 1 ? 's' : ''} waiting for approval.
                </span>
              </div>
            </div>
          )}
          
          {/* Collector Payment Management - Prominent Section */}
          {collectionsForPayment.length > 0 && (
            <section style={{backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '2px solid #ffc107'}}>
              <div style={{display: 'flex', alignItems: 'center', marginBottom: '20px'}}>
                <div style={{backgroundColor: '#ffc107', color: '#000', padding: '8px', borderRadius: '50%', marginRight: '12px', fontSize: '1.5rem'}}>💰</div>
                <div>
                  <h2 style={{margin: 0, color: '#856404'}}>Collector Payments Required</h2>
                  <p style={{margin: '4px 0 0 0', color: '#666'}}>{collectionsForPayment.length} collection{collectionsForPayment.length !== 1 ? 's' : ''} waiting for payment approval</p>
                </div>
              </div>
              
              <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                      <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Collection ID</th>
                      <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Collector</th>
                      <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>User</th>
                      <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Waste Type</th>
                      <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Weight</th>
                      <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Calculated Payment (₹)</th>
                      <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Actions</th>
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
                        <tr key={collection._id} style={{backgroundColor: '#fefefe'}}>
                          <td style={{ padding: '16px 12px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#0066cc' }}>{collection.collectionId}</td>
                          <td style={{ padding: '16px 12px', borderBottom: '1px solid #eee' }}>
                            <div>
                              <div style={{ fontWeight: 'bold' }}>{collection.collectorId?.personalInfo?.name || 'Unknown'}</div>
                              <div style={{ fontSize: '0.875rem', color: '#666' }}>{collection.collectorId?.personalInfo?.email || ''}</div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 12px', borderBottom: '1px solid #eee' }}>
                            {collection.userId?.personalInfo?.name || 'Unknown'}
                          </td>
                          <td style={{ padding: '16px 12px', borderBottom: '1px solid #eee', textTransform: 'capitalize' }}>
                            <div>
                              <div style={{ fontWeight: 'bold' }}>{collection.collectionDetails?.type || 'N/A'}</div>
                              <div style={{ fontSize: '0.875rem', color: '#666' }}>Quality: {collection.collectionDetails?.quality || 'fair'}</div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 12px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                            {collection.collectionDetails?.weight || 0} kg
                          </td>
                          <td style={{ padding: '16px 12px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#28a745' }}>
                            <div>
                              <div style={{ fontSize: '1.1rem' }}>₹{calculatedPayment}</div>
                              <div style={{ fontSize: '0.75rem', color: '#666' }}>@₹{baseRate}/kg × {qualityMultiplier}</div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 12px', borderBottom: '1px solid #eee' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                style={{ 
                                  padding: '10px 16px', 
                                  fontSize: '0.875rem', 
                                  backgroundColor: '#28a745', 
                                  color: 'white', 
                                  border: 'none', 
                                  borderRadius: '6px', 
                                  cursor: 'pointer',
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 4px rgba(40, 167, 69, 0.3)',
                                  transition: 'all 0.2s'
                                }}
                                onClick={() => handleProcessPayment(collection._id)}
                                onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#218838'}
                                onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#28a745'}
                              >
                                ✅ Approve & Pay
                              </button>
                              <button 
                                style={{ 
                                  padding: '10px 16px', 
                                  fontSize: '0.875rem', 
                                  backgroundColor: '#dc3545', 
                                  color: 'white', 
                                  border: 'none', 
                                  borderRadius: '6px', 
                                  cursor: 'pointer',
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 4px rgba(220, 53, 69, 0.3)',
                                  transition: 'all 0.2s'
                                }}
                                onClick={() => handleRejectCollection(collection._id)}
                                onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#c82333'}
                                onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#dc3545'}
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
            <section style={{backgroundColor: '#d4edda', padding: '20px', borderRadius: '8px', border: '1px solid #c3e6cb'}}>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <div style={{backgroundColor: '#28a745', color: '#fff', padding: '8px', borderRadius: '50%', marginRight: '12px', fontSize: '1.2rem'}}>✅</div>
                <div>
                  <h3 style={{margin: 0, color: '#155724'}}>All Payments Up to Date</h3>
                  <p style={{margin: '4px 0 0 0', color: '#155724'}}>No collector payments are pending at this time.</p>
                </div>
              </div>
            </section>
          )}
        </>
      )}
      
      {/* Payment History Tab */}
      {activeTab === 'history' && (
        <>
          {/* Payment Statistics */}
          {paymentStats && (
            <section style={{marginBottom: '24px'}}>
              <h2 style={{marginBottom: '16px', color: '#495057'}}>📊 Payment Statistics</h2>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'16px', marginBottom: '20px'}}>
                <div className="stat-card">
                  <h3>Total Payments</h3>
                  <p style={{fontSize: '2rem', fontWeight: 'bold', color: '#2196F3'}}>{paymentStats.overview.totalPayments}</p>
                </div>
                <div className="stat-card" style={{backgroundColor: '#e8f5e8'}}>
                  <h3>Approved</h3>
                  <p style={{fontSize: '2rem', fontWeight: 'bold', color: '#28a745'}}>{paymentStats.overview.approvedPayments}</p>
                </div>
                <div className="stat-card" style={{backgroundColor: '#ffeaa7'}}>
                  <h3>Rejected</h3>
                  <p style={{fontSize: '2rem', fontWeight: 'bold', color: '#dc3545'}}>{paymentStats.overview.rejectedPayments}</p>
                </div>
                <div className="stat-card" style={{backgroundColor: '#e3f2fd'}}>
                  <h3>Total Amount Paid</h3>
                  <p style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#1976d2'}}>₹{paymentStats.overview.totalAmountPaid.toLocaleString()}</p>
                </div>
              </div>
            </section>
          )}
          
          {/* Filters */}
          <section style={{backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px'}}>
            <h3 style={{margin: '0 0 16px 0', color: '#495057'}}>🔍 Filter Payment History</h3>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '4px', fontWeight: 'bold', color: '#495057'}}>Action</label>
                <select 
                  value={paymentFilters.action} 
                  onChange={(e) => setPaymentFilters(prev => ({...prev, action: e.target.value as '' | 'approved' | 'rejected'}))}
                  style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
                >
                  <option value="">All Actions</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '4px', fontWeight: 'bold', color: '#495057'}}>Waste Type</label>
                <select 
                  value={paymentFilters.wasteType} 
                  onChange={(e) => setPaymentFilters(prev => ({...prev, wasteType: e.target.value}))}
                  style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
                >
                  <option value="">All Types</option>
                  <option value="plastic">Plastic</option>
                  <option value="paper">Paper</option>
                  <option value="metal">Metal</option>
                  <option value="glass">Glass</option>
                  <option value="electronic">Electronic</option>
                  <option value="organic">Organic</option>
                </select>
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '4px', fontWeight: 'bold', color: '#495057'}}>Date From</label>
                <input 
                  type="date" 
                  value={paymentFilters.dateFrom} 
                  onChange={(e) => setPaymentFilters(prev => ({...prev, dateFrom: e.target.value}))}
                  style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
                />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '4px', fontWeight: 'bold', color: '#495057'}}>Date To</label>
                <input 
                  type="date" 
                  value={paymentFilters.dateTo} 
                  onChange={(e) => setPaymentFilters(prev => ({...prev, dateTo: e.target.value}))}
                  style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
                />
              </div>
            </div>
            <div style={{marginTop: '16px', display: 'flex', gap: '8px'}}>
              <button 
                onClick={fetchPaymentHistory}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🔍 Apply Filters
              </button>
              <button 
                onClick={() => {
                  setPaymentFilters({ action: '', wasteType: '', dateFrom: '', dateTo: '' } as {
                    action: '' | 'approved' | 'rejected';
                    wasteType: string;
                    dateFrom: string;
                    dateTo: string;
                  });
                  fetchPaymentHistory();
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🔄 Clear Filters
              </button>
            </div>
          </section>
          
          {/* Payment History Table */}
          <section style={{backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
            <h2 style={{margin: '0 0 20px 0', color: '#495057'}}>📋 Payment History</h2>
            
            {paymentHistory.length > 0 ? (
              <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                      <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Payment ID</th>
                      <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Collection</th>
                      <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Collector</th>
                      <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Action</th>
                      <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Amount</th>
                      <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Waste Details</th>
                      <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Processed Date</th>
                      <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((payment) => (
                      <tr key={payment.paymentId} style={{backgroundColor: '#fefefe'}}>
                        <td style={{ padding: '16px 12px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#0066cc', fontSize: '0.875rem' }}>
                          {payment.paymentId}
                        </td>
                        <td style={{ padding: '16px 12px', borderBottom: '1px solid #eee' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#0066cc' }}>{payment.collectionId}</div>
                            <div style={{ fontSize: '0.875rem', color: '#666' }}>{payment.userName}</div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px', borderBottom: '1px solid #eee' }}>
                          <div>
                            <div style={{ fontWeight: 'bold' }}>{payment.collectorName}</div>
                            <div style={{ fontSize: '0.875rem', color: '#666' }}>{payment.collectorEmail}</div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px', borderBottom: '1px solid #eee' }}>
                          <span style={{
                            backgroundColor: payment.action === 'approved' ? '#28a745' : '#dc3545',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                          }}>
                            {payment.action === 'approved' ? '✅ Approved' : '❌ Rejected'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 12px', borderBottom: '1px solid #eee' }}>
                          {payment.action === 'approved' && payment.amount ? (
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#28a745', fontSize: '1.1rem' }}>₹{payment.amount}</div>
                              <div style={{ fontSize: '0.75rem', color: '#666' }}>{payment.paymentMethod || 'Digital Transfer'}</div>
                            </div>
                          ) : (
                            <span style={{ color: '#666', fontStyle: 'italic' }}>N/A</span>
                          )}
                        </td>
                        <td style={{ padding: '16px 12px', borderBottom: '1px solid #eee' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{payment.wasteType}</div>
                            <div style={{ fontSize: '0.875rem', color: '#666' }}>{payment.weight}kg - {payment.quality} quality</div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px', borderBottom: '1px solid #eee' }}>
                          <div style={{ fontSize: '0.875rem' }}>
                            {new Date(payment.processedAt).toLocaleDateString('en-IN')}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>
                            {new Date(payment.processedAt).toLocaleTimeString('en-IN')}
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px', borderBottom: '1px solid #eee', maxWidth: '200px' }}>
                          <div style={{ fontSize: '0.875rem', color: '#666', wordWrap: 'break-word' }}>
                            {payment.action === 'approved' ? payment.adminNotes : payment.rejectionReason}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📄</div>
                <h3 style={{ color: '#666' }}>No Payment History Found</h3>
                <p>No payment records match your current filters.</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

