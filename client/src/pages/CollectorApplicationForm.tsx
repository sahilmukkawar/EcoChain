import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CollectorApplicationForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    companyName: '',
    serviceArea: [''], // Array of service areas
    vehicleDetails: '',
    licenseNumber: '',
    contactPerson: {
      name: user?.name || '',
      email: user?.email || '',
      phone: ''
    },
    businessDetails: {
      establishedYear: '',
      website: '',
      description: ''
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        // Create a copy of the previous state
        const newState = { ...prev };
        
        // Handle nested objects
        if (parent === 'contactPerson') {
          newState.contactPerson = { ...prev.contactPerson, [child]: value };
        } else if (parent === 'businessDetails') {
          newState.businessDetails = { ...prev.businessDetails, [child]: value };
        }
        
        return newState;
      });
    } else if (name === 'serviceArea') {
      // Handle service area as an array
      setFormData(prev => ({
        ...prev,
        serviceArea: [value] // For simplicity, we're using a single service area
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/auth/collector-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Collector application submitted successfully! Awaiting admin approval.');
        // Redirect to pending approval page after a delay
        setTimeout(() => {
          navigate('/pending-approval');
        }, 3000);
      } else {
        setError(data.message || 'Failed to submit collector application');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit collector application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 max-w-2xl mx-auto">
      <div className="w-full bg-white rounded-xl shadow-md border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">
          Collector Application
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Please provide your collector details for admin approval
        </p>
        
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center mb-6">
            <span className="text-red-500 mr-2">⚠️</span>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 flex items-center mb-6">
            <span className="text-green-500 mr-2">✅</span>
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
          {/* Company Information */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {/* Service Area */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Area</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Area *</label>
                <input
                  type="text"
                  name="serviceArea"
                  value={formData.serviceArea[0] || ''}
                  onChange={handleChange}
                  required
                  placeholder="Enter city or area name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Enter the primary city or area where you provide services</p>
              </div>
            </div>
          </div>
          
          {/* Vehicle Details */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Details</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Details *</label>
                <textarea
                  name="vehicleDetails"
                  value={formData.vehicleDetails}
                  onChange={handleChange}
                  required
                  rows={3}
                  placeholder="Describe your vehicle(s) - type, capacity, registration, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {/* Contact Person */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Person</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="contactPerson.name"
                  value={formData.contactPerson.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="contactPerson.email"
                  value={formData.contactPerson.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  name="contactPerson.phone"
                  value={formData.contactPerson.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {/* Business Details */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
                <input
                  type="number"
                  name="businessDetails.establishedYear"
                  value={formData.businessDetails.establishedYear}
                  onChange={handleChange}
                  min="1800"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  name="businessDetails.website"
                  value={formData.businessDetails.website}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
                <textarea
                  name="businessDetails.description"
                  value={formData.businessDetails.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-green-500 to-teal-400 hover:from-green-600 hover:to-teal-500 text-white font-medium py-3 rounded-lg shadow-sm hover:shadow transition-all duration-300 disabled:opacity-50 transform hover:-translate-y-0.5"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2 animate-spin"></span>
                Submitting Application...
              </span>
            ) : 'Submit Collector Application'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CollectorApplicationForm;