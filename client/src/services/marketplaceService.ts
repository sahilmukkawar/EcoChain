import api from './api.ts';

export interface MarketplaceItem {
  _id: string;
  sellerId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  imageUrl?: string;
  status: 'available' | 'sold' | 'reserved';
  createdAt: string;
  updatedAt: string;
}

export interface CreateMarketplaceItemData {
  title: string;
  description: string;
  category: string;
  price: number;
  imageUrl?: string;
}

const marketplaceService = {
  // Get all marketplace items
  getAllItems: async (): Promise<MarketplaceItem[]> => {
    const response = await api.get<MarketplaceItem[]>('/marketplace');
    return response.data;
  },

  // Get marketplace item by ID
  getItemById: async (id: string): Promise<MarketplaceItem> => {
    const response = await api.get<MarketplaceItem>(`/marketplace/${id}`);
    return response.data;
  },

  // Get user's marketplace items
  getUserItems: async (): Promise<MarketplaceItem[]> => {
    const response = await api.get<MarketplaceItem[]>('/marketplace/user');
    return response.data;
  },

  // Create new marketplace item
  createItem: async (itemData: CreateMarketplaceItemData): Promise<MarketplaceItem> => {
    const response = await api.post<MarketplaceItem>('/marketplace', itemData);
    return response.data;
  },

  // Update marketplace item
  updateItem: async (id: string, itemData: Partial<CreateMarketplaceItemData>): Promise<MarketplaceItem> => {
    const response = await api.put<MarketplaceItem>(`/marketplace/${id}`, itemData);
    return response.data;
  },

  // Delete marketplace item
  deleteItem: async (id: string): Promise<void> => {
    await api.delete(`/marketplace/${id}`);
  },
};

export default marketplaceService;