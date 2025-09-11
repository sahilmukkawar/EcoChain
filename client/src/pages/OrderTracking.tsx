import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../services/orderService.ts';
import '../OrderTracking.css';

interface TrackingUpdate {
  status: string;
  timestamp: string;
  location: string;
}

interface TrackingInfo {
  status: string;
  location: string;
  estimatedDelivery: string;
  updates: TrackingUpdate[];
}

const OrderTracking: React.FC = () => {
  const { trackingNumber } = useParams<{ trackingNumber: string }>();
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrackingInfo = async () => {
      try {
        if (!trackingNumber) {
          throw new Error('Tracking number is missing');
        }
        
        setLoading(true);
        const data = await orderService.trackOrder(trackingNumber);
        setTrackingInfo(data);
      } catch (err: any) {
        console.error('Error fetching tracking info:', err);
        setError(err.message || 'Failed to load tracking information');
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingInfo();
  }, [trackingNumber]);

  if (loading) {
    return <div className="loading">Loading tracking information...</div>;
  }

  if (error) {
    return (
      <div className="tracking-container">
        <div className="error-message">{error}</div>
        <Link to="/dashboard" className="back-button">Back to Dashboard</Link>
      </div>
    );
  }

  if (!trackingInfo) {
    return (
      <div className="tracking-container">
        <div className="error-message">Tracking information not found</div>
        <Link to="/dashboard" className="back-button">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="tracking-container">
      <div className="tracking-card">
        <h1>Order Tracking</h1>
        <div className="tracking-header">
          <div className="tracking-number">
            <h2>Tracking Number</h2>
            <p>{trackingNumber}</p>
          </div>
          <div className="delivery-estimate">
            <h2>Estimated Delivery</h2>
            <p>{new Date(trackingInfo.estimatedDelivery).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="current-status">
          <div className="status-badge">{trackingInfo.status}</div>
          <p>Currently at: {trackingInfo.location}</p>
        </div>
        
        <div className="tracking-timeline">
          <h2>Tracking History</h2>
          <div className="timeline">
            {trackingInfo.updates.map((update, index) => (
              <div className="timeline-item" key={index}>
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <div className="update-status">{update.status}</div>
                  <div className="update-location">{update.location}</div>
                  <div className="update-time">{new Date(update.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="tracking-actions">
          <Link to="/dashboard" className="back-button">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;