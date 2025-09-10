import api from './api.ts';

export interface GarbageCollection {
  _id: string;
  userId: string;
  wasteType: string;
  quantity: number;
  location: {
    type: string;
    coordinates: [number, number];
    address?: string;
  };
  imageUrl?: string;
  status: 'pending' | 'verified' | 'rejected';
  verificationDetails?: {
    verifiedBy: string;
    verifiedAt: string;
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollectionData {
  wasteType: string;
  quantity: number;
  location: {
    coordinates: [number, number];
    address?: string;
  };
  imageUrl?: string;
}

const garbageCollectionService = {
  // Get all collections for current user
  getUserCollections: async (): Promise<GarbageCollection[]> => {
    const response = await api.get<GarbageCollection[]>('/collections/user');
    return response.data;
  },

  // Get collection by ID
  getCollectionById: async (id: string): Promise<GarbageCollection> => {
    const response = await api.get<GarbageCollection>(`/collections/${id}`);
    return response.data;
  },

  // Create new collection
  createCollection: async (collectionData: CreateCollectionData): Promise<GarbageCollection> => {
    const response = await api.post<GarbageCollection>('/collections', collectionData);
    return response.data;
  },

  // Update collection
  updateCollection: async (id: string, collectionData: Partial<CreateCollectionData>): Promise<GarbageCollection> => {
    const response = await api.put<GarbageCollection>(`/collections/${id}`, collectionData);
    return response.data;
  },

  // Delete collection
  deleteCollection: async (id: string): Promise<void> => {
    await api.delete(`/collections/${id}`);
  },
};

export default garbageCollectionService;