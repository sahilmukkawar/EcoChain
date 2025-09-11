import React, { useState, useEffect } from 'react';
import '../App.css';
import { useAuth } from '../context/AuthContext.tsx';
import wasteService, { WasteSubmission } from '../services/wasteService.ts';

interface PickupRequest {
  _id: string;
  collectionId: string;
  location: {
    pickupAddress: string;
  };
  collectionDetails: {
    type: string;
    weight: number;
    quality?: string;
  };
  scheduling: {
    requestedDate: string;
    preferredTimeSlot: string;
  };
  status: 'requested' | 'scheduled' | 'in_progress' | 'collected' | 'completed';
  userId: {
    personalInfo: {
      name: string;
      phone: string;
    }
  };
}

interface CollectionHistory {
  _id: string;
  collectionId: string;
  location: {
    pickupAddress: string;
  };
  collectionDetails: {
    type: string;
    weight: number;
  };
  scheduling: {
    actualPickupDate?: string;
  };
  tokenCalculation?: {
    totalTokensIssued: number;
  };
  status: 'completed' | 'delivered' | 'verified';
}

interface ScheduleItem {
  _id: string;
  time: string;
  scheduledDate?: string;
  requestedDate?: string;
  location: {
    pickupAddress: string;
  };
  collectionDetails: {
    type: string;
  };
  status: 'scheduled' | 'in_progress' | 'completed';
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
        setLoading(true);
        
        // Fetch available pickup requests (status: requested)
        const availableCollectionsResponse = await wasteService.getAvailableCollections(1, 20);
        console.log('Available collections response:', availableCollectionsResponse);
        const availableCollections = availableCollectionsResponse.data?.collections || [];
        console.log('Available collections:', availableCollections);
        
        // Transform to PickupRequest interface
        const transformedRequests: PickupRequest[] = availableCollections.map((collection: WasteSubmission) => ({
          _id: collection._id,
          collectionId: collection.collectionId,
          location: collection.location,
          collectionDetails: collection.collectionDetails,
          scheduling: collection.scheduling,
          status: collection.status as any,
          userId: {
            personalInfo: {
              name: 'User', // Default name, would come from populated userId
              phone: 'N/A'
            }
          }
        }));
        console.log('Transformed pickup requests:', transformedRequests.length, 'items');
        setPickupRequests(transformedRequests);
        
        // Fetch assigned collections for the current collector
        const assignedCollectionsResponse = await wasteService.getMyAssignedCollections(1, 20);
        const assignedCollections = assignedCollectionsResponse.data?.collections || [];
        
        // Filter completed collections for history
        const completedCollections = assignedCollections.filter(
          (collection: WasteSubmission) => ['completed', 'delivered', 'verified'].includes(collection.status)
        );
        
        // Transform to CollectionHistory interface
        const transformedHistory: CollectionHistory[] = completedCollections.map((collection: WasteSubmission) => ({
          _id: collection._id,
          collectionId: collection.collectionId,
          location: collection.location,
          collectionDetails: collection.collectionDetails,
          scheduling: collection.scheduling,
          tokenCalculation: collection.tokenCalculation,
          status: collection.status as any
        }));
        setCollectionHistory(transformedHistory);
        
        // Get today's collections for schedule
        const today = new Date().toISOString().split('T')[0];
        const todayCollections = assignedCollections.filter((collection: WasteSubmission) => {
          if (!collection.scheduling.scheduledDate) return false;
          const scheduleDate = new Date(collection.scheduling.scheduledDate).toISOString().split('T')[0];
          return scheduleDate === today;
        });
        
        // Transform to ScheduleItem interface and sort by time
        const transformedSchedule: ScheduleItem[] = todayCollections.map((collection: WasteSubmission) => ({
          _id: collection._id,
          time: collection.scheduling.preferredTimeSlot || 'TBD',
          scheduledDate: collection.scheduling.scheduledDate,
          requestedDate: collection.scheduling.requestedDate,
          location: collection.location,
          collectionDetails: collection.collectionDetails,
          status: collection.status === 'scheduled' ? 'scheduled' : 
                  collection.status === 'in_progress' ? 'in_progress' : 'completed'
        }));
        
