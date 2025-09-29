import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, BarChart, PieChart } from 'lucide-react';
import adminService, { MaterialRequest } from '../services/adminService';

interface GarbageCollection {
  _id: string;
  collectionId: string;
  userId: {
    _id: string;
    personalInfo: {
      name: string;
      email: string;
    };
  } | null;
  collectorId: {
    _id: string;
    personalInfo: {
      name: string;
      email: string;
    };
  } | null;
  collectionDetails: {
    type: string;
    subType?: string;
    weight: number;
    quality: string;
    description?: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for aggregated waste data
interface AggregatedWaste {
  type: string;
  totalWeight: number;
  totalCount: number;
  qualityDistribution: Record<string, { count: number; weight: number }>;
}

const FactoryManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [collectedWaste, setCollectedWaste] = useState<GarbageCollection[]>([]);
  const [aggregatedWaste, setAggregatedWaste] = useState<AggregatedWaste[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'waste' | 'inventory'>('requests');
  const [fulfillmentData, setFulfillmentData] = useState({
    requestId: '',
    collectionId: '',
    quantity: 0,
    agreedPrice: 0
  });
  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [wasteTypeData, setWasteTypeData] = useState<Array<{type: string, count: number, weight: number}>>([]);
  const [qualityData, setQualityData] = useState<Array<{quality: string, count: number, weight: number}>>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<Array<{date: string, count: number, weight: number}>>([]);

  // Process data for charts
  const processDataForCharts = (collections: GarbageCollection[]) => {
    // Waste type distribution
    const typeMap: Record<string, {count: number, weight: number}> = {};
    collections.forEach(collection => {
      const type = collection.collectionDetails.type;
      if (!typeMap[type]) {
        typeMap[type] = { count: 0, weight: 0 };
      }
      typeMap[type].count += 1;
      typeMap[type].weight += collection.collectionDetails.weight || 0;
    });
    
    const wasteTypeData = Object.entries(typeMap).map(([type, data]) => ({
      type,
      count: data.count,
      weight: Math.round(data.weight)
    }));
    
    // Quality distribution
    const qualityMap: Record<string, {count: number, weight: number}> = {};
    collections.forEach(collection => {
      const quality = collection.collectionDetails.quality || 'unknown';
      if (!qualityMap[quality]) {
        qualityMap[quality] = { count: 0, weight: 0 };
      }
      qualityMap[quality].count += 1;
      qualityMap[quality].weight += collection.collectionDetails.weight || 0;
    });
    
    const qualityData = Object.entries(qualityMap).map(([quality, data]) => ({
      quality,
      count: data.count,
      weight: Math.round(data.weight)
    }));
    
    // Time series data (collections per day)
    const dateMap: Record<string, {count: number, weight: number}> = {};
    collections.forEach(collection => {
      const date = new Date(collection.createdAt).toISOString().split('T')[0];
      if (!dateMap[date]) {
        dateMap[date] = { count: 0, weight: 0 };
      }
      dateMap[date].count += 1;
      dateMap[date].weight += collection.collectionDetails.weight || 0;
    });
    
    const timeSeriesData = Object.entries(dateMap)
      .map(([date, data]) => ({
        date,
        count: data.count,
        weight: Math.round(data.weight)
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setWasteTypeData(wasteTypeData);
    setQualityData(qualityData);
    setTimeSeriesData(timeSeriesData);
  };

  // Aggregate waste data by type
  const aggregateWasteData = (collections: GarbageCollection[]) => {
    const aggregated: Record<string, AggregatedWaste> = {};
    
    collections.forEach(collection => {
      const type = collection.collectionDetails.type;
      const quality = collection.collectionDetails.quality || 'unknown';
      const weight = collection.collectionDetails.weight || 0;
      
      if (!aggregated[type]) {
        aggregated[type] = {
          type,
          totalWeight: 0,
          totalCount: 0,
          qualityDistribution: {}
        };
      }
      
      aggregated[type].totalWeight += weight;
      aggregated[type].totalCount += 1;
      
      if (!aggregated[type].qualityDistribution[quality]) {
        aggregated[type].qualityDistribution[quality] = { count: 0, weight: 0 };
      }
      
      aggregated[type].qualityDistribution[quality].count += 1;
      aggregated[type].qualityDistribution[quality].weight += weight;
    });
    
    setAggregatedWaste(Object.values(aggregated));
  };

  // Fetch material requests and collected waste
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch material requests
      const requestsResponse = await adminService.getMaterialRequests();
      if (requestsResponse.success) {
        setMaterialRequests(requestsResponse.data.requests);
      }
      
      // Fetch collected waste
      const wasteResponse = await adminService.getCollectedWaste();
      if (wasteResponse.success) {
        setCollectedWaste(wasteResponse.data.collections);
        processDataForCharts(wasteResponse.data.collections);
        aggregateWasteData(wasteResponse.data.collections);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Open</span>;
      case 'partially_filled':
        return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Partially Filled</span>;
      case 'fulfilled':
        return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Fulfilled</span>;
      case 'expired':
        return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Expired</span>;
      case 'cancelled':
        return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Cancelled</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Unknown</span>;
    }
  };

  // Handle fulfill request
  const handleFulfillRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.fulfillMaterialRequest(fulfillmentData.requestId, {
        collectionId: fulfillmentData.collectionId,
        quantity: fulfillmentData.quantity,
        agreedPrice: fulfillmentData.agreedPrice
      });
      
      alert('Request fulfilled successfully!');
      setShowFulfillModal(false);
      fetchData(); // Refresh data
    } catch (err: any) {
      console.error('Error fulfilling request:', err);
      alert(err.message || 'Failed to fulfill request');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="text-red-500" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Factory Management</h2>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Factory Requests
          </button>
          <button
            onClick={() => setActiveTab('waste')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'waste'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Collected Waste
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'inventory'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Inventory Overview
          </button>
        </nav>
      </div>

      {/* Charts for Collected Waste */}
      {activeTab === 'waste' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Waste Type Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="text-green-600" size={20} />
              <h3 className="font-semibold text-gray-900">Waste Type Distribution</h3>
            </div>
            <div className="space-y-3">
              {wasteTypeData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}></div>
                    <span className="text-sm text-gray-700 capitalize">{item.type}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.weight} kg ({item.count})</span>
                </div>
              ))}
              {wasteTypeData.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No data available</p>
              )}
            </div>
          </div>

          {/* Quality Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart className="text-green-600" size={20} />
              <h3 className="font-semibold text-gray-900">Quality Distribution</h3>
            </div>
            <div className="space-y-3">
              {qualityData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${index * 90}, 60%, 45%)` }}></div>
                    <span className="text-sm text-gray-700 capitalize">{item.quality}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.weight} kg ({item.count})</span>
                </div>
              ))}
              {qualityData.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No data available</p>
              )}
            </div>
          </div>

          {/* Collections Over Time */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart className="text-green-600" size={20} />
              <h3 className="font-semibold text-gray-900">Collections Over Time</h3>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {timeSeriesData.slice(-10).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.date}</span>
                  <span className="text-sm font-medium text-gray-900">{item.weight} kg ({item.count})</span>
                </div>
              ))}
              {timeSeriesData.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inventory Overview Tab */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Aggregated Waste Inventory</h3>
            <p className="text-sm text-gray-500 mt-1">Total quantities available by material type</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Collections
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quality Distribution
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {aggregatedWaste.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 capitalize">{item.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{Math.round(item.totalWeight)} kg</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.totalCount} collections</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(item.qualityDistribution).map(([quality, data]) => (
                          <span key={quality} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {quality}: {Math.round(data.weight)} kg ({data.count})
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {aggregatedWaste.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No waste inventory data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Factory Requests Tab */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Factory
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material Details
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Required By
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {materialRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{request.requestId}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.factoryId?.companyInfo?.name || request.factoryId?.name || 'Unknown Factory'}
                      </div>
                      <div className="text-xs text-gray-500">{request.factoryId?.email || 'No email'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">{request.materialSpecs.materialType}</div>
                      <div className="text-xs text-gray-500">
                        {request.materialSpecs.subType && `${request.materialSpecs.subType}, `}
                        {request.materialSpecs.qualityRequirements}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.materialSpecs.quantity} kg</div>
                      <div className="text-xs text-gray-500">
                        ±{request.timeline.flexibilityDays} days flexibility
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{request.pricing.totalBudget.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        ₹{request.pricing.budgetPerKg}/kg
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(request.timeline.requiredBy).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setFulfillmentData({
                            requestId: request._id,
                            collectionId: '',
                            quantity: request.materialSpecs.quantity,
                            agreedPrice: request.pricing.totalBudget
                          });
                          setShowFulfillModal(true);
                        }}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Fulfill
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Collected Waste Tab */}
      {activeTab === 'waste' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collection ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collector
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Waste Details
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {collectedWaste.map((collection) => (
                  <tr key={collection._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{collection.collectionId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{collection.userId?.personalInfo?.name || 'Unknown User'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{collection.collectorId?.personalInfo?.name || 'Unknown Collector'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">{collection.collectionDetails.type}</div>
                      <div className="text-xs text-gray-500">
                        {collection.collectionDetails.subType && `${collection.collectionDetails.subType}, `}
                        {collection.collectionDetails.weight} kg • {collection.collectionDetails.quality}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {collection.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(collection.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fulfill Request Modal */}
      {showFulfillModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Fulfill Material Request</h3>
            <form onSubmit={handleFulfillRequest}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Collection ID</label>
                  <select
                    value={fulfillmentData.collectionId}
                    onChange={(e) => setFulfillmentData({...fulfillmentData, collectionId: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Select a collection</option>
                    {collectedWaste.map(collection => (
                      <option key={collection._id} value={collection._id}>
                        {collection.collectionId} - {collection.collectionDetails.type} 
                        {collection.collectionDetails.subType && `(${collection.collectionDetails.subType})`} 
                        ({collection.collectionDetails.weight} kg, {collection.collectionDetails.quality})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg)</label>
                  <input
                    type="number"
                    value={fulfillmentData.quantity}
                    onChange={(e) => setFulfillmentData({...fulfillmentData, quantity: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agreed Price (₹)</label>
                  <input
                    type="number"
                    value={fulfillmentData.agreedPrice}
                    onChange={(e) => setFulfillmentData({...fulfillmentData, agreedPrice: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                    min="0"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowFulfillModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  Fulfill Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FactoryManagement;
