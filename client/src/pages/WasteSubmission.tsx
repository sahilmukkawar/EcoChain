import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';
import wasteService, { CreateWasteSubmissionData } from '../services/wasteService.ts';

interface WasteSubmissionForm {
  wasteType: 'plastic' | 'paper' | 'metal' | 'glass' | 'electronic' | 'organic' | 'other' | '';
  quantity: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  description: string;
  pickupAddress: string;
  pickupDate: string;
  pickupTimeSlot: string;
  images: File[];
}

const WasteSubmission: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<WasteSubmissionForm>({
    wasteType: '',
    quantity: 1,
    quality: 'fair', // Default quality
    description: '',
    pickupAddress: '', // User will need to enter their address
    pickupDate: '',
    pickupTimeSlot: '',
    images: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const wasteTypes = [
    { id: 'plastic', name: 'Plastic', tokenRate: 10 },
    { id: 'paper', name: 'Paper', tokenRate: 5 },
    { id: 'glass', name: 'Glass', tokenRate: 8 },
    { id: 'metal', name: 'Metal', tokenRate: 15 },
    { id: 'electronic', name: 'Electronics', tokenRate: 20 },
    { id: 'organic', name: 'Organic', tokenRate: 3 },
    { id: 'other', name: 'Other', tokenRate: 2 }
  ];
  
  const timeSlots = [
    '08:00 - 10:00',
    '10:00 - 12:00',
    '12:00 - 14:00',
    '14:00 - 16:00',
    '16:00 - 18:00'
  ];
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // Create preview URLs for the images
      const newPreviewUrls = filesArray.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...filesArray]
      }));
    }
  };
  
  const removeImage = (index: number) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(previewUrls[index]);
    
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };
  
  const calculateEstimatedTokens = (): number => {
    if (!formData.wasteType) return 0;
    return wasteService.calculateEstimatedTokens(formData.wasteType, formData.quantity, formData.quality);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formData.wasteType || !formData.quantity || !formData.pickupAddress) {
        throw new Error('Please fill in all required fields');
      }
      
      // Create submission data
      const submissionData: CreateWasteSubmissionData = {
        wasteType: formData.wasteType as 'plastic' | 'paper' | 'metal' | 'glass' | 'electronic' | 'organic' | 'other',
        quantity: formData.quantity,
        quality: formData.quality,
        description: formData.description,
        pickupAddress: formData.pickupAddress,
        pickupDate: formData.pickupDate,
        pickupTimeSlot: formData.pickupTimeSlot,
        images: formData.images
      };
      
      // Submit waste data to the API
      const result = await wasteService.createSubmission(submissionData);
      
      console.log('Waste submission successful:', result);
      setSuccess(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit waste request. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-eco-green-light border border-eco-green text-eco-green-dark px-4 py-3 rounded relative">
          <h2 className="text-2xl font-bold mb-2">Waste Submission Successful!</h2>
          <p className="mb-2">Your request has been submitted successfully.</p>
          <p className="mb-2">Estimated EcoTokens: <strong>{calculateEstimatedTokens()}</strong></p>
          <p>You will be redirected to your dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Submit Waste for Collection</h1>
      <p className="text-gray-600 mb-6">
        Submit your recyclable waste for collection and earn EcoTokens that you can use in our marketplace.
      </p>
      
      {error && <div className="bg-eco-red-light border border-eco-red text-eco-red-dark px-4 py-3 rounded mb-4">{error}</div>}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label htmlFor="wasteType" className="block text-gray-700 text-sm font-bold mb-2">
            Waste Type
          </label>
          <select 
            id="wasteType" 
            name="wasteType" 
            value={formData.wasteType} 
            onChange={handleInputChange}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select waste type</option>
            {wasteTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label htmlFor="quantity" className="block text-gray-700 text-sm font-bold mb-2">
            Quantity (kg)
          </label>
          <input 
            type="number" 
            id="quantity" 
            name="quantity" 
            min="0.1" 
            step="0.1" 
            value={formData.quantity} 
            onChange={handleInputChange}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="quality" className="block text-gray-700 text-sm font-bold mb-2">
            Waste Quality
          </label>
          <select 
            id="quality" 
            name="quality" 
            value={formData.quality} 
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="poor">Poor</option>
            <option value="fair">Fair</option>
            <option value="good">Good</option>
            <option value="excellent">Excellent</option>
          </select>
          <p className="text-gray-600 text-xs italic mt-1">
            Quality affects the token multiplier (Poor: 0.7x, Fair: 1.0x, Good: 1.2x, Excellent: 1.5x)
          </p>
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
            Description
          </label>
          <textarea 
            id="description" 
            name="description" 
            value={formData.description} 
            onChange={handleInputChange}
            placeholder="Provide details about your waste (condition, packaging, etc.)"
            rows={4}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="pickupAddress" className="block text-gray-700 text-sm font-bold mb-2">
            Pickup Address
          </label>
          <input 
            type="text" 
            id="pickupAddress" 
            name="pickupAddress" 
            value={formData.pickupAddress} 
            onChange={handleInputChange}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="pickupDate" className="block text-gray-700 text-sm font-bold mb-2">
              Pickup Date
            </label>
            <input 
              type="date" 
              id="pickupDate" 
              name="pickupDate" 
              value={formData.pickupDate} 
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div>
            <label htmlFor="pickupTimeSlot" className="block text-gray-700 text-sm font-bold mb-2">
              Preferred Time Slot
            </label>
            <select 
              id="pickupTimeSlot" 
              name="pickupTimeSlot" 
              value={formData.pickupTimeSlot} 
              onChange={handleInputChange}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">Select time slot</option>
              {timeSlots.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="images" className="block text-gray-700 text-sm font-bold mb-2">
            Upload Images
          </label>
          <input 
            type="file" 
            id="images" 
            name="images" 
            onChange={handleImageChange}
            accept="image/*"
            multiple
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <p className="text-gray-600 text-xs italic mt-1">
            Upload clear images of your waste to help us verify the type and quantity.
          </p>
        </div>
        
        {previewUrls.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Image Previews</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img 
                    src={url} 
                    alt={`Waste preview ${index + 1}`} 
                    className="w-full h-32 object-cover rounded border"
                  />
                  <button 
                    type="button" 
                    className="absolute top-1 right-1 bg-eco-red text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-eco-red-dark"
                    onClick={() => removeImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="bg-eco-beige p-4 rounded-lg mb-6">
          <p className="text-lg">
            Estimated EcoTokens: <strong className="text-eco-green">{calculateEstimatedTokens()}</strong>
          </p>
          <p className="text-gray-600 text-sm mt-1">
            Final token amount may vary based on verification by our collectors.
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <button 
            type="submit" 
            disabled={loading}
            className={`bg-eco-green hover:bg-eco-green-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Submitting...' : 'Submit Waste Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WasteSubmission;