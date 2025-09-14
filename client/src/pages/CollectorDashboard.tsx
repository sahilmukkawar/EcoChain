import React, { useState, useEffect } from 'react';
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
    quality?: string;
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
  const [assignedCollections, setAssignedCollections] = useState<WasteSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Function to calculate payment in INR based on Indian industry standards
  const calculatePaymentINR = (wasteType: string, weight: number, quality: string = 'fair') => {
    const baseRates = {
      plastic: 12,
      paper: 8, 
      metal: 25,
      glass: 3,
      electronic: 35,
      organic: 2,
      other: 5
    };
    
    const qualityMultipliers = {
      excellent: 1.4,
      good: 1.2,
      fair: 1.0,
      poor: 0.7
    };
    
    const baseRate = baseRates[wasteType] || baseRates.other;
    const qualityMultiplier = qualityMultipliers[quality] || qualityMultipliers.fair;
    return Math.round(baseRate * weight * qualityMultiplier);
  };
  
  // Stats
  const [stats, setStats] = useState({
    todayPickups: 0,
    totalEarnings: 0,
    routeStops: 0,
    completedCollections: 0,
    pendingCollections: 0,
  totalEarningsINR: 0,
  pendingPaymentsINR: 0
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
        
        console.log('=== COLLECTOR DASHBOARD DEBUG ===');
        console.log('Assigned collections fetched:', assignedCollections.length);
        console.log('Sample assigned collection:', assignedCollections[0]);
        console.log('All assigned collections statuses:', assignedCollections.map(c => ({ id: c.collectionId, status: c.status })));
        console.log('================================');
        
        // Set assigned collections state
        setAssignedCollections(assignedCollections);
        
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
        
        // Calculate stats including INR payments
        const totalEarnings = transformedHistory.reduce((sum, item) => {
          return sum + (item.tokenCalculation?.totalTokensIssued || 0);
        }, 0);
        
        // Calculate total INR earnings from completed collections
        const totalEarningsINR = transformedHistory.reduce((sum, item) => {
          return sum + calculatePaymentINR(
            item.collectionDetails.type,
            item.collectionDetails.weight,
            item.collectionDetails.quality || 'fair'
          );
        }, 0);
        
        // Calculate pending INR payments from collected collections
        const collectedCollections = assignedCollections.filter(
          (collection: WasteSubmission) => collection.status === 'collected'
        );
        
        const pendingPaymentsINR = collectedCollections.reduce((sum, item) => {
          return sum + calculatePaymentINR(
            item.collectionDetails.type,
            item.collectionDetails.weight,
            item.collectionDetails.quality || 'fair'
          );
        }, 0);
        
        setStats({
          todayPickups: transformedSchedule.length,
          totalEarnings: totalEarnings,
          routeStops: transformedSchedule.length,
          completedCollections: transformedHistory.length,
          pendingCollections: transformedRequests.length,
          totalEarningsINR: totalEarningsINR,
          pendingPaymentsINR: pendingPaymentsINR
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
        alert(`Collection request accepted successfully! User has been awarded ${response.data.tokensAwarded} EcoTokens. Collection is now scheduled.`);
      } else {
        alert('Collection request accepted successfully! Collection is now scheduled.');
      }
      
      // Refresh both pickup requests and today's schedule
      await refreshCollectorData();
      
    } catch (error: any) {
      console.error('Error accepting request:', error);
      alert(error.message || 'Failed to accept collection request');
    }
  };

  // Handle updating collection status
  const handleUpdateStatus = async (collectionId: string, newStatus: string) => {
    try {
      console.log(`Updating collection ${collectionId} to status: ${newStatus}`);
      
      let response;
      
      // Use specific endpoint for marking as collected
      if (newStatus === 'collected') {
        response = await wasteService.markAsCollected(collectionId);
        
        // Calculate expected payment to show to collector
        const collection = assignedCollections.find(c => c._id === collectionId);
        if (collection) {
          const expectedPayment = calculatePaymentINR(
            collection.collectionDetails.type,
            collection.collectionDetails.weight,
            collection.collectionDetails.quality
          );
          alert(`Collection marked as collected! Expected payment: ₹${expectedPayment}. This will now be sent to admin for approval and payment processing.`);
        } else {
          alert('Collection marked as collected! This will now be sent to admin for processing collector payment.');
        }
      } else {
        response = await wasteService.updateCollectionStatus(collectionId, newStatus);
        alert('Status updated successfully!');
      }
      
      // Refresh all collector data
      await refreshCollectorData();
      
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(error.message || 'Failed to update status');
    }
  };
  
  // Function to refresh all collector data
  const refreshCollectorData = async () => {
    try {
      console.log('Refreshing collector dashboard data...');
      
      // Fetch available pickup requests (status: requested)
      const availableCollectionsResponse = await wasteService.getAvailableCollections(1, 20);
      const availableCollections = availableCollectionsResponse.data?.collections || [];
      
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
            name: 'User',
            phone: 'N/A'
          }
        }
      }));
      setPickupRequests(transformedRequests);
      
      // Fetch assigned collections for the current collector
      const assignedCollectionsResponse = await wasteService.getMyAssignedCollections(1, 20);
      const assignedCollections = assignedCollectionsResponse.data?.collections || [];
      
      console.log('=== REFRESH COLLECTOR DEBUG ===');
      console.log('Refresh - Assigned collections fetched:', assignedCollections.length);
      console.log('Refresh - All assigned collections:', assignedCollections.map(c => ({ 
        id: c.collectionId, 
        status: c.status,
        scheduledDate: c.scheduling?.scheduledDate 
      })));
      console.log('===============================');
      
      // Set assigned collections state
      setAssignedCollections(assignedCollections);
      
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
        const getHour = (timeSlot: string) => {
          if (!timeSlot || timeSlot === 'TBD') return 24;
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
      
      // Update collection history
      const completedCollections = assignedCollections.filter(
        (collection: WasteSubmission) => ['completed', 'delivered', 'verified'].includes(collection.status)
      );
      
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
      
      // Calculate stats
      const totalEarnings = transformedHistory.reduce((sum, item) => {
        return sum + (item.tokenCalculation?.totalTokensIssued || 0);
      }, 0);
      
      // Calculate total INR earnings from completed collections
      const totalEarningsINR = transformedHistory.reduce((sum, item) => {
        return sum + calculatePaymentINR(
          item.collectionDetails.type,
          item.collectionDetails.weight,
          item.collectionDetails.quality || 'fair'
        );
      }, 0);
      
      // Calculate pending INR payments from collected collections
      const collectedCollections = assignedCollections.filter(
        (collection: WasteSubmission) => collection.status === 'collected'
      );
      
      const pendingPaymentsINR = collectedCollections.reduce((sum, item) => {
        return sum + calculatePaymentINR(
          item.collectionDetails.type,
          item.collectionDetails.weight,
          item.collectionDetails.quality || 'fair'
        );
      }, 0);
      
      setStats({
        todayPickups: transformedSchedule.length,
        totalEarnings: totalEarnings,
        routeStops: transformedSchedule.length,
        completedCollections: transformedHistory.length,
        pendingCollections: transformedRequests.length,
        totalEarningsINR: totalEarningsINR,
        pendingPaymentsINR: pendingPaymentsINR
      });
      
      console.log('Collector data refresh completed');
    } catch (error) {
      console.error('Error refreshing collector data:', error);
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
  const refreshDashboard = async () => {
    setRefreshing(true);
    try {
      // Add your refresh logic here
      setError(null);
    } catch (err) {
      console.error('Error refreshing dashboard:', err);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

    return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Collector Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back, {user?.name}! Manage your waste collection routes</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Active Collections Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-eco-green-50 text-eco-green-700 border border-eco-green-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span>{assignedCollections?.length || 0} Active Collections</span>
              </div>

              {/* Refresh Button */}
              <button
                onClick={refreshDashboard}
                disabled={refreshing}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${refreshing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-600 hover:bg-gray-700 text-white shadow-sm hover:shadow-md'
                  }`}
              >
                <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-800 font-medium text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Payments Alert */}
      {stats?.pendingPaymentsINR > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-amber-800 font-medium text-sm">
                  Payment Pending: ₹{stats.pendingPaymentsINR} awaiting admin approval
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Pickups</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.todayPickups || 0}</p>
              </div>
              <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-3xl font-bold text-eco-green-600 mt-2">₹{stats?.totalEarningsINR || 0}</p>
                <p className="text-xs text-gray-500 mt-1">{stats?.totalEarnings || 0} EcoTokens</p>
              </div>
              <div className="h-12 w-12 bg-eco-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-eco-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className={`rounded-xl border p-6 ${stats?.pendingPaymentsINR > 0
            ? 'bg-amber-50 border-amber-200'
            : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className={`text-3xl font-bold mt-2 ${stats?.pendingPaymentsINR > 0 ? 'text-amber-600' : 'text-gray-900'
                  }`}>
                  ₹{stats?.pendingPaymentsINR || 0}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${stats?.pendingPaymentsINR > 0 ? 'bg-amber-100' : 'bg-gray-50'
                }`}>
                {stats?.pendingPaymentsINR > 0 ? (
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            {stats?.pendingPaymentsINR > 0 && (
              <p className="text-sm text-amber-600 font-medium mt-4">Awaiting admin approval</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Route Stops</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.routeStops || 0}</p>
              </div>
              <div className="h-12 w-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          {/* Quick Actions */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6 space-y-3">
                <button className="w-full flex items-center gap-3 p-4 bg-eco-green-50 hover:bg-eco-green-100 rounded-xl transition-all duration-200 hover:shadow-md border border-eco-green-100 hover:border-eco-green-200">
                  <div className="w-10 h-10 bg-eco-green-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 text-sm">Start Route</div>
                    <div className="text-xs text-gray-600">Begin collection route</div>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:shadow-md border border-gray-100 hover:border-gray-200">
                  <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11a6 6 0 11-12 0v-1m12 1a6 6 0 11-12 0v-1m0 1v4a2 2 0 002 2h8a2 2 0 002-2v-4m0 0V9a2 2 0 00-2-2H10a2 2 0 00-2 2v6.5" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 text-sm">Scan Waste</div>
                    <div className="text-xs text-gray-600">QR code scanner</div>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:shadow-md border border-gray-100 hover:border-gray-200">
                  <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 text-sm">Report Issue</div>
                    <div className="text-xs text-gray-600">Submit problem report</div>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:shadow-md border border-gray-100 hover:border-gray-200">
                  <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 text-sm">View Map</div>
                    <div className="text-xs text-gray-600">Route optimization</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
                  <div className="text-sm text-gray-500 font-medium">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {!todaySchedule || todaySchedule.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No collections scheduled</h3>
                    <p className="text-gray-600">Check back later or accept new pickup requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todaySchedule.map((item, index) => (
                      <div key={item._id} className={`p-4 rounded-lg border-l-4 ${
                        item.status === 'completed' ? 'bg-eco-green-50 border-eco-green-500' : 
                        item.status === 'in_progress' ? 'bg-blue-50 border-blue-500' : 'bg-amber-50 border-amber-500'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-gray-900">
                              🕐 {item.time}
                            </span>
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                              #{index + 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.status === 'completed' ? 'bg-eco-green-100 text-eco-green-800' :
                              item.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.status === 'completed' ? '✅ Completed' :
                               item.status === 'in_progress' ? '🚛 In Progress' : '⏰ Scheduled'}
                            </span>
                            {item.status === 'scheduled' && (
                              <button 
                                onClick={() => handleUpdateStatus(item._id, 'in_progress')}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 text-xs font-medium rounded-lg transition-colors"
                              >
                                🚀 Start
                              </button>
                            )}
                            {item.status === 'in_progress' && (
                              <button 
                                onClick={() => handleUpdateStatus(item._id, 'collected')}
                                className="bg-eco-green-500 hover:bg-eco-green-600 text-white px-3 py-1 text-xs font-medium rounded-lg transition-colors"
                              >
                                ✅ Complete
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span className="font-medium text-gray-900">{item.location.pickupAddress}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span><strong>{item.collectionDetails.type}</strong></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l-3-9m3 9l3-9" />
                            </svg>
                            <span>{item.collectionDetails.weight}kg</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pickup Requests */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Available Pickup Requests</h3>
              <span className="text-sm text-gray-500">{pickupRequests?.length || 0} requests available</span>
            </div>
          </div>

          {!pickupRequests || pickupRequests.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No pickup requests</h3>
              <p className="text-gray-600">New requests will appear here automatically</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waste Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pickupRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {request.location.pickupAddress}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{request.collectionDetails.type}</div>
                          <div className="text-gray-500">{request.collectionDetails.weight}kg</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-gray-900">
                            {request.scheduling.requestedDate ? 
                              new Date(request.scheduling.requestedDate).toLocaleDateString() : 'TBD'}
                          </div>
                          <div className="text-gray-500">{request.scheduling.preferredTimeSlot}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.status === 'requested' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {request.status === 'requested' ? (
                          <button 
                            onClick={() => handleAcceptRequest(request._id)}
                            className="bg-eco-green-500 hover:bg-eco-green-600 text-white px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                          >
                            Accept
                          </button>
                        ) : (
                          <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 text-xs font-medium rounded-lg transition-colors">
                            View Details
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Performance Metrics & Collection History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Performance Metrics */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Collections Completed</div>
                    <div className="text-sm text-gray-600">{stats?.completedCollections || 0} collections</div>
                  </div>
                  <span className="bg-eco-green-100 text-eco-green-800 px-2.5 py-0.5 rounded-full text-xs font-medium">
                    {stats?.completedCollections || 0} / {(stats?.completedCollections || 0) + (stats?.pendingCollections || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Average Collection Time</div>
                    <div className="text-sm text-gray-600">15 minutes per collection</div>
                  </div>
                  <span className="bg-eco-green-100 text-eco-green-800 px-2.5 py-0.5 rounded-full text-xs font-medium">
                    On Target
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Waste Quality Rating</div>
                    <div className="text-sm text-gray-600">High quality recyclables</div>
                  </div>
                  <span className="bg-eco-green-100 text-eco-green-800 px-2.5 py-0.5 rounded-full text-xs font-medium">
                    4.8/5
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Route Efficiency</div>
                    <div className="text-sm text-gray-600">Optimized for minimum fuel</div>
                  </div>
                  <span className="bg-eco-green-100 text-eco-green-800 px-2.5 py-0.5 rounded-full text-xs font-medium">
                    92%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Collection History Preview */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Collections</h3>
                <button className="text-sm text-eco-green-600 hover:text-eco-green-700 font-medium">
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
              {!collectionHistory || collectionHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-2">No collections yet</div>
                  <div className="text-sm text-gray-400">Completed collections will appear here</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {collectionHistory.slice(0, 3).map((collection) => (
                    <div key={collection._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {collection.collectionDetails.type} - {collection.collectionDetails.weight}kg
                        </div>
                        <div className="text-xs text-gray-600">
                          {collection.scheduling.actualPickupDate ? 
                            new Date(collection.scheduling.actualPickupDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-eco-green-600 text-sm">
                          ₹{calculatePaymentINR ? 
                            calculatePaymentINR(collection.collectionDetails.type, collection.collectionDetails.weight, collection.collectionDetails.quality || 'fair') 
                            : '0'
                          }
                        </div>
                        <div className="text-xs text-gray-500">
                          {collection.tokenCalculation?.totalTokensIssued || 0} tokens
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectorDashboard;