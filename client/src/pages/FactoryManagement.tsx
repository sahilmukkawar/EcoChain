import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';
import factoryService, { MaterialRequest } from '../services/factoryService';
import { Loader2, CheckCircle, AlertCircle, Clock, Package, Factory, Recycle } from 'lucide-react';

interface WasteCollection {
  _id: string;
  collectionId: string;
  userId: {
    personalInfo: {
      name: string;
    }
  };
  collectorId: {
    personalInfo: {
      name: string;
    }
  };
  collectionDetails: {
    type: string;
    subType?: string;
    weight: number;
    quality: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

const FactoryManagement: React.FC = () => {
  const { user } = useAuth();
  const [wasteCollections, setWasteCollections] = useState<WasteCollection[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('waste-collections');
  
  // Fulfill request dialog state
  const [fulfillDialogOpen, setFulfillDialogOpen] = useState<boolean>(false);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [fulfillQuantity, setFulfillQuantity] = useState<number>(0);
  const [agreedPrice, setAgreedPrice] = useState<number>(0);
  const [fulfillLoading, setFulfillLoading] = useState<boolean>(false);
  const [filteredCollections, setFilteredCollections] = useState<WasteCollection[]>([]);

  // Fetch waste collections and material requests
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch waste collections
        const collectionsResponse = await fetch('/api/admin/waste-collections');
        if (!collectionsResponse.ok) {
          throw new Error('Failed to fetch waste collections');
        }
        const collectionsData = await collectionsResponse.json();
        setWasteCollections(collectionsData.data.collections || []);
        
        // Fetch material requests
        const requestsData = await factoryService.getMaterialRequests();
        setMaterialRequests(requestsData.data || []);
        
        setError(null);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
        
        // Fallback to mock data for development
        setWasteCollections([
          {
            _id: 'wc1',
            collectionId: 'COL123456',
            userId: {
              personalInfo: {
                name: 'John Doe'
              }
            },
            collectorId: {
              personalInfo: {
                name: 'Collector 1'
              }
            },
            collectionDetails: {
              type: 'plastic',
              subType: 'PET',
              weight: 25,
              quality: 'good'
            },
            status: 'collected',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            _id: 'wc2',
            collectionId: 'COL123457',
            userId: {
              personalInfo: {
                name: 'Jane Smith'
              }
            },
            collectorId: {
              personalInfo: {
                name: 'Collector 2'
              }
            },
            collectionDetails: {
              type: 'paper',
              weight: 15,
              quality: 'excellent'
            },
            status: 'collected',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Open fulfill dialog and filter collections by material type
  const handleOpenFulfillDialog = (request: MaterialRequest) => {
    setSelectedRequest(request);
    
    // Filter collections by material type
    const filtered = wasteCollections.filter(
      collection => 
        collection.collectionDetails.type === request.materialSpecs.materialType &&
        collection.status === 'collected'
    );
    
    setFilteredCollections(filtered);
    setFulfillDialogOpen(true);
    
    // Reset form values
    setSelectedCollection('');
    setFulfillQuantity(0);
    setAgreedPrice(0);
  };

  // Handle fulfill request submission
  const handleFulfillRequest = async () => {
    if (!selectedRequest || !selectedCollection || fulfillQuantity <= 0 || agreedPrice <= 0) {
      return;
    }

    try {
      setFulfillLoading(true);
      
      // Call API to fulfill request
      await adminService.fulfillMaterialRequest(
        selectedRequest._id,
        {
          collectionId: selectedCollection,
          quantity: fulfillQuantity,
          agreedPrice: agreedPrice
        }
      );
      
      // Update local state
      setMaterialRequests(prevRequests => 
        prevRequests.map(req => 
          req._id === selectedRequest._id
            ? {
                ...req,
                status: fulfillQuantity >= selectedRequest.materialSpecs.quantity 
                  ? 'fulfilled' 
                  : 'partially_filled',
                matchedCollections: [
                  ...req.matchedCollections || [],
                  {
                    collectionId: selectedCollection,
                    quantity: fulfillQuantity,
                    agreedPrice: agreedPrice,
                    status: 'pending'
                  }
                ]
              }
            : req
        )
      );
      
      // Close dialog
      setFulfillDialogOpen(false);
      setSelectedRequest(null);
    } catch (err) {
      console.error('Error fulfilling request:', err);
      setError('Failed to fulfill request. Please try again.');
    } finally {
      setFulfillLoading(false);
    }
  };

  // Get status badge for material requests
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Open
        </span>;
      case 'partially_filled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          Partially Filled
        </span>;
      case 'fulfilled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Fulfilled
        </span>;
      case 'expired':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Expired
        </span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Cancelled
        </span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>;
    }
  };

  // Get waste type icon
  const getWasteTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'plastic':
        return <Recycle className="h-5 w-5 text-blue-500" />;
      case 'paper':
        return <Recycle className="h-5 w-5 text-yellow-600" />;
      case 'metal':
        return <Recycle className="h-5 w-5 text-gray-600" />;
      case 'glass':
        return <Recycle className="h-5 w-5 text-teal-500" />;
      case 'electronic':
        return <Recycle className="h-5 w-5 text-purple-500" />;
      default:
        return <Recycle className="h-5 w-5 text-green-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-eco-green-600" />
        <span className="ml-2 text-lg font-medium">Loading...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Factory Management</h1>
        <p className="mt-2 text-gray-600">
          Manage waste collections and factory material requests
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800">
          <div className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Simple tab implementation */}
      <div className="w-full">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'waste-collections'
                  ? 'border-eco-green-500 text-eco-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('waste-collections')}
            >
              <Package className="inline-block mr-2 h-5 w-5" />
              Waste Collections
            </button>
            <button
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'material-requests'
                  ? 'border-eco-green-500 text-eco-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('material-requests')}
            >
              <Factory className="inline-block mr-2 h-5 w-5" />
              Material Requests
            </button>
          </nav>
        </div>

        {/* Waste Collections Tab */}
        {activeTab === 'waste-collections' && (
          <div className="rounded-lg border bg-white shadow-sm mt-6">
            <div className="border-b bg-gray-50 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Collected Waste</h2>
              <p className="text-sm text-gray-500">
                Waste collected by collectors that can be assigned to factories
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Collection ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Waste Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Weight (kg)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Quality
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Collector
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Date Collected
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {wasteCollections.length > 0 ? (
                    wasteCollections.map((collection) => (
                      <tr key={collection._id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {collection.collectionId}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            {getWasteTypeIcon(collection.collectionDetails.type)}
                            <span className="ml-2 capitalize">
                              {collection.collectionDetails.type}
                              {collection.collectionDetails.subType && ` (${collection.collectionDetails.subType})`}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {collection.collectionDetails.weight}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          <span className="capitalize">{collection.collectionDetails.quality}</span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {collection.collectorId?.personalInfo?.name || 'Unknown'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {new Date(collection.updatedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No waste collections found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Material Requests Tab */}
        {activeTab === 'material-requests' && (
          <div className="rounded-lg border bg-white shadow-sm mt-6">
            <div className="border-b bg-gray-50 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Factory Material Requests</h2>
              <p className="text-sm text-gray-500">
                Requests from factories for recycled materials
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Request ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Factory
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Material
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Quantity (kg)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Budget
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Required By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {materialRequests.length > 0 ? (
                    materialRequests.map((request) => (
                      <tr key={request._id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {request.requestId}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {request.factoryId?.companyInfo?.name || request.factoryId?.name || 'Unknown'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            {getWasteTypeIcon(request.materialSpecs.materialType)}
                            <span className="ml-2 capitalize">
                              {request.materialSpecs.materialType}
                              {request.materialSpecs.subType && ` (${request.materialSpecs.subType})`}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {request.materialSpecs.quantity}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          ${request.pricing.budgetPerKg}/kg (Total: ${request.pricing.totalBudget})
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {new Date(request.timeline.requiredBy).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {request.status !== 'fulfilled' && request.status !== 'cancelled' && (
                            <button 
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-eco-green-700 bg-eco-green-100 hover:bg-eco-green-200"
                              onClick={() => handleOpenFulfillDialog(request)}
                            >
                              Fulfill Request
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        No material requests found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Fulfill Request Modal */}
      {fulfillDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl sm:max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Fulfill Material Request</h3>
            </div>
            
            <div className="px-6 py-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="collection" className="text-right text-sm font-medium text-gray-700">
                    Collection
                  </label>
                  <div className="col-span-3">
                    <select
                      id="collection"
                      value={selectedCollection}
                      onChange={(e) => setSelectedCollection(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-eco-green-500 focus:border-eco-green-500 sm:text-sm rounded-md"
                    >
                      <option value="">Select a waste collection</option>
                      {filteredCollections.length > 0 ? (
                        filteredCollections.map((collection) => (
                          <option key={collection._id} value={collection._id}>
                            {collection.collectionId} - {collection.collectionDetails.weight}kg {collection.collectionDetails.type}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No matching collections available
                        </option>
                      )}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="quantity" className="text-right text-sm font-medium text-gray-700">
                    Quantity (kg)
                  </label>
                  <div className="col-span-3">
                    <input
                      id="quantity"
                      type="number"
                      value={fulfillQuantity || ''}
                      onChange={(e) => setFulfillQuantity(Number(e.target.value))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-eco-green-500 focus:border-eco-green-500 sm:text-sm"
                      min={0}
                      max={selectedRequest?.materialSpecs.quantity || 0}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="price" className="text-right text-sm font-medium text-gray-700">
                    Price per kg ($)
                  </label>
                  <div className="col-span-3">
                    <input
                      id="price"
                      type="number"
                      value={agreedPrice || ''}
                      onChange={(e) => setAgreedPrice(Number(e.target.value))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-eco-green-500 focus:border-eco-green-500 sm:text-sm"
                      min={0}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => setFulfillDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFulfillRequest}
                disabled={!selectedCollection || fulfillQuantity <= 0 || agreedPrice <= 0 || fulfillLoading}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                  !selectedCollection || fulfillQuantity <= 0 || agreedPrice <= 0 || fulfillLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-eco-green-600 hover:bg-eco-green-700'
                }`}
              >
                {fulfillLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Fulfill Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FactoryManagement;