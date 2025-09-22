import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEcoChain } from '../contexts/EcoChainContext';
import { collectionsAPI } from '../services/api';

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

  // Generate available dates based on business logic
  useEffect(() => {
    const generateAvailableDates = () => {
      const dates: PickupDate[] = [];
      const today = new Date();
      
      for (let i = 1; i <= 10; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        if (date.getDay() === 0) continue;
        
        const dateStr = date.toISOString().split('T')[0];
        
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
        
        if (dates.length >= 7) break;
      }
      
      setAvailableDates(dates);
    };
    
    generateAvailableDates();
  }, []);

  // Find the collection by ID
  useEffect(() => {
    if (collectionHistory && collectionId) {
      const foundCollection = collectionHistory.find(c => c._id === collectionId);
      if (foundCollection) {
        setCollection(foundCollection);
        setError(null);
      } else {
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
      
      await collectionsAPI.updateCollectionStatus(collection._id, {
        status: 'scheduled',
        notes: `Pickup scheduled for ${selectedDate} at ${availableDates.find(d => d.date === selectedDate)?.slots.find(s => s.id === selectedTimeSlot)?.time}`
      });
      
      setSuccess(true);
      await refreshCollections();
      
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-green-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading pickup scheduling...</p>
        </div>
      </div>
    );
  }

  if (error && !collection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-red-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Collection Not Found</h3>
            <p className="text-red-600 text-sm mb-6 leading-relaxed">{error}</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="bg-eco-green-600 hover:bg-eco-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-eco-green-200">
            <div className="w-20 h-20 bg-eco-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pickup Scheduled!</h2>
            <p className="text-lg text-gray-600 mb-2">Your waste collection pickup has been successfully scheduled.</p>
            <p className="text-sm text-gray-500 mb-6">Redirecting to dashboard...</p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-eco-green-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Schedule Pickup</h1>
              <p className="text-sm text-gray-500">Schedule your waste collection pickup</p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Collection Details */}
        {collection && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Collection Details</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Waste Type</span>
                    <span className="text-sm font-semibold text-gray-900 capitalize">{collection.wasteType}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Weight</span>
                    <span className="text-sm font-semibold text-gray-900">{collection.weight} kg</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Status</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      collection.status === 'scheduled' ? 'bg-eco-green-100 text-eco-green-800' :
                      collection.status === 'requested' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {collection.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Submission Date</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {new Date(collection.submissionDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-800 font-medium text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Scheduling Form */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Schedule Your Pickup</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Date Selection */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">Select Pickup Date</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableDates.map(dateObj => (
                  <button
                    key={dateObj.date}
                    type="button"
                    onClick={() => handleDateSelect(dateObj.date)}
                    className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                      selectedDate === dateObj.date
                        ? 'border-eco-green-500 bg-eco-green-50 text-eco-green-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-semibold">
                        {new Date(dateObj.date).toLocaleDateString('en-US', { 
                          weekday: 'short'
                        })}
                      </div>
                      <div className="text-sm">
                        {new Date(dateObj.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot Selection */}
            {selectedDate && (
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-4">Select Time Slot</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableDates
                    .find(d => d.date === selectedDate)?.slots
                    .map(slot => (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => slot.available && handleTimeSlotSelect(slot.id)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          !slot.available
                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                            : selectedTimeSlot === slot.id
                            ? 'border-eco-green-500 bg-eco-green-50 text-eco-green-700 shadow-md'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">{slot.time}</span>
                          </div>
                          {!slot.available && (
                            <span className="text-xs text-red-500 font-medium">Unavailable</span>
                          )}
                          {selectedTimeSlot === slot.id && (
                            <svg className="w-5 h-5 text-eco-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {selectedDate && selectedTimeSlot && (
              <div className="bg-eco-green-50 p-4 rounded-lg border border-eco-green-200">
                <h4 className="font-semibold text-eco-green-800 mb-2">Pickup Summary</h4>
                <div className="text-sm text-eco-green-700 space-y-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Date: {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Time: {availableDates.find(d => d.date === selectedDate)?.slots.find(s => s.id === selectedTimeSlot)?.time}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-gray-200">
              <button 
                type="button" 
                onClick={() => navigate('/dashboard')}
                className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-all shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              
              <button 
                type="submit" 
                disabled={!selectedDate || !selectedTimeSlot || submitting}
                className={`flex items-center justify-center gap-2 font-medium py-3 px-8 rounded-lg transition-all shadow-sm hover:shadow-md ${
                  !selectedDate || !selectedTimeSlot || submitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-eco-green-600 hover:bg-eco-green-700 text-white'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Scheduling...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Schedule Pickup
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PickupScheduling;
