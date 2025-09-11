import React, { useState, useEffect } from 'react';
import '../App.css';
import { useAuth } from '../context/AuthContext.tsx';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [factories, setFactories] = useState<any[]>([]);
  const [collectors, setCollectors] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalCollections: 0,
    totalProducts: 0,
    totalEcoTokensIssued: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        // Mock data for admin dashboard
        // In a real application, these would be API calls
        
        // Mock users data
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
        
        // Mock system statistics
        const mockSystemStats = {
          totalUsers: 156,
          totalOrders: 423,
          totalCollections: 512,
          totalProducts: 87,
          totalEcoTokensIssued: 15680,
          totalRevenue: 28750
        };
        
        setUsers(mockUsers);
        setFactories(mockFactories);
        setCollectors(mockCollectors);
        setSystemStats(mockSystemStats);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError('Failed to load admin dashboard data');
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
      
      {/* System Overview */}
      <section className="stats-section" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'16px'}}>
        <div className="stat-card"><h3>Users</h3><p>{systemStats.totalUsers}</p></div>
        <div className="stat-card"><h3>Transactions</h3><p>{systemStats.totalOrders}</p></div>
        <div className="stat-card"><h3>Revenue</h3><p>${systemStats.totalRevenue.toLocaleString()}</p></div>
      </section>
      
      {/* Secondary Stats */}
      <section className="stats-section" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'16px', marginTop: '16px'}}>
        <div className="stat-card"><h3>Waste Collections</h3><p>{systemStats.totalCollections}</p></div>
        <div className="stat-card"><h3>Products</h3><p>{systemStats.totalProducts}</p></div>
        <div className="stat-card"><h3>EcoTokens</h3><p>{systemStats.totalEcoTokensIssued.toLocaleString()}</p></div>
      </section>
      
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
        <div className="feature-card"><h3>Support</h3><p>Disputes & customer care</p></div>
        <div className="feature-card"><h3>Finance</h3><p>Reports and commissions</p></div>
      </div>
    </div>
  );
};

export default AdminDashboard;