        // Sort by time slot for better organization
        transformedSchedule.sort((a, b) => {
          // Extract hour from time slot (e.g., "10:00 AM - 12:00 PM" -> 10)
          const getHour = (timeSlot: string) => {
            if (!timeSlot || timeSlot === 'TBD') return 24; // Put TBD at end
            const match = timeSlot.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (!match) return 24;
            let hour = parseInt(match[1]);
            if (match[3].toUpperCase() === 'PM' && hour !== 12) hour += 12;
            if (match[3].toUpperCase() === 'AM' && hour === 12) hour = 0;
            return hour;
          };
          return getHour(a.time) - getHour(b.time);
        });
        
        setTodaySchedule(transformedSchedule);
        
        // Calculate stats
        const totalEarnings = transformedHistory.reduce((sum, item) => {
          return sum + (item.tokenCalculation?.totalTokensIssued || 0);
        }, 0);
        
        setStats({
          todayPickups: transformedSchedule.length,
          totalEarnings: totalEarnings,
          routeStops: transformedSchedule.length,
          completedCollections: transformedHistory.length,
          pendingCollections: transformedRequests.length
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching collector data:', error);
        console.error('Error details:', error.response?.data || error.message);
        setError('Failed to load collector data: ' + (error.message || 'Unknown error'));
        setLoading(false);
      }
    };
    
