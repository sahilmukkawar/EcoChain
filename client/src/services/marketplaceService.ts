import axios from 'axios';

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
    const response = await axios.get<MarketplaceItem[]>('/api/marketplace');
    return response.data;
  },

  // Get marketplace item by ID
  getItemById: async (id: string): Promise<MarketplaceItem> => {
    const response = await axios.get<MarketplaceItem>(`/api/marketplace/${id}`);
    return response.data;
  },

  // Get user's marketplace items
  getUserItems: async (): Promise<MarketplaceItem[]> => {
    const response = await axios.get<MarketplaceItem[]>('/api/marketplace/user');
    return response.data;
  },

  // Create new marketplace item
  createItem: async (itemData: CreateMarketplaceItemData): Promise<MarketplaceItem> => {
    const response = await axios.post<MarketplaceItem>('/api/marketplace', itemData);
    return response.data;
  },

  // Update marketplace item
  updateItem: async (id: string, itemData: Partial<CreateMarketplaceItemData>): Promise<MarketplaceItem> => {
    const response = await axios.put<MarketplaceItem>(`/api/marketplace/${id}`, itemData);
    return response.data;
  },

  // Delete marketplace item
  deleteItem: async (id: string): Promise<void> => {
    await axios.delete(`/api/marketplace/${id}`);
  },
};

export default marketplaceService;