import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import './Dashboard.css';
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

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

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
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Your Dashboard</h1>
        <button className="refresh-button" onClick={handleRefresh}>Refresh Data</button>
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-sidebar">
          <div className="user-stats">
            <h3>Your EcoTokens</h3>
            <div className="token-display">
              <span className="token-icon">🌱</span>
              <span className="token-amount">{currentTokenBalance}</span>
            </div>
            {lastTokenUpdate && (
              <div style={{
                fontSize: '0.75rem',
                color: '#666',
                marginTop: '4px',
                fontStyle: 'italic'
              }}>
                Last updated: {lastTokenUpdate.toLocaleTimeString()}
              </div>
            )}
            <div className="token-refresh">
              <button 
                onClick={() => {
                  console.log('Manual token balance refresh clicked');
                  fetchLatestUserData();
                }}
                style={{
                  background: 'linear-gradient(45deg, #4caf50, #45a049)',
                  border: 'none',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                  boxShadow: '0 2px 4px rgba(76, 175, 80, 0.3)'
                }}
              >
                🔄 Refresh Balance
              </button>
            </div>
            <div className="environmental-impact">
              <h4>Your Environmental Impact</h4>
              <ul>
                <li>CO2 Saved: {environmentalImpact.co2Saved} kg</li>
                <li>Trees Equivalent: {environmentalImpact.treesEquivalent}</li>
                <li>Water Saved: {environmentalImpact.waterSaved} L</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="dashboard-main">
          <section className="stats-section">
            <div className="stat-card">
              <h3>Total Requests</h3>
              <p>{wasteRequests.length}</p>
            </div>
            <div className="stat-card">
              <h3>Total Weight</h3>
              <p>{wasteRequests.reduce((sum, item) => sum + (item.collectionDetails?.weight || 0), 0).toFixed(2)} kg</p>
            </div>
            <div className="stat-card">
              <h3>Completed Collections</h3>
              <p>{wasteRequests.filter(item => item.status === 'completed').length}</p>
            </div>
            <div className="stat-card">
              <h3>Pending Requests</h3>
              <p>{wasteRequests.filter(item => item.status === 'requested').length}</p>
            </div>
          </section>

          <section className="collections-section">
            <h2>Your Waste Collection Requests</h2>
            {wasteLoading ? (
              <div className="loading-state">Loading your requests...</div>
            ) : wasteError ? (
              <div className="error-state">{wasteError}</div>
            ) : wasteRequests.length === 0 ? (
              <div className="no-data">
                <p>No waste collection requests found.</p>
                <Link to="/waste-submission" className="submit-waste-button">
                  Submit Your First Waste Request
                </Link>
              </div>
            ) : (
              <table className="collections-table">
                <thead>
                  <tr>
                    <th>Collection ID</th>
                    <th>Date Requested</th>
                    <th>Waste Type</th>
                    <th>Weight (kg)</th>
                    <th>Quality</th>
                    <th>Status</th>
                    <th>Pickup Address</th>
                    <th>Estimated Tokens</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wasteRequests.map(request => {
                    const statusClass = `status-badge ${request.status.toLowerCase().replace('_', '-')}`;
                    const estimatedTokens = request.tokenCalculation?.totalTokensIssued || 0;
                    
                    return (
                      <tr key={request._id}>
                        <td>{request.collectionId}</td>
                        <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                        <td className="capitalize">{request.collectionDetails?.type}</td>
                        <td>{request.collectionDetails?.weight || 0}</td>
                        <td className="capitalize">{request.collectionDetails?.quality || 'fair'}</td>
                        <td>
                          <span className={statusClass}>
                            {request.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>{request.location?.pickupAddress || 'N/A'}</td>
                        <td>{estimatedTokens}</td>
                        <td>
                          {request.status === 'requested' && (
                            <span className="status-text">Waiting for collector</span>
                          )}
                          {request.status === 'scheduled' && (
                            <span className="status-text">Collector assigned</span>
                          )}
                          {request.status === 'in_progress' && (
                            <span className="status-text">Collection in progress</span>
                          )}
                          {request.status === 'collected' && (
                            <span className="status-text">Collected, processing...</span>
                          )}
                          {request.status === 'completed' && (
                            <span className="success-text">✅ Tokens earned!</span>
                          )}
                          {request.status === 'rejected' && (
                            <span className="error-text">❌ Rejected</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
          
          <section className="orders-section">
            <h2>Your Orders</h2>
            {ordersLoading ? (
              <div className="loading-state">Loading your orders...</div>
            ) : ordersError ? (
              <div className="error-state">{ordersError}</div>
            ) : orders.length === 0 ? (
              <div className="no-data">You haven't placed any orders yet.</div>
            ) : (
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Tokens Used</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td>{order._id.substring(0, 8)}...</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>₹{order.totalPrice}</td>
                      <td>{order.totalTokenPrice}</td>
                      <td className="order-actions-cell">
                        <Link to={`/order-confirmation/${order._id}`} className="view-order-link">
                          View
                        </Link>
                        {order.trackingNumber && (
                          <Link to={`/order-tracking/${order.trackingNumber}`} className="track-order-link">
                            Track
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;