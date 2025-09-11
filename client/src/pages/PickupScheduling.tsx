import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth, useEcoChain } from '../mockHooks.tsx';
import '../PickupScheduling.css';

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

interface PickupDate {
  date: string;
  slots: TimeSlot[];
}

const PickupScheduling: React.FC = () => {
  const { collectionId } = useParams<{ collectionId: string }>();
  const { user } = useAuth();
  const { collectionHistory, refreshCollections } = useEcoChain();
  const navigate = useNavigate();
  
  const [collection, setCollection] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<PickupDate[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  // Generate some dummy available dates (next 7 days)
  useEffect(() => {
    const generateAvailableDates = () => {
      const dates: PickupDate[] = [];
      const today = new Date();
      
      for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // Skip Sundays
        if (date.getDay() === 0) continue;
        
        const dateStr = date.toISOString().split('T')[0];
        
        // Generate time slots from 9 AM to 5 PM
        const slots: TimeSlot[] = [];
        for (let hour = 9; hour <= 17; hour += 2) {
          slots.push({
            id: `${dateStr}-${hour}`,
            time: `${hour}:00 - ${hour + 2}:00`,
            available: Math.random() > 0.3 // Randomly make some slots unavailable
          });
        }
        
        dates.push({
          date: dateStr,
          slots
        });
      }
      
      setAvailableDates(dates);
    };
    
    generateAvailableDates();
  }, []);

  // Find the collection by ID
  useEffect(() => {
    if (collectionHistory && collectionId) {
      const foundCollection = collectionHistory.find(c => c.id === collectionId);
      if (foundCollection) {
        setCollection(foundCollection);
        setError(null);
      } else {
        setError('Collection not found');
      }
      setLoading(false);
    }
  }, [collectionHistory, collectionId]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot('');
  };

  const handleTimeSlotSelect = (slotId: string) => {
    setSelectedTimeSlot(slotId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTimeSlot) {
      setError('Please select both a date and time slot');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // In a real app, you would call an API here
      // For now, we'll simulate a successful API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the collection status (in a real app, this would be done by the API)
      // For now, we'll just show a success message
      setSuccess(true);
      
      // Refresh collections to get updated data
      await refreshCollections();
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to schedule pickup');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error && !collection) {
    return <div className="error-message">{error}</div>;
  }

  if (success) {
    return (
      <div className="pickup-scheduling-container">
        <div className="success-message">
          <h2>Pickup Scheduled Successfully!</h2>
          <p>Your waste collection pickup has been scheduled.</p>
          <p>You will be redirected to the dashboard shortly...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pickup-scheduling-container">
      <div className="pickup-scheduling-card">
        <h1>Schedule Waste Collection Pickup</h1>
        
        {collection && (
          <div className="collection-details">
            <h2>Collection Details</h2>
            <div className="detail-row">
              <span className="detail-label">Waste Type:</span>
              <span className="detail-value">{collection.wasteType}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Weight:</span>
              <span className="detail-value">{collection.weight} kg</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className={`status-badge ${collection.status.toLowerCase()}`}>
                {collection.status}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Submission Date:</span>
              <span className="detail-value">
                {new Date(collection.submissionDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>Select Pickup Date</h2>
            <div className="date-selection">
              {availableDates.map(dateObj => (
                <button
                  key={dateObj.date}
                  type="button"
                  className={`date-button ${selectedDate === dateObj.date ? 'selected' : ''}`}
                  onClick={() => handleDateSelect(dateObj.date)}
                >
                  {new Date(dateObj.date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </button>
              ))}
            </div>
          </div>
          
          {selectedDate && (
            <div className="form-section">
              <h2>Select Time Slot</h2>
              <div className="time-slot-selection">
                {availableDates
                  .find(d => d.date === selectedDate)?.slots
                  .map(slot => (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={!slot.available}
                      className={`time-slot-button 
                        ${selectedTimeSlot === slot.id ? 'selected' : ''} 
                        ${!slot.available ? 'unavailable' : ''}`}
                      onClick={() => slot.available && handleTimeSlotSelect(slot.id)}
                    >
                      {slot.time}
                      {!slot.available && <span className="unavailable-text">Unavailable</span>}
                    </button>
                  ))}
              </div>
            </div>
          )}
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={!selectedDate || !selectedTimeSlot || submitting}
            >
              {submitting ? 'Scheduling...' : 'Schedule Pickup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PickupScheduling;