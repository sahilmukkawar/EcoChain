import React, { useState, useEffect } from 'react';
import '../App.css';
import './Dashboard.css';
import SyncStatus from '../components/SyncStatus.tsx';
import { useSync } from '../contexts/SyncContext.tsx';
import { useEcoChain } from '../contexts/EcoChainContext';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { startSync, lastSyncTime } = useSync();
  const { ecoTokens, collectionHistory, environmentalImpact, totalEcoTokens } = useEcoChain();

  useEffect(() => {
    // Set loading to false once we have data from the EcoChain context
    if (ecoTokens.length > 0 && collectionHistory.length > 0) {
      setLoading(false);
    }
  }, [ecoTokens, collectionHistory, lastSyncTime]); // Re-check when data or lastSyncTime changes

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const handleRefresh = async () => {
    try {
      await startSync({ entityTypes: ['collections', 'ecoTokens', 'environmentalImpact'] });
    } catch (error) {
      console.error('Sync failed:', error);
      setError('Failed to sync data');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>User Dashboard</h2>
        <SyncStatus />
        <button className="refresh-button" onClick={handleRefresh}>Refresh Data</button>
      </div>
      
      <div className="dashboard-summary">
        <div className="summary-card token-balance">
          <h3>EcoToken Balance</h3>
          <div className="token-amount">{totalEcoTokens}</div>
          <p>Available tokens to use</p>
        </div>
        
        <div className="summary-card collection-summary">
          <h3>Collection Summary</h3>
          <div className="collection-stats">
            <div className="stat">
              <span className="stat-value">{collectionHistory.length}</span>
              <span className="stat-label">Total Collections</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {collectionHistory.filter(c => c.status === 'pending').length}
              </span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
        </div>
        
        <div className="summary-card environmental-impact">
          <h3>Environmental Impact</h3>
          <div className="impact-stats">
            <div className="stat">
              <span className="stat-value">{environmentalImpact.wasteRecycled} kg</span>
              <span className="stat-label">Waste Recycled</span>
            </div>
            <div className="stat">
              <span className="stat-value">{environmentalImpact.co2Reduced} kg</span>
              <span className="stat-label">CO2 Reduced</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="dashboard-details">
        <div className="detail-section">
          <h3>Recent EcoTokens</h3>
          <div className="token-history">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Source</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {ecoTokens.map(token => (
                  <tr key={token.id}>
                    <td>{token.date}</td>
                    <td>{token.source}</td>
                    <td className="token-value">+{token.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="detail-section">
          <h3>Collection History</h3>
          <div className="collection-history">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Waste Type</th>
                  <th>Quantity</th>
                  <th>Tokens</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {collectionHistory.map(collection => (
                  <tr key={collection.id}>
                    <td>{collection.date}</td>
                    <td>{collection.wasteType}</td>
                    <td>{collection.quantity} kg</td>
                    <td className="token-value">+{collection.tokensEarned}</td>
                    <td>
                      <span className={`status-badge ${collection.status}`}>
                        {collection.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="detail-section environmental-details">
          <h3>Environmental Impact Details</h3>
          <div className="impact-details">
            <div className="impact-card">
              <div className="impact-icon tree-icon">🌳</div>
              <div className="impact-value">{environmentalImpact.treesEquivalent}</div>
              <div className="impact-label">Trees Saved</div>
            </div>
            
            <div className="impact-card">
              <div className="impact-icon water-icon">💧</div>
              <div className="impact-value">{environmentalImpact.waterSaved}L</div>
              <div className="impact-label">Water Saved</div>
            </div>
            
            <div className="impact-card">
              <div className="impact-icon waste-icon">♻️</div>
              <div className="impact-value">{environmentalImpact.wasteRecycled}kg</div>
              <div className="impact-label">Waste Recycled</div>
            </div>
            
            <div className="impact-card">
              <div className="impact-icon co2-icon">🌿</div>
              <div className="impact-value">{environmentalImpact.co2Reduced}kg</div>
              <div className="impact-label">CO2 Reduced</div>
            </div>
          </div>
        </div>
      </div>
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
          <SyncStatus showControls={true} />
        </div>
        
        <div className="dashboard-main">
          <section className="stats-section">
            <div className="stat-card">
              <h3>Total Collections</h3>
              <p>{collections.length}</p>
            </div>
            <div className="stat-card">
              <h3>Total Weight</h3>
              <p>{collections.reduce((sum, item) => sum + item.quantity, 0).toFixed(2)} kg</p>
            </div>
            <div className="stat-card">
              <h3>Verified Collections</h3>
              <p>{collections.filter(item => item.status === 'Verified').length}</p>
            </div>
          </section>

          <section className="collections-section">
            <h2>Recent Collections</h2>
            <table className="collections-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Waste Type</th>
                  <th>Quantity (kg)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {collections.map(collection => (
                  <tr key={collection.id}>
                    <td>{collection.date}</td>
                    <td>{collection.wasteType}</td>
                    <td>{collection.quantity}</td>
                    <td>{collection.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;