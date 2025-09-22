// services/adminService.ts
import api from './api';

export interface CollectionForPayment {
  _id: string;
  collectionId: string;
  userId: {
    _id: string;
    personalInfo: {
      name: string;
      email: string;
    };
  };
  collectorId: {
    _id: string;
    personalInfo: {
      name: string;
      email: string;
    };
  };
  collectionDetails: {
    type: string;
    weight: number;
    quality: string;
  };
  tokenCalculation: {
    totalTokensIssued: number;
  };
  payment?: {
    calculatedAmount?: number;
  };
  status: string;
  updatedAt: string;
  logistics?: {
    actualPickupTime?: string;
  };
}

export interface AdminStats {
  totalUsers: number;
  totalCollectors: number;
  totalFactories: number;
  totalCollections: number;
  pendingPayments: number;
  completedCollections: number;
  totalEcoTokensIssued: number;
}

export interface UserData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  accountStatus: string;
  ecoTokens: number;
  totalEarned: number;
  totalCollections: number;
  completedCollections: number;
  joinedDate: string;
}

export interface CollectorData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  accountStatus: string;
  totalEarnings: number;
  totalCollections: number;
  assignedCollections: number;
  completedCollections: number;
  pendingCollections: number;
  completionRate: number;
  rating: number;
  joinedDate: string;
}

export interface FactoryData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  accountStatus: string;
  materialsProcessed: number;
  productsListed: number;
  joinedDate: string;
}

export interface PaymentHistoryItem {
  paymentId: string;
  collectionId: string;
  adminName: string;
  collectorName: string;
  collectorEmail: string;
  userName: string;
  action: 'approved' | 'rejected';
  amount: number | null;
  currency: string;
  paymentMethod?: string;
  wasteType: string;
  weight: number;
  quality: string;
  pickupDate: string;
  adminNotes?: string;
  rejectionReason?: string;
  processedAt: string;
  status: string;
  location?: string;
}

export interface PaymentStatistics {
  overview: {
    totalPayments: number;
    approvedPayments: number;
    rejectedPayments: number;
    totalAmountPaid: number;
    avgPaymentAmount: number;
  };
  wasteTypeBreakdown: Array<{
    _id: string;
    count: number;
    totalAmount: number;
    avgAmount: number;
    totalWeight: number;
  }>;
}

// New interface for analytics data
export interface AnalyticsData {
  platformMetrics: {
    totalUsers: number;
    activeUsers: number;
    totalCollectors: number;
    totalFactories: number;
    totalGarbageCollected: number;
    totalTokensIssued: number;
    totalRevenue: number;
  };
  environmentalImpact: {
    co2Saved: number;
    treesEquivalent: number;
    energySaved: number;
    waterSaved: number;
  };
  businessMetrics: {
    ordersPlaced: number;
    averageOrderValue: number;
    customerRetentionRate: number;
    factorySatisfactionScore: number;
  };
  topPerformers: {
    topUsers: Array<{
      _id: string;
      name: string;
      collections: number;
      tokens: number;
    }>;
    topCollectors: Array<{
      _id: string;
      name: string;
      collections: number;
      earnings: number;
    }>;
    topFactories: Array<{
      _id: string;
      name: string;
      materials: number;
    }>;
  };
  wasteTypeDistribution: Array<{
    type: string;
    count: number;
    weight: number;
    percentage: number;
  }>;
  collectionTrends: Array<{
    date: string;
    collections: number;
    weight: number;
  }>;
}

