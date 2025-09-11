import React, { useState, useEffect } from 'react';
import '../App.css';
import { useAuth } from '../context/AuthContext.tsx';

interface PickupRequest {
  id: string;
  address: string;
  wasteType: string;
  quantity: string;
  status: 'pending' | 'assigned' | 'completed' | 'cancelled';
  scheduledDate: string;
  scheduledTime: string;
  contactName: string;
  contactPhone: string;
}

interface CollectionHistory {
  id: string;
  date: string;
  address: string;
  wasteType: string;
  quantity: string;
  ecoTokensEarned: number;
  status: 'completed' | 'partial' | 'rejected';
}

interface ScheduleItem {
  id: string;
  time: string;
  address: string;
  wasteType: string;
  status: 'pending' | 'in_progress' | 'completed';
}

const CollectorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>([]);
  const [collectionHistory, setCollectionHistory] = useState<CollectionHistory[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    todayPickups: 0,
    totalEarnings: 0,
    routeStops: 0,
    completedCollections: 0,
    pendingCollections: 0
  });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Mock pickup requests data
        const mockPickupRequests: PickupRequest[] = [
          { id: '1', address: '123 Green St, Eco City', wasteType: 'Plastic', quantity: '15kg', status: 'pending', scheduledDate: '2023-06-20', scheduledTime: '10:00 AM', contactName: 'John Smith', contactPhone: '555-1234' },
          { id: '2', address: '456 Recycle Ave, Eco City', wasteType: 'Paper', quantity: '10kg', status: 'assigned', scheduledDate: '2023-06-21', scheduledTime: '2:30 PM', contactName: 'Jane Doe', contactPhone: '555-5678' },
          { id: '3', address: '789 Sustainable Blvd, Eco City', wasteType: 'Glass', quantity: '8kg', status: 'assigned', scheduledDate: '2023-06-22', scheduledTime: '9:15 AM', contactName: 'Robert Green', contactPhone: '555-9012' },
          { id: '4', address: '101 Eco Lane, Eco City', wasteType: 'Metal', quantity: '12kg', status: 'pending', scheduledDate: '2023-06-23', scheduledTime: '1:00 PM', contactName: 'Sarah Blue', contactPhone: '555-3456' },
        ];
        setPickupRequests(mockPickupRequests);
        
        // Mock collection history data
        const mockCollectionHistory: CollectionHistory[] = [
          { id: '1', date: '2023-06-15', address: '222 Eco St, Eco City', wasteType: 'Plastic', quantity: '20kg', ecoTokensEarned: 40, status: 'completed' },
          { id: '2', date: '2023-06-14', address: '333 Green Ave, Eco City', wasteType: 'Paper', quantity: '15kg', ecoTokensEarned: 30, status: 'completed' },
          { id: '3', date: '2023-06-13', address: '444 Recycle Blvd, Eco City', wasteType: 'Glass', quantity: '10kg', ecoTokensEarned: 25, status: 'partial' },
          { id: '4', date: '2023-06-12', address: '555 Sustainable Lane, Eco City', wasteType: 'Metal', quantity: '5kg', ecoTokensEarned: 15, status: 'completed' },
          { id: '5', date: '2023-06-11', address: '666 Eco Park, Eco City', wasteType: 'Plastic', quantity: '8kg', ecoTokensEarned: 16, status: 'rejected' },
        ];
        setCollectionHistory(mockCollectionHistory);
        
        // Mock today's schedule data
        const mockTodaySchedule: ScheduleItem[] = [
          { id: '1', time: '9:00 AM', address: '123 Green St, Eco City', wasteType: 'Plastic', status: 'completed' },
          { id: '2', time: '10:30 AM', address: '456 Recycle Ave, Eco City', wasteType: 'Paper', status: 'in_progress' },
          { id: '3', time: '1:00 PM', address: '789 Sustainable Blvd, Eco City', wasteType: 'Glass', status: 'pending' },
          { id: '4', time: '3:30 PM', address: '101 Eco Lane, Eco City', wasteType: 'Metal', status: 'pending' },
        ];
        setTodaySchedule(mockTodaySchedule);
        
        // Set stats
        setStats({
          todayPickups: mockTodaySchedule.length,
          totalEarnings: mockCollectionHistory.reduce((sum, item) => sum + item.ecoTokensEarned, 0),
          routeStops: mockTodaySchedule.length,
          completedCollections: mockCollectionHistory.filter(item => item.status === 'completed').length,
          pendingCollections: mockPickupRequests.filter(item => item.status === 'pending').length
        });
        
        setLoading(false);
      } catch (error) {
        setError('Failed to load collector data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>Loading collector dashboard...</div>
    </div>
  );
  
  if (error) return (
    <div style={{ margin: '16px' }}>
      <div style={{ color: 'red', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
        Error: {error}
      </div>
    </div>
  );

  const getStatusStyle = (status: string) => {
    const baseStyle = { padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-block' };
    switch (status) {
      case 'completed':
        return { ...baseStyle, backgroundColor: '#e8f5e8', color: '#2e7d32' };
      case 'assigned':
      case 'in_progress':
        return { ...baseStyle, backgroundColor: '#e3f2fd', color: '#1565c0' };
      case 'pending':
        return { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404' };
      case 'cancelled':
        return { ...baseStyle, backgroundColor: '#f8d7da', color: '#721c24' };
      case 'partial':
        return { ...baseStyle, backgroundColor: '#fff3e0', color: '#f57c00' };
      case 'rejected':
        return { ...baseStyle, backgroundColor: '#ffebee', color: '#d32f2f' };
      default:
        return { ...baseStyle, backgroundColor: '#f5f5f5', color: '#666' };
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Collector Dashboard {user && `- ${user.name}`}</h1>
      
      {/* Stats Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#1976d2', margin: '0 0 8px 0' }}>Today's Pickups</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.todayPickups}</div>
        </div>
        <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#1976d2', margin: '0 0 8px 0' }}>Total Earnings</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalEarnings} EcoTokens</div>
        </div>
        <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#1976d2', margin: '0 0 8px 0' }}>Route Stops</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.routeStops}</div>
        </div>
      </div>
      
      {/* Pickup Requests Section */}
      <h2 style={{ marginTop: '32px', marginBottom: '16px' }}>Pickup Requests</h2>
      <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f5f5f5' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Address</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Waste Type</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Quantity</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Scheduled Date</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Scheduled Time</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pickupRequests.map((request) => (
              <tr key={request.id}>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{request.address}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{request.wasteType}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{request.quantity}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{request.scheduledDate}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{request.scheduledTime}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                  <span style={getStatusStyle(request.status)}>
                    {request.status}
                  </span>
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                  <button style={{ padding: '6px 12px', fontSize: '0.875rem', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Collection History Section */}
      <h2 style={{ marginBottom: '16px' }}>Collection History</h2>
      <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f5f5f5' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Address</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Waste Type</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Quantity</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>EcoTokens Earned</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {collectionHistory.map((collection) => (
              <tr key={collection.id}>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{collection.date}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{collection.address}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{collection.wasteType}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{collection.quantity}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{collection.ecoTokensEarned}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                  <span style={getStatusStyle(collection.status)}>
                    {collection.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Quick Actions */}
      <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
        <h3>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <button style={{ padding: '12px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Start Route</button>
          <button style={{ padding: '12px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Scan Waste</button>
          <button style={{ padding: '12px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Report Issue</button>
          <button style={{ padding: '12px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>View Map</button>
        </div>
      </div>
      
      {/* Today's Schedule and Performance Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>Today's Schedule</h3>
          <div>
            {todaySchedule.map((item) => (
              <div key={item.id} style={{ padding: '16px 0', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>{item.time}</span>
                  <span style={getStatusStyle(item.status)}>
                    {item.status === 'completed' ? '✓ ' : item.status === 'in_progress' ? '🚛 ' : '⏰ '}
                    {item.status}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ marginRight: '8px' }}>📍</span>
                  <span>{item.address}</span>
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  Waste Type: {item.wasteType}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Performance Metrics */}
        <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>Performance Metrics</h3>
          <div>
            <div style={{ padding: '16px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>Collections Completed</div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>{stats.completedCollections} collections</div>
              </div>
              <span style={getStatusStyle('completed')}>{stats.completedCollections} / {stats.completedCollections + stats.pendingCollections}</span>
            </div>
            <div style={{ padding: '16px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>Average Collection Time</div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>15 minutes per collection</div>
              </div>
              <span style={getStatusStyle('completed')}>On Target</span>
            </div>
            <div style={{ padding: '16px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>Waste Quality Rating</div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>High quality recyclables</div>
              </div>
              <span style={getStatusStyle('completed')}>4.8/5</span>
            </div>
            <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>Route Efficiency</div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>Optimized for minimum fuel consumption</div>
              </div>
              <span style={getStatusStyle('completed')}>92%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectorDashboard;

