import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Leaf, Recycle, Factory, AlertCircle, CheckCircle, Clock, Plus, Search } from 'lucide-react';
import factoryService from '../services/factoryService.ts';

import { MaterialRequest } from '../services/factoryService.ts';

const Materials: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'create'>('requests');

  // Form state
  const [formData, setFormData] = useState({
    materialType: 'plastic',
    subType: '',
    quantity: 10,
    qualityRequirements: 'fair',
    budgetPerKg: 10,
    totalBudget: 100,
    requiredBy: '',
    flexibilityDays: 7,
    deliveryAddress: '',
    transportationMode: 'pickup',
    specialHandling: '',
    priority: 'medium'
  });

  // Set default delivery address when user data is available
  useEffect(() => {
    if (user?.address) {
      let addressStr = '';
      if (typeof user.address === 'string') {
        addressStr = user.address;
      } else {
        const parts = [
          user.address.street,
          user.address.city,
          user.address.state,
          user.address.zipCode,
          user.address.country
        ].filter(Boolean);
        addressStr = parts.join(', ');
      }
      
      setFormData(prev => ({
        ...prev,
        deliveryAddress: addressStr
      }));
    }
  }, [user]);

  // Material types for the dropdown
  const materialTypes = [
    { value: 'plastic', label: 'Plastic' },
    { value: 'paper', label: 'Paper' },
    { value: 'metal', label: 'Metal' },
    { value: 'glass', label: 'Glass' },
    { value: 'electronic', label: 'Electronic Waste' },
    { value: 'organic', label: 'Organic Waste' },
    { value: 'textile', label: 'Textile' },
    { value: 'rubber', label: 'Rubber' }
  ];

  // Quality options
  const qualityOptions = [
    { value: 'poor', label: 'Poor' },
    { value: 'fair', label: 'Fair' },
    { value: 'good', label: 'Good' },
    { value: 'excellent', label: 'Excellent' }
  ];

  // Payment terms options
  const paymentTermsOptions = [
    { value: 'advance', label: 'Advance Payment' },
    { value: 'on_delivery', label: 'On Delivery' },
    { value: '15_days', label: 'Within 15 Days' },
    { value: '30_days', label: 'Within 30 Days' }
  ];

  // Transportation mode options
  const transportationOptions = [
    { value: 'pickup', label: 'Collector Pickup' },
    { value: 'delivery', label: 'Factory Delivery' },
    { value: 'both', label: 'Both Options' }
  ];

  // Priority options
  const priorityOptions = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' }
  ];

  // Fetch material requests
  const fetchRequests = async () => {
    try {
      setLoading(true);
      // Make API call to fetch material requests
      const response = await factoryService.getMaterialRequests();
      if (response.success && Array.isArray(response.data)) {
        setRequests(response.data);
      } else {
        throw new Error('Invalid response format');
      }
      setError(null);
    } catch (err: any) {
      console.error('Error fetching material requests:', err);
      setError('Failed to load material requests');
      // Fallback to mock data if API fails
      const mockRequests: MaterialRequest[] = [
        {
          _id: '1',
          requestId: 'MR001',
          factoryId: {
            _id: 'factory1',
            name: 'Test Factory',
            email: 'factory@test.com'
          },
          materialSpecs: {
            materialType: 'plastic',
            subType: 'PET',
            quantity: 50,
            qualityRequirements: 'good'
          },
          timeline: {
            requestDate: new Date().toISOString(),
            requiredBy: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            flexibilityDays: 7
          },
          pricing: {
            budgetPerKg: 12,
            totalBudget: 600,
            paymentTerms: 'on_delivery'
          },
          logistics: {
            deliveryAddress: '123 Factory St, Industrial Area',
            transportationMode: 'pickup'
          },
          status: 'open',
          matchedCollections: [],
          priority: 'medium',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setRequests(mockRequests);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'budgetPerKg' || name === 'totalBudget' || name === 'flexibilityDays' 
        ? Number(value) 
        : value
    }));

    // Auto-calculate total budget
    if (name === 'quantity' || name === 'budgetPerKg') {
      const quantity = name === 'quantity' ? Number(value) : formData.quantity;
      const budgetPerKg = name === 'budgetPerKg' ? Number(value) : formData.budgetPerKg;
      setFormData(prev => ({
        ...prev,
        totalBudget: quantity * budgetPerKg
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare data for API
      const requestData = {
        materialSpecs: {
          materialType: formData.materialType,
          subType: formData.subType || undefined,
          quantity: formData.quantity,
          qualityRequirements: formData.qualityRequirements,
        },
        timeline: {
          requiredBy: new Date(formData.requiredBy).toISOString(),
          flexibilityDays: formData.flexibilityDays
        },
        pricing: {
          budgetPerKg: formData.budgetPerKg,
          totalBudget: formData.totalBudget,
          paymentTerms: 'on_delivery' // Default value
        },
        logistics: {
          deliveryAddress: formData.deliveryAddress,
          transportationMode: formData.transportationMode,
          specialHandling: formData.specialHandling || undefined
        },
        priority: formData.priority
      };

      // Make API call to submit material request
      const response = await factoryService.createMaterialRequest(requestData);
      console.log('Material request submitted:', response);
      
      // Show success message
      alert('Material request submitted successfully!');
      setShowForm(false);
      
      // Refresh the requests list
      fetchRequests();
      
      // Reset form
      setFormData({
        materialType: 'plastic',
        subType: '',
        quantity: 10,
        qualityRequirements: 'fair',
        budgetPerKg: 10,
        totalBudget: 100,
        requiredBy: '',
        flexibilityDays: 7,
        deliveryAddress: '',
        transportationMode: 'pickup',
        specialHandling: '',
        priority: 'medium'
      });
    } catch (err) {
      console.error('Error submitting material request:', err);
      alert('Failed to submit material request');
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading material requests...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Materials Management</h1>
              <p className="text-sm text-gray-500">Request and track raw materials for production</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              <Plus size={16} />
              {showForm ? 'Cancel Request' : 'New Request'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-500" size={20} />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Request Form */}
        {showForm && (
          <div className="mb-8 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">New Material Request</h2>
              <p className="text-sm text-gray-500 mt-1">Fill in the details for your material request</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Material Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Material Type</label>
                  <select
                    name="materialType"
                    value={formData.materialType}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {materialTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Sub Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sub Type (Optional)</label>
                  <input
                    type="text"
                    name="subType"
                    value={formData.subType}
                    onChange={handleInputChange}
                    placeholder="e.g., PET, HDPE, etc."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity (kg)</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Quality Requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quality Requirements</label>
                  <select
                    name="qualityRequirements"
                    value={formData.qualityRequirements}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {qualityOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Budget Per Kg */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget Per Kg (₹)</label>
                  <input
                    type="number"
                    name="budgetPerKg"
                    value={formData.budgetPerKg}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Total Budget */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Budget (₹)</label>
                  <input
                    type="number"
                    name="totalBudget"
                    value={formData.totalBudget}
                    readOnly
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none"
                  />
                </div>

                {/* Required By Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Required By</label>
                  <input
                    type="date"
                    name="requiredBy"
                    value={formData.requiredBy}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Flexibility Days */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Flexibility (Days)</label>
                  <input
                    type="number"
                    name="flexibilityDays"
                    value={formData.flexibilityDays}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {priorityOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Transportation Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transportation Mode</label>
                  <select
                    name="transportationMode"
                    value={formData.transportationMode}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {transportationOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address</label>
                <textarea
                  name="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter the full delivery address"
                />
              </div>

              {/* Special Handling */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Special Handling Instructions (Optional)</label>
                <textarea
                  name="specialHandling"
                  value={formData.specialHandling}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Any special handling requirements"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Requests Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Material Requests</h2>
            <p className="text-sm text-gray-500 mt-1">View and manage your material requests</p>
          </div>
          
          {requests && requests.length === 0 ? (
            <div className="p-12 text-center">
              <Recycle className="mx-auto text-gray-400" size={48} />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No material requests</h3>
              <p className="mt-2 text-gray-500">Get started by creating your first material request.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all shadow-sm hover:shadow-md"
              >
                <Plus size={16} />
                Create Request
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests && requests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.requestId}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {request.materialSpecs.materialType}
                        </div>
                        {request.materialSpecs.subType && (
                          <div className="text-xs text-gray-500">
                            {request.materialSpecs.subType}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.materialSpecs.quantity} kg</div>
                        <div className="text-xs text-gray-500 capitalize">
                          {request.materialSpecs.qualityRequirements}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{request.pricing.totalBudget}
                        </div>
                        <div className="text-xs text-gray-500">
                          ₹{request.pricing.budgetPerKg}/kg
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(request.timeline.requiredBy).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {request.timeline.flexibilityDays} days flexibility
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-green-600 hover:text-green-900">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Materials;