// New interface for approval applications
export interface ApprovalApplication {
  _id: string;
  userId: {
    _id: string;
    personalInfo: {
      name: string;
      email: string;
    };
    role: string;
  };
  factoryName?: string;
  gstNumber?: string;
  companyName?: string;
  serviceArea?: string[];
  vehicleDetails?: string;
  licenseNumber?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

// New interface for material requests
export interface MaterialRequest {
  _id: string;
  requestId: string;
  factoryId: {
    _id: string;
    name: string;
    email: string;
    companyInfo?: {
      name: string;
    };
  };
  materialSpecs: {
    materialType: string;
    subType?: string;
    quantity: number;
    qualityRequirements: string;
    specifications?: {
      purity?: number;
      color?: string;
      size?: string;
      additionalRequirements?: string[];
    };
  };
  timeline: {
    requestDate: string;
    requiredBy: string;
    flexibilityDays: number;
  };
  pricing: {
    budgetPerKg: number;
    totalBudget: number;
    paymentTerms: string;
  };
  logistics: {
    deliveryAddress: string;
    transportationMode: string;
    specialHandling?: string;
  };
  status: 'open' | 'partially_filled' | 'fulfilled' | 'expired' | 'cancelled';
  matchedCollections: Array<{
    collectionId: string;
    quantity: number;
    agreedPrice: number;
    status: 'pending' | 'confirmed' | 'delivered';
  }>;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  updatedAt: string;
}

// New interface for collected waste
export interface CollectedWaste {
  _id: string;
  collectionId: string;
  userId: {
    _id: string;
    personalInfo: {
      name: string;
      email: string;
    };
  } | null;
  collectorId: {
    _id: string;
    personalInfo: {
      name: string;
      email: string;
    };
  } | null;
  collectionDetails: {
    type: string;
    subType?: string;
    weight: number;
    quality: string;
    description?: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

const adminService = {
  // Get collections ready for collector payment
  getCollectionsForPayment: async (page: number = 1, limit: number = 20) => {
    try {
      const response = await api.get(`/admin/collections/payment-pending?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching collections for payment:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch collections for payment');
    }
  },

  // Process collector payment
  processCollectorPayment: async (collectionId: string, paymentData: { 
    approveCollection?: boolean; 
    paymentMethod?: string; 
    adminNotes?: string;
    // Legacy support
    paymentAmount?: number;
    notes?: string;
  }) => {
    try {
      // Handle legacy parameters
      const requestData = {
        approveCollection: paymentData.approveCollection ?? true,
        paymentMethod: paymentData.paymentMethod || 'digital_transfer',
        adminNotes: paymentData.adminNotes || paymentData.notes || ''
      };
      
      const response = await api.post(`/admin/collections/${collectionId}/pay-collector`, requestData);
      return response.data;
    } catch (error: any) {
      console.error('Error processing collector payment:', error);
      throw new Error(error.response?.data?.message || 'Failed to process collector payment');
    }
  },

  // Get admin dashboard statistics
  getAdminStats: async () => {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch admin statistics');
    }
  },

  // Get real users data
  getAllUsers: async (page: number = 1, limit: number = 50) => {
    try {
      const response = await api.get(`/admin/users?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching users:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  },

  // Get real collectors data
  getAllCollectors: async (page: number = 1, limit: number = 50) => {
    try {
      const response = await api.get(`/admin/collectors?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching collectors:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch collectors');
    }
  },

  // Get real factories data
  getAllFactories: async (page: number = 1, limit: number = 50) => {
    try {
      const response = await api.get(`/admin/factories?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching factories:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch factories');
    }
  },

  // Get payment history with filtering and pagination
  getPaymentHistory: async (filters: {
    page?: number;
    limit?: number;
    action?: 'approved' | 'rejected';
    wasteType?: string;
    dateFrom?: string;
    dateTo?: string;
    collectorId?: string;
    minAmount?: number;
    maxAmount?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await api.get(`/admin/payments/history?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching payment history:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch payment history');
    }
  },

  // Get payment statistics
  getPaymentStatistics: async (filters: {
    dateFrom?: string;
    dateTo?: string;
    adminId?: string;
  } = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await api.get(`/admin/payments/statistics?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching payment statistics:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch payment statistics');
    }
  },

  // Get analytics data
  getAnalyticsData: async (filters: {
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    dateFrom?: string;
    dateTo?: string;
  } = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await api.get(`/admin/analytics?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching analytics data:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch analytics data');
    }
  },

  // Get all applications (collectors and factories)
  getAllApplications: async (filters: {
    status?: 'pending' | 'approved' | 'rejected';
    type?: 'factory' | 'collector';
  } = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      console.log('Fetching applications with params:', queryParams.toString());
      const response = await api.get(`/admin/applications?${queryParams.toString()}`);
      console.log('Applications response:', response);
      
      // Ensure we always return a proper structure
      if (!response || !response.data) {
        console.log('No response data, returning empty applications');
        return {
          success: true,
          data: {
            applications: []
          }
        };
      }
      
      console.log('Returning applications data:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch applications');
    }
  },

  // Approve factory application
  approveFactoryApplication: async (applicationId: string) => {
    try {
      const response = await api.post(`/admin/applications/factory/${applicationId}/approve`);
      return response.data;
    } catch (error: any) {
      console.error('Error approving factory application:', error);
      throw new Error(error.response?.data?.message || 'Failed to approve factory application');
    }
  },

  // Reject factory application
  rejectFactoryApplication: async (applicationId: string, reason: string) => {
    try {
      const response = await api.post(`/admin/applications/factory/${applicationId}/reject`, { reason });
      return response.data;
    } catch (error: any) {
      console.error('Error rejecting factory application:', error);
      throw new Error(error.response?.data?.message || 'Failed to reject factory application');
    }
  },

  // Approve collector application
  approveCollectorApplication: async (applicationId: string) => {
    try {
      const response = await api.post(`/admin/applications/collector/${applicationId}/approve`);
      return response.data;
    } catch (error: any) {
      console.error('Error approving collector application:', error);
      throw new Error(error.response?.data?.message || 'Failed to approve collector application');
    }
  },

  // Reject collector application
  rejectCollectorApplication: async (applicationId: string, reason: string) => {
    try {
      const response = await api.post(`/admin/applications/collector/${applicationId}/reject`, { reason });
      return response.data;
    } catch (error: any) {
      console.error('Error rejecting collector application:', error);
      throw new Error(error.response?.data?.message || 'Failed to reject collector application');
    }
  },

  // Get all material requests for admin
  getMaterialRequests: async (): Promise<{ success: boolean; data: { requests: MaterialRequest[] } }> => {
    try {
      const response = await api.get('/admin/material-requests');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching material requests:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch material requests');
    }
  },

  // Fulfill a material request
  fulfillMaterialRequest: async (requestId: string, fulfillmentData: {
    collectionId: string;
    quantity: number;
    agreedPrice: number;
  }): Promise<{ success: boolean; data: any }> => {
    try {
      const response = await api.post(`/admin/material-requests/${requestId}/fulfill`, fulfillmentData);
      return response.data;
    } catch (error: any) {
      console.error('Error fulfilling material request:', error);
      throw new Error(error.response?.data?.message || 'Failed to fulfill material request');
    }
  },

  // Update material request status
  updateMaterialRequestStatus: async (requestId: string, status: string): Promise<{ success: boolean; data: any }> => {
    try {
      const response = await api.put(`/admin/material-requests/${requestId}/status`, { status });
      return response.data;
    } catch (error: any) {
      console.error('Error updating material request status:', error);
      throw new Error(error.response?.data?.message || 'Failed to update material request status');
    }
  },

  // Get collected waste for factory management
  getCollectedWaste: async (filters: {
    page?: number;
    limit?: number;
    type?: string;
    quality?: string;
  } = {}): Promise<{ success: boolean; data: { collections: CollectedWaste[] } }> => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await api.get(`/admin/waste/collected?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching collected waste:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch collected waste');
    }
  }
};

export default adminService;