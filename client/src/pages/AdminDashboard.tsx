import React, { useState, useEffect } from 'react';
import '../App.css';
import { useAuth } from '../context/AuthContext.tsx';
import adminService, { CollectionForPayment, AdminStats } from '../services/adminService.ts';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [factories, setFactories] = useState<any[]>([]);
  const [collectors, setCollectors] = useState<any[]>([]);
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
        
        // Mock users data for now (can be replaced with real API later)
        const mockUsers = [
          { id: 1, name: 'John Doe', email: 'user@ecochain.com', role: 'user', ecoTokens: 120, collections: 5 },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user', ecoTokens: 85, collections: 3 },
          { id: 3, name: 'Admin User', email: 'admin@ecochain.com', role: 'admin', ecoTokens: 0, collections: 0 },
        ];
        
        // Mock factories data
        const mockFactories = [
          { id: 1, name: 'EcoPlastics Inc.', email: 'factory@ecochain.com', materialsProcessed: 1250, productsListed: 15 },
          { id: 2, name: 'GreenPaper Co.', email: 'greenpaper@example.com', materialsProcessed: 980, productsListed: 8 },
        ];
        
        // Mock collectors data
        const mockCollectors = [
          { id: 1, name: 'City Collectors', email: 'collector@ecochain.com', collectionsCompleted: 78, rating: 4.8 },
          { id: 2, name: 'EcoPickup Services', email: 'ecopickup@example.com', collectionsCompleted: 56, rating: 4.5 },
        ];
        
        setUsers(mockUsers);
        setFactories(mockFactories);
        setCollectors(mockCollectors);
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
                {users.map((user) => (
                  <tr key={user.id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{user.id}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{user.name}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{user.email}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{user.role}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <button style={{ padding: '6px 12px', fontSize: '0.875rem', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                    </td>
                  </tr>
                ))}
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
                {factories.map((factory) => (
                  <tr key={factory.id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{factory.id}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{factory.name}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{factory.materialsProcessed} kg</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <button style={{ padding: '6px 12px', fontSize: '0.875rem', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                    </td>
                  </tr>
                ))}
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
                {collectors.map((collector) => (
                  <tr key={collector.id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{collector.id}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{collector.name}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{collector.collectionsCompleted}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{collector.rating}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <button style={{ padding: '6px 12px', fontSize: '0.875rem', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                    </td>
                  </tr>
                ))}
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

