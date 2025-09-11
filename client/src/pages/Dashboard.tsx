import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import './Dashboard.css';
import { useAuth } from '../context/AuthContext.tsx';
import { orderService } from '../services/orderService.ts';
import { Order } from '../services/orderService.ts';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  // Mock data for now - will be replaced with real API calls
  const collectionHistory: any[] = [];
  const environmentalImpact = { co2Saved: 0, treesEquivalent: 0, waterSaved: 0 };
  const totalEcoTokens = user?.ecoTokens || 0;
  const refreshCollections = async () => {};
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    // Set loading to false once we have user data
    if (user) {
      setLoading(false);
      fetchOrders();
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

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await refreshCollections();
      await fetchOrders();
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
              <h3>Total Collections</h3>
              <p>{collectionHistory.length}</p>
            </div>
            <div className="stat-card">
              <h3>Total Weight</h3>
              <p>{collectionHistory.reduce((sum, item) => sum + item.quantity, 0).toFixed(2)} kg</p>
            </div>
            <div className="stat-card">
              <h3>Verified Collections</h3>
              <p>{collectionHistory.filter(item => item.status === 'collected').length}</p>
            </div>
          </section>

          <section className="collections-section">
            <h2>Recent Collections</h2>
            {collectionHistory.length > 0 ? (
              <table className="collections-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Waste Type</th>
                    <th>Quantity (kg)</th>
                    <th>Status</th>
                    <th>Tokens</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {collectionHistory.map(collection => (
                    <tr key={collection._id}>
                      <td>{new Date(collection.createdAt).toLocaleDateString()}</td>
                      <td>{collection.wasteType}</td>
                      <td>{collection.quantity}</td>
                      <td>
                        <span className={`status-badge ${collection.status.toLowerCase()}`}>
                          {collection.status}
                        </span>
                      </td>
                      <td>{collection.estimatedTokens}</td>
                      <td>
                        {collection.status.toLowerCase() === 'pending' && (
                          <Link to={`/pickup-scheduling/${collection._id}`} className="schedule-pickup-button">
                            Schedule Pickup
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">No collection history found. Start recycling to earn tokens!</p>
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
                    <tr key={order.id}>
                      <td>{order.id.substring(0, 8)}...</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>₹{order.totalPrice}</td>
                      <td>{order.totalTokens}</td>
                      <td className="order-actions-cell">
                        <Link to={`/order-confirmation/${order.id}`} className="view-order-link">
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