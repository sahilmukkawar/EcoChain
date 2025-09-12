import api from './api.ts';

export interface FactoryCollection {
  _id: string;
  collectionId: string;
  userId: string;
  collectorId?: string;
  factoryId?: string;
  collectionDetails: {
    type: string;
    subType?: string;
    weight: number;
    quality?: string;
    images?: string[];
    description?: string;
  };
  location: {
    pickupAddress?: string;
  };
  scheduling: {
    requestedDate?: string;
    scheduledDate?: string;
    actualPickupDate?: string;
    preferredTimeSlot?: string;
  };
  status: 'requested' | 'scheduled' | 'in_progress' | 'collected' | 'delivered' | 'verified' | 'rejected' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface CollectionPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

const factoryService = {
  // Get factory's collections
  getFactoryCollections: async (filters: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ collections: FactoryCollection[]; pagination: CollectionPagination }> => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await api.get(`/factory/collections?${queryParams.toString()}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching factory collections:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch factory collections');
    }
  },

  // Update collection status
  updateCollectionStatus: async (collectionId: string, status: string, notes?: string): Promise<any> => {
    try {
      const response = await api.put(`/collections/${collectionId}/status`, { status, notes });
      return response.data;
    } catch (error: any) {
      console.error('Error updating collection status:', error);
      throw new Error(error.response?.data?.message || 'Failed to update collection status');
    }
  },

  // Mark collection as delivered to factory
  markAsDelivered: async (collectionId: string): Promise<any> => {
    try {
      const response = await api.post(`/collections/${collectionId}/status`, {
        status: 'delivered'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error marking collection as delivered:', error);
      throw new Error(error.response?.data?.message || 'Failed to mark collection as delivered');
    }
  },

  // Verify collection quality
  verifyCollection: async (collectionId: string, feedback: {
    qualityRating: number;
    notes?: string;
    images?: string[];
  }): Promise<any> => {
    try {
      const response = await api.post(`/collections/${collectionId}/verify`, feedback);
      return response.data;
    } catch (error: any) {
      console.error('Error verifying collection:', error);
      throw new Error(error.response?.data?.message || 'Failed to verify collection');
    }
  }
};

export default factoryService;