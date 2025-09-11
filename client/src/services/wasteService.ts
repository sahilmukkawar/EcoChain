// services/wasteService.ts
import api from './api.ts';

// Interface matching the database schema exactly
export interface CreateWasteSubmissionData {
  wasteType: 'plastic' | 'paper' | 'metal' | 'glass' | 'electronic' | 'organic' | 'other'; // matches collectionDetails.type enum
  quantity: number; // maps to collectionDetails.weight
  quality?: 'poor' | 'fair' | 'good' | 'excellent'; // matches collectionDetails.quality enum
  description?: string; // maps to collectionDetails.description
  pickupAddress: string; // maps to location.pickupAddress
  pickupDate: string; // maps to scheduling.requestedDate
  pickupTimeSlot: string; // maps to scheduling.preferredTimeSlot
  images?: File[]; // maps to collectionDetails.images
}

// Database response interface
export interface WasteSubmission {
  _id: string;
  collectionId: string;
  userId: string;
  collectionDetails: {
    type: string;
    subType?: string;
    weight: number;
    quality: string;
    images: string[];
    description: string;
  };
  location: {
    pickupAddress: string;
    coordinates?: {
      type: 'Point';
      coordinates: [number, number];
    };
  };
  scheduling: {
    requestedDate: Date;
    scheduledDate?: Date;
    actualPickupDate?: Date;
    preferredTimeSlot: string;
  };
  status: 'requested' | 'scheduled' | 'in_progress' | 'collected' | 'delivered' | 'verified' | 'rejected' | 'completed';
  tokenCalculation?: {
    baseRate: number;
    qualityMultiplier: number;
    bonusTokens: number;
    totalTokensIssued: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WasteSubmissionResponse {
  success: boolean;
  message: string;
  data: WasteSubmission;
}

class WasteService {
  private baseURL = '/collections'; // Matches the route path

  // Calculate estimated tokens based on waste type and quantity (matches database model logic)
  calculateEstimatedTokens(wasteType: string, quantity: number, quality: string = 'fair'): number {
    // Base rates matching database model
    const tokenRates: { [key: string]: number } = {
      'plastic': 10,
      'paper': 5, 
      'metal': 15,
      'glass': 8,
      'electronic': 20,
      'organic': 3,
      'other': 2
    };

    // Quality multipliers matching database model
    const qualityMultipliers: { [key: string]: number } = {
      'excellent': 1.5,
      'good': 1.2,
      'fair': 1.0,
      'poor': 0.7
    };

    const baseRate = tokenRates[wasteType] || tokenRates['other'];
    const qualityMultiplier = qualityMultipliers[quality] || qualityMultipliers['fair'];
    const baseTokens = baseRate * quantity;
    
    return Math.round(baseTokens * qualityMultiplier);
  }

  // Create a new waste submission
  async createSubmission(data: CreateWasteSubmissionData): Promise<WasteSubmissionResponse> {
    try {
      // Create FormData to handle file uploads
      const formData = new FormData();
      
      // Map frontend data to exact database schema fields
      formData.append('type', data.wasteType); // collectionDetails.type
      formData.append('weight', data.quantity.toString()); // collectionDetails.weight
      formData.append('preferredTimeSlot', data.pickupTimeSlot); // scheduling.preferredTimeSlot
      formData.append('pickupDate', data.pickupDate); // scheduling.requestedDate
      
      // Optional fields
      if (data.quality) {
        formData.append('quality', data.quality); // collectionDetails.quality
      }
      
      if (data.description) {
        formData.append('description', data.description); // collectionDetails.description
      }
      
      // Handle location as JSON string (exactly as backend expects)
      const location = {
        address: data.pickupAddress, // location.pickupAddress
        coordinates: null // No GPS coordinates for now
      };
      formData.append('location', JSON.stringify(location));

      // Add images if present (maps to collectionDetails.images)
      if (data.images && data.images.length > 0) {
        data.images.forEach((image) => {
          formData.append('images', image);
        });
      }

      // Make the API request
      const response = await api.post(this.baseURL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Waste service error:', error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message || 'Failed to create waste submission';
        throw new Error(errorMessage);
      } else if (error.request) {
        // Network error
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        // Other errors
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  }

  // Get all user submissions
  async getUserSubmissions(page: number = 1, limit: number = 10, status?: string) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (status) {
        params.append('status', status);
      }

      const response = await api.get(`${this.baseURL}?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Get submissions error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch submissions');
    }
  }

  // Get submission by ID
  async getSubmissionById(id: string) {
    try {
      const response = await api.get(`${this.baseURL}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get submission error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch submission');
    }
  }

  // Update submission (only for requested status)
  async updateSubmission(id: string, updateData: Partial<CreateWasteSubmissionData>) {
    try {
      const response = await api.put(`${this.baseURL}/${id}`, updateData);
      return response.data;
    } catch (error: any) {
      console.error('Update submission error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update submission');
    }
  }

  // Delete submission (only for requested status)
  async deleteSubmission(id: string) {
    try {
      const response = await api.delete(`${this.baseURL}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete submission error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete submission');
    }
  }

  // Collector-specific methods
  
  // Get available collections for collectors (requested status)
  async getAvailableCollections(page: number = 1, limit: number = 10) {
    try {
      const params = new URLSearchParams({
        status: 'requested',
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await api.get(`${this.baseURL}?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Get available collections error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch available collections');
    }
  }

  // Get collections assigned to the current collector
  async getMyAssignedCollections(page: number = 1, limit: number = 10) {
    try {
      const params = new URLSearchParams({
        assignedToMe: 'true',
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await api.get(`${this.baseURL}?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Get assigned collections error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch assigned collections');
    }
  }

  // Assign collector to a collection
  async assignCollector(collectionId: string) {
    try {
      const response = await api.post(`${this.baseURL}/${collectionId}/assign`);
      return response.data;
    } catch (error: any) {
      console.error('Assign collector error:', error);
      throw new Error(error.response?.data?.message || 'Failed to assign collector');
    }
  }

  // Update collection status
  async updateCollectionStatus(collectionId: string, status: string, notes?: string) {
    try {
      const response = await api.put(`${this.baseURL}/${collectionId}/status`, {
        status,
        notes
      });
      return response.data;
    } catch (error: any) {
      console.error('Update collection status error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update collection status');
    }
  }

  // Complete a collection and issue tokens
  async completeCollection(collectionId: string, completionData?: any) {
    try {
      const response = await api.post(`${this.baseURL}/${collectionId}/complete`, completionData || {});
      return response.data;
    } catch (error: any) {
      console.error('Complete collection error:', error);
      throw new Error(error.response?.data?.message || 'Failed to complete collection');
    }
  }

  // Mark collection as collected (collector action)
  async markAsCollected(collectionId: string) {
    try {
      const response = await api.post(`${this.baseURL}/${collectionId}/collected`);
      return response.data;
    } catch (error: any) {
      console.error('Mark as collected error:', error);
      throw new Error(error.response?.data?.message || 'Failed to mark collection as collected');
    }
  }
}

const wasteService = new WasteService();
export default wasteService;