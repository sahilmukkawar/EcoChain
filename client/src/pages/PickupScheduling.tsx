import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useEcoChain } from '../contexts/EcoChainContext.tsx';
import { collectionsAPI } from '../services/api.ts';
import './PickupScheduling.css';

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

  // Generate available dates based on business logic (not dummy data)
  useEffect(() => {
    const generateAvailableDates = () => {
      const dates: PickupDate[] = [];
      const today = new Date();
      
      // Generate next 7 business days (excluding Sundays)
      for (let i = 1; i <= 10; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // Skip Sundays
        if (date.getDay() === 0) continue;
        
        const dateStr = date.toISOString().split('T')[0];
        
        // Generate standard business time slots
        const slots: TimeSlot[] = [
          { id: `${dateStr}-9`, time: '09:00 - 11:00', available: true },
          { id: `${dateStr}-11`, time: '11:00 - 13:00', available: true },
          { id: `${dateStr}-14`, time: '14:00 - 16:00', available: true },
          { id: `${dateStr}-16`, time: '16:00 - 18:00', available: true }
        ];
        
        dates.push({
          date: dateStr,
          slots
        });
        
        // Stop once we have 7 valid dates
        if (dates.length >= 7) break;
      }
      
      setAvailableDates(dates);
    };
    
    generateAvailableDates();
  }, []);

  // Find the collection by ID from EcoChain context
  useEffect(() => {
    if (collectionHistory && collectionId) {
      const foundCollection = collectionHistory.find(c => c._id === collectionId);
      if (foundCollection) {
        setCollection(foundCollection);
        setError(null);
      } else {
        // Try to fetch from API if not found in context
        const fetchCollection = async () => {
          try {
            const response = await collectionsAPI.getCollectionById(collectionId);
            setCollection(response.data);
            setError(null);
          } catch (err: any) {
            console.error('Error fetching collection:', err);
            setError('Collection not found');
          }
        };
        fetchCollection();
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
    
    if (!collection) {
      setError('Collection not found');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Update the collection with pickup scheduling information
      // This would typically update the collection status and add scheduling details
      await collectionsAPI.updateCollectionStatus(collection._id, {
        status: 'scheduled',
        notes: `Pickup scheduled for ${selectedDate} at ${availableDates.find(d => d.date === selectedDate)?.slots.find(s => s.id === selectedTimeSlot)?.time}`
      });
      
      setSuccess(true);
      
      // Refresh collections to get updated data
      await refreshCollections();
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err: any) {
      console.error('Error scheduling pickup:', err);
      setError(err.response?.data?.message || 'Failed to schedule pickup. Please try again.');
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