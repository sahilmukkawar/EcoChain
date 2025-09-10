import React, { useState, useEffect } from 'react';
import '../App.css';
import './Dashboard.css';
import SyncStatus from '../components/SyncStatus.tsx';
import { useSync } from '../contexts/SyncContext.tsx';

interface CollectionData {
  id: string;
  date: string;
  wasteType: string;
  quantity: number;
  status: string;
}

const Dashboard: React.FC = () => {
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { startSync, lastSyncTime } = useSync();

  useEffect(() => {
    // This would be replaced with an actual API call
    const fetchCollections = async () => {
      try {
        // Simulated data for now
        const mockData: CollectionData[] = [
          { id: '1', date: '2023-01-15', wasteType: 'Plastic', quantity: 2.5, status: 'Verified' },
          { id: '2', date: '2023-01-20', wasteType: 'Paper', quantity: 3.0, status: 'Pending' },
          { id: '3', date: '2023-01-25', wasteType: 'Glass', quantity: 1.5, status: 'Verified' },
        ];
        
        setCollections(mockData);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch collections');
        setLoading(false);
      }
    };

    fetchCollections();
  }, [lastSyncTime]); // Re-fetch when lastSyncTime changes

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const handleRefresh = async () => {
    try {
      await startSync({ entityTypes: ['collections'] });
    } catch (error) {
      console.error('Sync failed:', error);
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