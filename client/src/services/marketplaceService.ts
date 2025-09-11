import api from './api.ts';

export interface MarketplaceItem {
  _id: string;
  productId: string;
  sellerId: string;
  name: string;
  description: string;
  category: string;
  price: {
    tokenAmount: number;
    fiatAmount: number;
    currency: string;
  };
  images: string[];
  status: 'active' | 'inactive' | 'sold_out' | 'pending_approval' | 'rejected';
  sustainabilityScore: number;
  inventory: {
    available: number;
    reserved: number;
    sold: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateMarketplaceItemData {
  name: string;
  description: string;
  category: string;
  price: {
    tokenAmount: number;
    fiatAmount: number;
    currency?: string;
  };
  images?: string[];
  quantity?: number;
}

const marketplaceService = {
  // Get all marketplace items
  getAllItems: async (): Promise<MarketplaceItem[]> => {
    const response = await api.get('/marketplace');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch products');
  },

  // Get marketplace item by ID
  getItemById: async (id: string): Promise<MarketplaceItem> => {
    const response = await api.get(`/marketplace/${id}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch product');
  },

  // Get user's marketplace items
  getUserItems: async (): Promise<MarketplaceItem[]> => {
    const response = await api.get('/marketplace/user');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch user products');
  },

  // Create new marketplace item
  createItem: async (itemData: CreateMarketplaceItemData): Promise<MarketplaceItem> => {
    const response = await api.post('/marketplace', itemData);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create product');
  },

  // Update marketplace item
  updateItem: async (id: string, itemData: Partial<CreateMarketplaceItemData>): Promise<MarketplaceItem> => {
    const response = await api.put(`/marketplace/${id}`, itemData);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update product');
  },

  // Delete marketplace item
  deleteItem: async (id: string): Promise<void> => {
    const response = await api.delete(`/marketplace/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete product');
    }
  },
};

export default marketplaceService;