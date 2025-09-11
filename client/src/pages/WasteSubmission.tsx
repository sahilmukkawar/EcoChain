import React, { useState } from 'react';
import { useAuth } from '../mockHooks.tsx';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import './WasteSubmission.css';
// Mock wasteService
const wasteService = {
  submitWaste: async (data: any) => {
    return { success: true, message: 'Waste submission successful' };
  },
  calculateEstimatedTokens: (wasteType: string, quantity: number) => {
    const wasteTypeMap: {[key: string]: number} = {
      'plastic': 5,
      'paper': 3,
      'glass': 4,
      'metal': 6,
      'electronics': 10,
      'organic': 2,
      'other': 1
    };
    return Math.round(wasteTypeMap[wasteType] * quantity);
  },
  createSubmission: async (data: any) => {
    return { success: true, message: 'Waste submission successful' };
  }
};

interface WasteSubmissionForm {
  wasteType: string;
  quantity: number;
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
    description: '',
    pickupAddress: user?.address || '',
    pickupDate: '',
    pickupTimeSlot: '',
    images: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const wasteTypes = [
    { id: 'plastic', name: 'Plastic', tokenRate: 5 },
    { id: 'paper', name: 'Paper', tokenRate: 3 },
    { id: 'glass', name: 'Glass', tokenRate: 4 },
    { id: 'metal', name: 'Metal', tokenRate: 6 },
    { id: 'electronics', name: 'Electronics', tokenRate: 10 },
    { id: 'organic', name: 'Organic', tokenRate: 2 },
    { id: 'other', name: 'Other', tokenRate: 1 }
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
    return wasteService.calculateEstimatedTokens(formData.wasteType, formData.quantity);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Submit waste data to the API
      await wasteService.createSubmission({
        wasteType: formData.wasteType,
        quantity: formData.quantity,
        description: formData.description,
        pickupAddress: formData.pickupAddress,
        pickupDate: formData.pickupDate,
        pickupTimeSlot: formData.pickupTimeSlot,
        images: formData.images
      });
      
      // Simulate success
      setSuccess(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError('Failed to submit waste request. Please try again.');
      console.error('Submission error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <div className="success-container">
        <div className="success-message">
          <h2>Waste Submission Successful!</h2>
          <p>Your request has been submitted successfully.</p>
          <p>Estimated EcoTokens: <strong>{calculateEstimatedTokens()}</strong></p>
          <p>You will be redirected to your dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="waste-submission-container">
      <h1>Submit Waste for Collection</h1>
      <p className="submission-intro">
        Submit your recyclable waste for collection and earn EcoTokens that you can use in our marketplace.
      </p>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="waste-submission-form">
        <div className="form-group">
          <label htmlFor="wasteType">Waste Type</label>
          <select 
            id="wasteType" 
            name="wasteType" 
            value={formData.wasteType} 
            onChange={handleInputChange}
            required
          >
            <option value="">Select waste type</option>
            {wasteTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="quantity">Quantity (kg)</label>
          <input 
            type="number" 
            id="quantity" 
            name="quantity" 
            min="0.1" 
            step="0.1" 
            value={formData.quantity} 
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea 
            id="description" 
            name="description" 
            value={formData.description} 
            onChange={handleInputChange}
            placeholder="Provide details about your waste (condition, packaging, etc.)"
            rows={4}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="pickupAddress">Pickup Address</label>
          <input 
            type="text" 
            id="pickupAddress" 
            name="pickupAddress" 
            value={formData.pickupAddress} 
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="pickupDate">Pickup Date</label>
            <input 
              type="date" 
              id="pickupDate" 
              name="pickupDate" 
              value={formData.pickupDate} 
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="pickupTimeSlot">Preferred Time Slot</label>
            <select 
              id="pickupTimeSlot" 
              name="pickupTimeSlot" 
              value={formData.pickupTimeSlot} 
              onChange={handleInputChange}
              required
            >
              <option value="">Select time slot</option>
              {timeSlots.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="images">Upload Images</label>
          <input 
            type="file" 
            id="images" 
            name="images" 
            onChange={handleImageChange}
            accept="image/*"
            multiple
          />
          <p className="form-help">Upload clear images of your waste to help us verify the type and quantity.</p>
        </div>
        
        {previewUrls.length > 0 && (
          <div className="image-previews">
            {previewUrls.map((url, index) => (
              <div key={index} className="image-preview-container">
                <img src={url} alt={`Waste preview ${index + 1}`} className="image-preview" />
                <button 
                  type="button" 
                  className="remove-image-btn" 
                  onClick={() => removeImage(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="token-estimate">
          <p>Estimated EcoTokens: <strong>{calculateEstimatedTokens()}</strong></p>
          <p className="token-info">Final token amount may vary based on verification by our collectors.</p>
        </div>
        
        <button 
          type="submit" 
          className="submit-button" 
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Waste Request'}
        </button>
      </form>
    </div>
  );
};

export default WasteSubmission;