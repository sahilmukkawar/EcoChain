import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { retryApiCall } from '../utils/apiUtils';

// Determine the base URL based on the environment
const getBaseURL = () => {
  // Check for environment variable first
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  // For production, use the deployed backend URL
  if (process.env.NODE_ENV === 'production') {
    // When deployed on Vercel, we need to use the Render backend URL
    // When deployed on Render, we can use the relative path
    return 'https://ecochain-j1nj.onrender.com/api';
  }
  // For development, use the proxy setting
  return '/api';
};

// Create axios instance with default config
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000, // Increased timeout to 15 seconds for production stability
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Log detailed error information for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle 401 Unauthorized errors (token expired, etc.)
    if (error.response && error.response.status === 401) {
      // Don't redirect immediately - let AuthContext handle token refresh
      console.warn('API request unauthorized - token may be expired');
    }
    return Promise.reject(error);
  }
);

// Wrapper function for API calls with retry mechanism
const apiCallWithRetry = async <T>(apiFunction: () => Promise<AxiosResponse<T>>): Promise<AxiosResponse<T>> => {
  return retryApiCall(apiFunction, 3, 1000); // 3 retries with 1 second base delay
};

// Authentication API endpoints
const authAPI = {
  register: (userData: { name: string; email: string; phone?: string; password: string; role?: string; address?: any; collectorInfo?: any; factoryInfo?: any }) => {
    return apiCallWithRetry(() => api.post('/auth/register', userData));
  },
  login: (credentials: { email: string; password: string }) => {
    return apiCallWithRetry(() => api.post('/auth/login', credentials));
  },
  verifyOTP: (data: { email: string; otp: string }) => {
    return apiCallWithRetry(() => api.post('/auth/verify-otp', data));
  },
  resendOTP: (data: { email: string }) => {
    return apiCallWithRetry(() => api.post('/auth/resend-otp', data));
  },
  refreshToken: (refreshToken: string) => {
    return apiCallWithRetry(() => api.post('/auth/refresh', { refreshToken }));
  },
  logout: () => {
    return apiCallWithRetry(() => api.post('/auth/logout'));
  },
  getCurrentUser: () => {
    return apiCallWithRetry(() => api.get('/auth/me'));
  },
  updateProfile: (userData: any) => {
    return apiCallWithRetry(() => api.put('/auth/profile', userData));
  },
  updateProfileWithImage: (formData: FormData) => {
    return apiCallWithRetry(() => api.put('/auth/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }));
  },
  changePassword: (passwordData: { currentPassword: string; newPassword: string }) => {
    return apiCallWithRetry(() => api.put('/auth/change-password', passwordData));
  },
};

// Garbage Collection API endpoints
interface CollectionRequestData {
  type: string;
  subType?: string;
  weight?: number;
  quality?: string;
  description?: string;
  images?: string[];
  location?: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  preferredTimeSlot?: string;
}

interface CollectionStatusUpdate {
  status: string;
  notes?: string;
}

const collectionsAPI = {
  // Create a new collection request
  createCollectionRequest: (requestData: CollectionRequestData) => {
    return apiCallWithRetry(() => api.post('/collections', requestData));
  },
  
  // Get all collections for current user
  getUserCollections: (params?: { status?: string; page?: number; limit?: number }) => {
    return apiCallWithRetry(() => api.get('/collections', { params }));
  },
  
  // Get collection by ID
  getCollectionById: (collectionId: string) => {
    return apiCallWithRetry(() => api.get(`/collections/${collectionId}`));
  },
  
  // Update collection status (for collectors)
  updateCollectionStatus: (collectionId: string, statusData: CollectionStatusUpdate) => {
    return apiCallWithRetry(() => api.put(`/collections/${collectionId}/status`, statusData));
  },
  
  // Get nearby collections for collectors
  getNearbyCollections: (params: { longitude: number; latitude: number; maxDistance?: number }) => {
    return apiCallWithRetry(() => api.get('/collections/nearby', { params }));
  },
  
  // Assign collector to collection
  assignCollector: (collectionId: string) => {
    return apiCallWithRetry(() => api.post(`/collections/${collectionId}/assign`));
  },
  
  // Submit vision inference for a collection
  submitVisionInference: (collectionId: string, imageData: string) => {
    return apiCallWithRetry(() => api.post(`/collections/${collectionId}/vision`, { imageData }));
  },
  
  // Complete a collection and issue tokens
  completeCollection: (collectionId: string, completionData?: any) => {
    return apiCallWithRetry(() => api.post(`/collections/${collectionId}/complete`, completionData || {}));
  },
};

// Marketplace API endpoints
interface ProductData {
  name: string;
  description: string;
  category: string;
  subCategory?: string;
  images?: string[];
  price: number;
  tokenPrice: number;
  inventory: {
    available: number;
  };
  specifications?: Record<string, any>;
  sustainability?: {
    recycledMaterials?: string[];
    carbonFootprint?: number;
    waterSaved?: number;
    energySaved?: number;
  };
  tags?: string[];
}

interface OrderItemData {
  productId: string;
  quantity: number;
}

interface ShippingData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

interface OrderData {
  items: OrderItemData[];
  payment: {
    method: 'token' | 'cash' | 'card';
    tokensUsed?: number;
  };
  shipping: ShippingData;
  notes?: string;
}

const marketplaceAPI = {
  // Get all products
  getProducts: (filters?: { category?: string; subCategory?: string; tags?: string[]; }) => {
    return apiCallWithRetry(() => api.get('/marketplace', { params: filters }));
  },
  
  // Get product by ID
  getProductById: (productId: string) => {
    return apiCallWithRetry(() => api.get(`/marketplace/${productId}`));
  },
  
  // Get factory's products
  getFactoryProducts: () => {
    return apiCallWithRetry(() => api.get('/marketplace/my-products'));
  },
  
  // Create new product (for factories)
  createProduct: (productData: ProductData) => {
    return apiCallWithRetry(() => api.post('/marketplace', productData));
  },
  
  // Update product (for factories)
  updateProduct: (productId: string, productData: Partial<ProductData>) => {
    return apiCallWithRetry(() => api.put(`/marketplace/${productId}`, productData));
  },
  
  // Delete product (for factories)
  deleteProduct: (productId: string) => {
    return apiCallWithRetry(() => api.delete(`/marketplace/${productId}`));
  },
  
  // Create order
  createOrder: (orderData: OrderData) => {
    return apiCallWithRetry(() => api.post('/orders', orderData));
  },
  
  // Get user orders
  getUserOrders: () => {
    return apiCallWithRetry(() => api.get('/orders/user'));
  },
  
  // Get order by ID
  getOrderById: (orderId: string) => {
    return apiCallWithRetry(() => api.get(`/orders/${orderId}`));
  },
  
  // Track order by tracking number
  trackOrder: (trackingNumber: string) => {
    return apiCallWithRetry(() => api.get(`/orders/tracking/${trackingNumber}`));
  },
  
  // Update order status (for factories)
  updateOrderStatus: (orderId: string, status: string) => {
    return apiCallWithRetry(() => api.put(`/orders/${orderId}/status`, { status }));
  },
};

// Wallet and Transaction API endpoints
interface TransferData {
  recipientId: string;
  amount: number;
  notes?: string;
}

interface WalletData {
  currentBalance: number;
  totalEarned: number;
  totalSpent: number;
}

const walletAPI = {
  // Get wallet balance and info
  getBalance: () => {
    return apiCallWithRetry(() => api.get<{ success: boolean; data: { wallet: WalletData } }>('/eco-token/wallet'));
  },
  
  // Get transaction history
  getTransactions: (filters?: { type?: string; startDate?: string; endDate?: string; page?: number; limit?: number; }) => {
    return apiCallWithRetry(() => api.get<{ success: boolean; data: any[]; pagination: any }>('/eco-token/transactions', { params: filters }));
  },
  
  // Get transaction by ID
  getTransactionById: (transactionId: string) => {
    return apiCallWithRetry(() => api.get<{ success: boolean; data: any }>(`/eco-token/transactions/${transactionId}`));
  },
  
  // Transfer tokens to another user
  transferTokens: (transferData: TransferData) => {
    return apiCallWithRetry(() => api.post('/eco-token/transactions/transfer', transferData));
  },
  
  // Get token earning opportunities
  getEarningOpportunities: () => {
    return apiCallWithRetry(() => api.get('/eco-token/opportunities'));
  },
  
  // Calculate potential tokens for waste submission
  calculateTokens: (data: { materialType: string; weight: number; quality?: string }) => {
    return apiCallWithRetry(() => api.post('/eco-token/calculate', data));
  },
  
  // Get token earning statistics
  getEarningStats: (period?: 'day' | 'week' | 'month' | 'year') => {
    return apiCallWithRetry(() => api.get('/eco-token/wallet/stats/earnings', { params: { period } }));
  },
  
  // Get token spending statistics
  getSpendingStats: (period?: 'day' | 'week' | 'month' | 'year') => {
    return apiCallWithRetry(() => api.get('/eco-token/wallet/stats/spending', { params: { period } }));
  },
  
  // Get environmental impact statistics
  getImpactStats: () => {
    return apiCallWithRetry(() => api.get('/eco-token/wallet/stats/impact'));
  }
};

// Collector Route Optimization API endpoints
interface RoutePoint {
  collectionId: string;
  location: {
    coordinates: [number, number];
    address?: string;
  };
  estimatedTime?: number;
  priority?: 'high' | 'medium' | 'low';
  status?: 'pending' | 'completed' | 'skipped';
}

interface RouteData {
  collectorId: string;
  date: string;
  startLocation: {
    coordinates: [number, number];
    address?: string;
  };
  endLocation?: {
    coordinates: [number, number];
    address?: string;
  };
  points: RoutePoint[];
  optimizationPreference?: 'time' | 'distance' | 'efficiency';
}

const routeAPI = {
  // Generate optimized route
  generateRoute: (routeData: Partial<RouteData>) => {
    return apiCallWithRetry(() => api.post('/routes/optimize', routeData));
  },
  
  // Get collector's current route
  getCurrentRoute: () => {
    return apiCallWithRetry(() => api.get('/routes/current'));
  },
  
  // Get collector's route history
  getRouteHistory: (filters?: { startDate?: string; endDate?: string; }) => {
    return apiCallWithRetry(() => api.get('/routes/history', { params: filters }));
  },
  
  // Get route by ID
  getRouteById: (routeId: string) => {
    return apiCallWithRetry(() => api.get(`/routes/${routeId}`));
  },
  
  // Update route point status
  updateRoutePointStatus: (routeId: string, pointId: string, status: 'pending' | 'completed' | 'skipped') => {
    return apiCallWithRetry(() => api.put(`/routes/${routeId}/points/${pointId}/status`, { status }));
  },
  
  // Add new point to existing route
  addRoutePoint: (routeId: string, point: RoutePoint) => {
    return apiCallWithRetry(() => api.post(`/routes/${routeId}/points`, point));
  },
  
  // Remove point from existing route
  removeRoutePoint: (routeId: string, pointId: string) => {
    return apiCallWithRetry(() => api.delete(`/routes/${routeId}/points/${pointId}`));
  },
  
  // Re-optimize existing route
  reoptimizeRoute: (routeId: string, preferences?: { optimizationPreference?: 'time' | 'distance' | 'efficiency' }) => {
    return apiCallWithRetry(() => api.post(`/routes/${routeId}/reoptimize`, preferences));
  },
  
  // Get route statistics
  getRouteStats: (period?: 'day' | 'week' | 'month') => {
    return apiCallWithRetry(() => api.get('/routes/stats', { params: { period } }));
  }
};

// Factory Dashboard API endpoints
interface MaterialData {
  type: string;
  subType?: string;
  quantity: number;
  unit: 'kg' | 'ton' | 'piece';
  quality: 'high' | 'medium' | 'low';
  source?: string;
  price?: number;
  images?: string[];
  specifications?: Record<string, any>;
}

interface ProductionBatchData {
  productId: string;
  quantity: number;
  materials: {
    materialId: string;
    quantity: number;
  }[];
  startDate: string;
  endDate?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  qualityScore?: number;
  notes?: string;
}

const factoryAPI = {
  // Get available materials
  getMaterials: (filters?: { type?: string; quality?: string; }) => {
    return apiCallWithRetry(() => api.get('/factory/materials', { params: filters }));
  },
  
  // Get material by ID
  getMaterialById: (materialId: string) => {
    return apiCallWithRetry(() => api.get(`/factory/materials/${materialId}`));
  },
  
  // Add new material
  addMaterial: (materialData: MaterialData) => {
    return apiCallWithRetry(() => api.post('/factory/materials', materialData));
  },
  
  // Update material
  updateMaterial: (materialId: string, materialData: Partial<MaterialData>) => {
    return apiCallWithRetry(() => api.put(`/factory/materials/${materialId}`, materialData));
  },
  
  // Delete material
  deleteMaterial: (materialId: string) => {
    return apiCallWithRetry(() => api.delete(`/factory/materials/${materialId}`));
  },
  
  // Get production batches
  getProductionBatches: (filters?: { status?: string; productId?: string; }) => {
    return apiCallWithRetry(() => api.get('/factory/production', { params: filters }));
  },
  
  // Get production batch by ID
  getProductionBatchById: (batchId: string) => {
    return apiCallWithRetry(() => api.get(`/factory/production/${batchId}`));
  },
  
  // Create production batch
  createProductionBatch: (batchData: ProductionBatchData) => {
    return apiCallWithRetry(() => api.post('/factory/production', batchData));
  },
  
  // Update production batch
  updateProductionBatch: (batchId: string, batchData: Partial<ProductionBatchData>) => {
    return apiCallWithRetry(() => api.put(`/factory/production/${batchId}`, batchData));
  },
  
  // Get factory analytics
  getAnalytics: (period?: 'day' | 'week' | 'month' | 'year') => {
    return apiCallWithRetry(() => api.get('/factory/analytics', { params: { period } }));
  },
  
  // Get material procurement forecast
  getMaterialForecast: () => {
    return apiCallWithRetry(() => api.get('/factory/forecast/materials'));
  },
  
  // Get production forecast
  getProductionForecast: () => {
    return apiCallWithRetry(() => api.get('/factory/forecast/production'));
  },
  
  // Get quality control reports
  getQualityReports: (filters?: { materialId?: string; batchId?: string; }) => {
    return apiCallWithRetry(() => api.get('/factory/quality', { params: filters }));
  },
  
  // Submit quality control report
  submitQualityReport: (reportData: { entityId: string; entityType: 'material' | 'batch'; score: number; notes?: string; images?: string[]; }) => {
    return apiCallWithRetry(() => api.post('/factory/quality', reportData));
  }
};

// Achievement and Gamification API endpoints
const gamificationAPI = {
  // Get user achievements
  getUserAchievements: () => {
    return apiCallWithRetry(() => api.get('/gamification/achievements/user'));
  },
  
  // Get all available achievements
  getAllAchievements: (filters?: { category?: string; completed?: boolean; }) => {
    return apiCallWithRetry(() => api.get('/gamification/achievements', { params: filters }));
  },
  
  // Get achievement by ID
  getAchievementById: (achievementId: string) => {
    return apiCallWithRetry(() => api.get(`/gamification/achievements/${achievementId}`));
  },
  
  // Get user progress for specific achievement
  getAchievementProgress: (achievementId: string) => {
    return apiCallWithRetry(() => api.get(`/gamification/achievements/${achievementId}/progress`));
  },
  
  // Get active challenges
  getActiveChallenges: () => {
    return apiCallWithRetry(() => api.get('/gamification/challenges/active'));
  },
  
  // Get all challenges
  getAllChallenges: (filters?: { status?: 'active' | 'upcoming' | 'completed'; }) => {
    return apiCallWithRetry(() => api.get('/gamification/challenges', { params: filters }));
  },
  
  // Get challenge by ID
  getChallengeById: (challengeId: string) => {
    return apiCallWithRetry(() => api.get(`/gamification/challenges/${challengeId}`));
  },
  
  // Join a challenge
  joinChallenge: (challengeId: string) => {
    return apiCallWithRetry(() => api.post(`/gamification/challenges/${challengeId}/join`));
  },
  
  // Leave a challenge
  leaveChallenge: (challengeId: string) => {
    return apiCallWithRetry(() => api.post(`/gamification/challenges/${challengeId}/leave`));
  },
  
  // Get user challenge progress
  getChallengeProgress: (challengeId: string) => {
    return apiCallWithRetry(() => api.get(`/gamification/challenges/${challengeId}/progress`));
  },
  
  // Get community leaderboard
  getLeaderboard: (period?: 'day' | 'week' | 'month' | 'all_time', category?: string) => {
    return apiCallWithRetry(() => api.get('/gamification/leaderboard', { params: { period, category } }));
  },
  
  // Get user badges
  getUserBadges: () => {
    return apiCallWithRetry(() => api.get('/gamification/badges/user'));
  },
  
  // Get all available badges
  getAllBadges: () => {
    return apiCallWithRetry(() => api.get('/gamification/badges'));
  }
};

// Notification Service API endpoints
const notificationAPI = {
  // Get user notifications
  getNotifications: (filters?: { read?: boolean; type?: string; limit?: number; }) => {
    return apiCallWithRetry(() => api.get('/notifications', { params: filters }));
  },
  
  // Get notification by ID
  getNotificationById: (notificationId: string) => {
    return apiCallWithRetry(() => api.get(`/notifications/${notificationId}`));
  },
  
  // Mark notification as read
  markAsRead: (notificationId: string) => {
    return apiCallWithRetry(() => api.put(`/notifications/${notificationId}/read`));
  },
  
  // Mark all notifications as read
  markAllAsRead: () => {
    return apiCallWithRetry(() => api.put('/notifications/read-all'));
  },
  
  // Delete notification
  deleteNotification: (notificationId: string) => {
    return apiCallWithRetry(() => api.delete(`/notifications/${notificationId}`));
  },
  
  // Update notification preferences
  updatePreferences: (preferences: { email?: boolean; push?: boolean; sms?: boolean; types?: Record<string, boolean>; }) => {
    return apiCallWithRetry(() => api.put('/notifications/preferences', preferences));
  },
  
  // Get notification preferences
  getPreferences: () => {
    return apiCallWithRetry(() => api.get('/notifications/preferences'));
  },
  
  // Sign up device for push notifications
  registerDevice: (deviceData: { token: string; platform: 'ios' | 'android' | 'web'; }) => {
    return apiCallWithRetry(() => api.post('/notifications/devices', deviceData));
  },
  
  // Unregister device from push notifications
  unregisterDevice: (deviceToken: string) => {
    return apiCallWithRetry(() => api.delete(`/notifications/devices/${deviceToken}`));
  },
  
  // Get notification count
  getUnreadCount: () => {
    return apiCallWithRetry(() => api.get('/notifications/unread-count'));
  }
};

export { authAPI, collectionsAPI, marketplaceAPI, walletAPI, routeAPI, factoryAPI, gamificationAPI, notificationAPI };
export default api;