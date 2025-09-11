import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import './Dashboard.css';
import { useAuth } from '../context/AuthContext.tsx';
import { useEcoChain } from '../contexts/EcoChainContext.tsx';
import { orderService } from '../services/orderService.ts';
import { Order } from '../services/orderService.ts';
import wasteService, { WasteSubmission } from '../services/wasteService.ts';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
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

  useEffect(() => {
    // Set loading to false once we have user data
    if (user) {
      setLoading(false);
      fetchOrders();
      fetchWasteRequests();
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

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await refreshCollections();
      await fetchOrders();
      await fetchWasteRequests();
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
              <span className="token-amount">{totalEcoTokens}</span>
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