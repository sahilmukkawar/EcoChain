import React, { useState, useEffect } from 'react';
import '../App.css';
import { useAuth } from '../context/AuthContext.tsx';
import adminService, { CollectionForPayment, AdminStats, UserData, CollectorData, FactoryData } from '../services/adminService.ts';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [factories, setFactories] = useState<FactoryData[]>([]);
  const [collectors, setCollectors] = useState<CollectorData[]>([]);
  const [collectionsForPayment, setCollectionsForPayment] = useState<CollectionForPayment[]>([]);
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
        
        alert(`Collection rejected: ${reason}`);
      }
    } catch (error: any) {
      console.error('Rejection error:', error);
      alert(`❌ Failed to reject collection: ${error.message}`);
    }
  };

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
      <div className="dashboard-header"><h1>Admin Portal</h1></div>
      
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
            <a href="#payments" style={{ color: '#0066cc', marginLeft: '8px', textDecoration: 'underline' }}>View details below</a>
          </div>
        </div>
      )}
      
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
    </div>
  );
};

export default AdminDashboard;