    if (user?.role === 'collector') {
      fetchData();
    } else {
      setError('Access denied. Collector role required.');
      setLoading(false);
    }
  }, [user]);

  // Handle accepting a collection request
  const handleAcceptRequest = async (collectionId: string) => {
    try {
      const response = await wasteService.assignCollector(collectionId);
      
      // Show success message with token information
      if (response.success && response.data?.tokensAwarded) {
        alert(`Collection request accepted successfully! User has been awarded ${response.data.tokensAwarded} EcoTokens.`);
      } else {
        alert('Collection request accepted successfully!');
      }
      
      // Refresh data after successful assignment
      const availableCollectionsResponse = await wasteService.getAvailableCollections(1, 20);
      const availableCollections = availableCollectionsResponse.data?.collections || [];
      
      const transformedRequests: PickupRequest[] = availableCollections.map((collection: WasteSubmission) => ({
        _id: collection._id,
        collectionId: collection.collectionId,
        location: collection.location,
        collectionDetails: collection.collectionDetails,
        scheduling: collection.scheduling,
        status: collection.status as any,
        userId: {
          personalInfo: {
            name: 'User',
            phone: 'N/A'
          }
        }
      }));
      setPickupRequests(transformedRequests);
      
    } catch (error: any) {
      console.error('Error accepting request:', error);
      alert(error.message || 'Failed to accept collection request');
    }
  };

  // Handle updating collection status
  const handleUpdateStatus = async (collectionId: string, newStatus: string) => {
    try {
      await wasteService.updateCollectionStatus(collectionId, newStatus);
      
      // Refresh assigned collections
      const assignedCollectionsResponse = await wasteService.getMyAssignedCollections(1, 20);
      const assignedCollections = assignedCollectionsResponse.data?.collections || [];
      
      // Update today's schedule with enhanced sorting
      const today = new Date().toISOString().split('T')[0];
      const todayCollections = assignedCollections.filter((collection: WasteSubmission) => {
        if (!collection.scheduling.scheduledDate) return false;
        const scheduleDate = new Date(collection.scheduling.scheduledDate).toISOString().split('T')[0];
        return scheduleDate === today;
      });
      
      const transformedSchedule: ScheduleItem[] = todayCollections.map((collection: WasteSubmission) => ({
        _id: collection._id,
        time: collection.scheduling.preferredTimeSlot || 'TBD',
        scheduledDate: collection.scheduling.scheduledDate,
        requestedDate: collection.scheduling.requestedDate,
        location: collection.location,
        collectionDetails: collection.collectionDetails,
        status: collection.status === 'scheduled' ? 'scheduled' : 
                collection.status === 'in_progress' ? 'in_progress' : 'completed'
      }));
      
      // Sort by time slot for better organization
      transformedSchedule.sort((a, b) => {
        // Extract hour from time slot (e.g., "10:00 AM - 12:00 PM" -> 10)
        const getHour = (timeSlot: string) => {
          if (!timeSlot || timeSlot === 'TBD') return 24; // Put TBD at end
          const match = timeSlot.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (!match) return 24;
          let hour = parseInt(match[1]);
          if (match[3].toUpperCase() === 'PM' && hour !== 12) hour += 12;
          if (match[3].toUpperCase() === 'AM' && hour === 12) hour = 0;
          return hour;
        };
        return getHour(a.time) - getHour(b.time);
      });
      
      setTodaySchedule(transformedSchedule);
      
      alert('Status updated successfully!');
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(error.message || 'Failed to update status');
    }
  };
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
      <h2 style={{ marginTop: '32px', marginBottom: '16px' }}>Pickup Requests ({pickupRequests.length} available)</h2>
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
            {pickupRequests.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                  No pickup requests available at the moment. New requests will appear here automatically.
                </td>
              </tr>
            ) : (
              pickupRequests.map((request) => (
                <tr key={request._id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{request.location.pickupAddress}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{request.collectionDetails.type}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{request.collectionDetails.weight}kg</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    {request.scheduling.requestedDate ? new Date(request.scheduling.requestedDate).toLocaleDateString() : 'TBD'}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{request.scheduling.preferredTimeSlot}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <span style={getStatusStyle(request.status)}>
                      {request.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    {request.status === 'requested' ? (
                      <button 
                        onClick={() => handleAcceptRequest(request._id)}
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '0.875rem', 
                          backgroundColor: '#4caf50', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px', 
                          cursor: 'pointer',
                          marginRight: '8px'
                        }}
                      >
                        Accept
                      </button>
                    ) : (
                      <button style={{ 
                        padding: '6px 12px', 
                        fontSize: '0.875rem', 
                        backgroundColor: '#1976d2', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer' 
                      }}>
                        View Details
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
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
              <tr key={collection._id}>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                  {collection.scheduling.actualPickupDate ? 
                    new Date(collection.scheduling.actualPickupDate).toLocaleDateString() : 'N/A'}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{collection.location.pickupAddress}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{collection.collectionDetails.type}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{collection.collectionDetails.weight}kg</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                  {collection.tokenCalculation?.totalTokensIssued || 0}
                </td>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Today's Schedule</h3>
            <div style={{ fontSize: '0.875rem', color: '#666', fontWeight: 'bold' }}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
          
          {todaySchedule.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '32px', 
              color: '#666',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              border: '2px dashed #ddd'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📅</div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>No collections scheduled for today</div>
              <div style={{ fontSize: '0.875rem' }}>Check back later or accept new pickup requests</div>
            </div>
          ) : (
            <div>
              {todaySchedule.map((item, index) => (
                <div key={item._id} style={{ 
                  padding: '16px', 
                  marginBottom: '12px',
                  backgroundColor: item.status === 'completed' ? '#f8f9fa' : 
                                  item.status === 'in_progress' ? '#e3f2fd' : '#fff',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${
                    item.status === 'completed' ? '#4caf50' : 
                    item.status === 'in_progress' ? '#2196f3' : '#ff9800'
                  }`
                }}>
                  {/* Time and Status Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ 
                        fontWeight: 'bold', 
                        fontSize: '1.1rem',
                        color: '#1976d2'
                      }}>
                        🕐 {item.time}
                      </span>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        color: '#666',
                        backgroundColor: '#f0f0f0',
                        padding: '2px 8px',
                        borderRadius: '12px'
                      }}>
                        #{index + 1}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={getStatusStyle(item.status)}>
                        {item.status === 'completed' ? '✅ ' : item.status === 'in_progress' ? '🚛 ' : '⏰ '}
                        {item.status === 'scheduled' ? 'Scheduled' :
                         item.status === 'in_progress' ? 'In Progress' : 'Completed'}
                      </span>
                      {item.status === 'scheduled' && (
                        <button 
                          onClick={() => handleUpdateStatus(item._id, 'in_progress')}
                          style={{ 
                            padding: '6px 12px', 
                            fontSize: '0.75rem', 
                            backgroundColor: '#ff9800', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          🚀 Start Pickup
                        </button>
                      )}
                      {item.status === 'in_progress' && (
                        <button 
                          onClick={() => handleUpdateStatus(item._id, 'collected')}
                          style={{ 
                            padding: '6px 12px', 
                            fontSize: '0.75rem', 
                            backgroundColor: '#4caf50', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          ✅ Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Location and Details */}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ marginRight: '8px', fontSize: '1.1rem' }}>📍</span>
                    <span style={{ fontWeight: '500', color: '#333' }}>{item.location.pickupAddress}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.875rem', color: '#666' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>🗂️</span>
                      <span>Waste Type: <strong>{item.collectionDetails.type}</strong></span>
                    </div>
                    {item.scheduledDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>📅</span>
                        <span>Scheduled: {new Date(item.scheduledDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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

