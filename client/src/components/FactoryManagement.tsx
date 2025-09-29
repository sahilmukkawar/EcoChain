import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertCircle, 
  RefreshCw, 
  PieChart, 
  BarChart,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter
} from 'lucide-react';
import adminService, { MaterialRequest } from '../services/adminService';

interface WasteCollection {
  _id: string;
  userId: string;
  type: string;
  weight: number;
  quality: string;
  status: string;
  collectedAt: string;
}

interface WasteTypeData {
  type: string;
  weight: number;
  count: number;
}

interface QualityData {
  quality: string;
  weight: number;
  count: number;
}

interface TimeSeriesData {
  date: string;
  weight: number;
  count: number;
}

interface FulfillmentData {
  requestId: string;
  collectionId: string;
  quantity: number;
  agreedPrice: number;
}

const FactoryManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'requests' | 'waste' | 'inventory'>('requests');
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MaterialRequest[]>([]);
  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [fulfillmentData, setFulfillmentData] = useState<FulfillmentData>({
    requestId: '',
    collectionId: '',
    quantity: 0,
    agreedPrice: 0
  });
  
  // Waste analytics data
  const [wasteTypeData, setWasteTypeData] = useState<WasteTypeData[]>([]);
  const [qualityData, setQualityData] = useState<QualityData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'partially_filled' | 'fulfilled' | 'expired' | 'cancelled'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch material requests
      const requestsResponse = await adminService.getMaterialRequests();
      if (requestsResponse.success) {
        setMaterialRequests(requestsResponse.data.requests);
        setFilteredRequests(requestsResponse.data.requests);
      }
      
      // Fetch waste analytics data
      const analyticsResponse = await adminService.getCollectedWaste({});
      if (analyticsResponse.success) {
        // For demo purposes, we'll create mock data since the actual API might not return analytics data
        setWasteTypeData([
          { type: 'plastic', weight: 1250, count: 42 },
          { type: 'paper', weight: 890, count: 38 },
          { type: 'metal', weight: 620, count: 24 },
          { type: 'glass', weight: 430, count: 18 },
          { type: 'electronic', weight: 210, count: 9 }
        ]);
        
        setQualityData([
          { quality: 'high', weight: 1850, count: 65 },
          { quality: 'medium', weight: 980, count: 35 },
          { quality: 'low', weight: 570, count: 21 }
        ]);
        
        setTimeSeriesData([
          { date: '2023-01-01', weight: 120, count: 5 },
          { date: '2023-01-02', weight: 95, count: 4 },
          { date: '2023-01-03', weight: 140, count: 6 },
          { date: '2023-01-04', weight: 110, count: 5 },
          { date: '2023-01-05', weight: 155, count: 7 }
        ]);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

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
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Plastic
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    1,250 kg
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    42 collections
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        High (65%)
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Medium (25%)
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Low (10%)
                      </span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Paper
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    890 kg
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    38 collections
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        High (55%)
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Medium (35%)
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Low (10%)
                      </span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Metal
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    620 kg
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    24 collections
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        High (75%)
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Medium (20%)
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Low (5%)
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Factory Requests Tab */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search requests..."
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400" size={18} />
              <select
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="partially_filled">Partially Filled</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400" size={18} />
              <select
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="plastic">Plastic</option>
                <option value="paper">Paper</option>
                <option value="metal">Metal</option>
                <option value="glass">Glass</option>
                <option value="electronic">Electronic</option>
              </select>
            </div>
          </div>
          
          {/* Requests Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Required By
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request._id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {request.materialSpecs?.materialType || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.materialSpecs?.quantity || 0} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.timeline?.requiredBy ? new Date(request.timeline.requiredBy).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {request.status === 'open' || request.status === 'partially_filled' ? (
                        <button
                          onClick={() => {
                            setFulfillmentData({
                              ...fulfillmentData,
                              requestId: request._id,
                              quantity: request.materialSpecs?.quantity || 0
                            });
                            setShowFulfillModal(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          Fulfill
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Fulfill Material Request</h3>
            <form onSubmit={handleFulfillRequest}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Collection ID
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={fulfillmentData.collectionId}
                    onChange={(e) => setFulfillmentData({...fulfillmentData, collectionId: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={fulfillmentData.quantity}
                    onChange={(e) => setFulfillmentData({...fulfillmentData, quantity: parseFloat(e.target.value) || 0})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agreed Price (per unit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={fulfillmentData.agreedPrice}
                    onChange={(e) => setFulfillmentData({...fulfillmentData, agreedPrice: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowFulfillModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg"
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