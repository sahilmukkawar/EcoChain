import api from './api.ts';

// Updated interface to match the new Product model structure
export interface MarketplaceItem {
  _id: string;
  productId: string;
  factoryId: string;
  productInfo: {
    name: string;
    description: string;
    category: string;
    images?: string[];
    specifications?: {
      material?: string;
      color?: string;
      size?: string;
      features?: string[];
    };
  };
  pricing: {
    costPrice: number;
    sellingPrice: number;
    ecoTokenDiscount?: number;  // Now stores the token price from factory
    discountPercentage?: number;
  };
  inventory: {
    currentStock: number;
    minStockLevel?: number;
    maxStockLevel?: number;
    reorderPoint?: number;
  };
  sustainability: {
    recycledMaterialPercentage: number;
    carbonFootprint?: number;
    sustainabilityCertificates?: Array<{
      name: string;
      issuer: string;
      validUntil: string;
      documentUrl: string;
    }>;
    recycledFrom?: string[];
  };
  availability: {
    isActive: boolean;
    availableRegions?: string[];
    estimatedDeliveryDays?: number;
  };
  sales: {
    totalSold: number;
    revenue: number;
    averageRating: number;
    totalReviews: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Interface for populated factory data
export interface PopulatedMarketplaceItem extends Omit<MarketplaceItem, 'factoryId'> {
  factoryId: {
    _id: string;
    companyInfo: {
      name: string;
    };
    location: {
      city: string;
    };
    businessMetrics: {
      sustainabilityRating: number;
    };
  };
}

export interface CreateMarketplaceItemData {
  productInfo: {
    name: string;
    description: string;
    category: string;
    images?: string[];
    specifications?: {
      material?: string;
      color?: string;
      size?: string;
      features?: string[];
    };
  };
  pricing: {
    costPrice: number;
    sellingPrice: number;
    ecoTokenDiscount?: number;
    discountPercentage?: number;
  };
  inventory: {
    currentStock: number;
    minStockLevel?: number;
    maxStockLevel?: number;
    reorderPoint?: number;
  };
  sustainability: {
    recycledMaterialPercentage: number;
    carbonFootprint?: number;
    sustainabilityCertificates?: Array<{
      name: string;
      issuer: string;
      validUntil: string;
      documentUrl: string;
    }>;
    recycledFrom?: string[];
  };
  availability: {
    isActive: boolean;
    availableRegions?: string[];
    estimatedDeliveryDays?: number;
  };
}

// Helper function to create FormData for file uploads
const createFormData = (itemData: CreateMarketplaceItemData, images?: File[]) => {
  const formData = new FormData();
  
  // Append the product data as JSON
  formData.append('data', JSON.stringify({
    name: itemData.productInfo.name,
    description: itemData.productInfo.description,
    category: itemData.productInfo.category,
    price: {
      fiatAmount: itemData.pricing.costPrice,
      tokenAmount: itemData.pricing.sellingPrice
    },
    inventory: {
      available: itemData.inventory.currentStock
    },
    sustainabilityScore: itemData.sustainability.recycledMaterialPercentage
    // Don't send images array for new products, let backend handle it
  }));
  
  // Append image files if provided
  if (images && images.length > 0) {
    images.forEach((image, index) => {
      formData.append('images', image);
    });
  }
  
  return formData;
};

const marketplaceService = {
  // Get all marketplace items (active products only)
  getProducts: async (): Promise<PopulatedMarketplaceItem[]> => {
    const response = await api.get('/marketplace');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch products');
  },

  // Get marketplace item by ID
  getItemById: async (id: string): Promise<PopulatedMarketplaceItem> => {
    const response = await api.get(`/marketplace/${id}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch product');
  },

  // Get user's marketplace items (for factories)
  getUserItems: async (): Promise<MarketplaceItem[]> => {
    const response = await api.get('/marketplace/user');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch user products');
  },

  // Create new marketplace item (for factories) with file upload support
  createItem: async (itemData: CreateMarketplaceItemData, images?: File[]): Promise<MarketplaceItem> => {
    const formData = createFormData(itemData, images);
    
    const response = await api.post('/marketplace', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create product');
  },

  // Update marketplace item (for factories) with file upload support
  updateItem: async (id: string, itemData: Partial<CreateMarketplaceItemData>, images?: File[]): Promise<MarketplaceItem> => {
    const formData = new FormData();
    
    // Append the product data as JSON
    formData.append('data', JSON.stringify({
      name: itemData.productInfo?.name,
      description: itemData.productInfo?.description,
      category: itemData.productInfo?.category,
      price: {
        fiatAmount: itemData.pricing?.costPrice,
        tokenAmount: itemData.pricing?.sellingPrice
      },
      inventory: {
        available: itemData.inventory?.currentStock
      },
      sustainabilityScore: itemData.sustainability?.recycledMaterialPercentage,
      images: itemData.productInfo?.images
    }));
    
    // Append image files if provided
    if (images && images.length > 0) {
      images.forEach((image, index) => {
        formData.append('images', image);
      });
    }
    
    const response = await api.put(`/marketplace/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update product');
  },

  // Delete marketplace item (for factories)
  deleteItem: async (id: string): Promise<void> => {
    const response = await api.delete(`/marketplace/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete product');
    }
  },
  
  // Factory-specific methods
  getFactoryProducts: async (): Promise<MarketplaceItem[]> => {
    // Add timestamp to prevent caching issues
    const timestamp = Date.now();
    const response = await api.get(`/marketplace/my-products?t=${timestamp}`);
    if (response.data.success) {
      console.log('getFactoryProducts API response:', response.data.data?.length, 'products');
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch factory products');
  },
  
  createFactoryProduct: async (itemData: CreateMarketplaceItemData, images?: File[]): Promise<MarketplaceItem> => {
    const formData = createFormData(itemData, images);
    
    const response = await api.post('/marketplace', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create product');
  },
  
  updateFactoryProduct: async (id: string, itemData: Partial<CreateMarketplaceItemData>, images?: File[]): Promise<MarketplaceItem> => {
    console.log('=== updateFactoryProduct called ===');
    console.log('Product ID:', id);
    console.log('Item data:', itemData);
    console.log('Images count:', images?.length || 0);
    
    const formData = new FormData();
    
    // Prepare the payload
    const payload = {
      name: itemData.productInfo?.name,
      description: itemData.productInfo?.description,
      category: itemData.productInfo?.category,
      price: {
        fiatAmount: itemData.pricing?.costPrice,
        tokenAmount: itemData.pricing?.sellingPrice
      },
      inventory: {
        available: itemData.inventory?.currentStock
      },
      sustainabilityScore: itemData.sustainability?.recycledMaterialPercentage,
      images: itemData.productInfo?.images
    };
    
    console.log('Sending payload to backend:', JSON.stringify(payload, null, 2));
    
    // Append the product data as JSON
    formData.append('data', JSON.stringify(payload));
    
    // Append image files if provided
    if (images && images.length > 0) {
      images.forEach((image, index) => {
        formData.append('images', image);
      });
    }
    
    const response = await api.put(`/marketplace/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('Update response:', response.data);
    
    if (response.data.success) {
      console.log('Update successful, returning:', response.data.data);
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update product');
  },
  
  deleteFactoryProduct: async (id: string): Promise<void> => {
    const response = await api.delete(`/marketplace/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete product');
    }
  }
};

export default marketplaceService;