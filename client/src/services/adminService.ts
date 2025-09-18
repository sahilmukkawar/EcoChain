// services/adminService.ts
import api from './api.ts';

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
      phone: string;
    };
    role: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedBy?: {
    _id: string;
    personalInfo: {
      name: string;
    };
  };
  reviewedAt?: string;
  rejectionReason?: string;
  // Factory specific fields
  factoryName?: string;
  ownerName?: string;
  gstNumber?: string;
  licenseDocumentUrl?: string;
  // Collector specific fields
  companyName?: string;
  contactName?: string;
  serviceArea?: string[];
  idDocumentUrl?: string;
}

class AdminService {
  private readonly baseURL = '/admin';

  // Get collections ready for collector payment
  async getCollectionsForPayment(page: number = 1, limit: number = 20) {
    try {
      const response = await api.get(`${this.baseURL}/collections/payment-pending?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching collections for payment:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch collections for payment');
    }
  }

  // Process collector payment
  async processCollectorPayment(collectionId: string, paymentData: { 
    approveCollection?: boolean; 
    paymentMethod?: string; 
    adminNotes?: string;
    // Legacy support
    paymentAmount?: number;
    notes?: string;
  }) {
    try {
      // Handle legacy parameters
      const requestData = {
        approveCollection: paymentData.approveCollection ?? true,
        paymentMethod: paymentData.paymentMethod || 'digital_transfer',
        adminNotes: paymentData.adminNotes || paymentData.notes || ''
      };
      
      const response = await api.post(`${this.baseURL}/collections/${collectionId}/pay-collector`, requestData);
      return response.data;
    } catch (error: any) {
      console.error('Error processing collector payment:', error);
      throw new Error(error.response?.data?.message || 'Failed to process collector payment');
    }
  }

  // Get admin dashboard statistics
  async getAdminStats() {
    try {
      const response = await api.get(`${this.baseURL}/stats`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch admin statistics');
    }
  }

  // Get real users data
  async getAllUsers(page: number = 1, limit: number = 50) {
    try {
      const response = await api.get(`${this.baseURL}/users?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching users:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  }

  // Get real collectors data
  async getAllCollectors(page: number = 1, limit: number = 50) {
    try {
      const response = await api.get(`${this.baseURL}/collectors?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching collectors:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch collectors');
    }
  }

  // Get real factories data
  async getAllFactories(page: number = 1, limit: number = 50) {
    try {
      const response = await api.get(`${this.baseURL}/factories?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching factories:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch factories');
    }
  }

  // Get payment history with filtering and pagination
  async getPaymentHistory(filters: {
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
  } = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await api.get(`${this.baseURL}/payments/history?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching payment history:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch payment history');
    }
  }

  // Get payment statistics
  async getPaymentStatistics(filters: {
    dateFrom?: string;
    dateTo?: string;
    adminId?: string;
  } = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await api.get(`${this.baseURL}/payments/statistics?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching payment statistics:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch payment statistics');
    }
  }

  // Get analytics data
  async getAnalyticsData(filters: {
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    dateFrom?: string;
    dateTo?: string;
  } = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await api.get(`${this.baseURL}/analytics?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching analytics data:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch analytics data');
    }
  }

  // Get pending factory applications
  async getPendingFactories() {
    try {
      const response = await api.get(`${this.baseURL}/approval/factories/pending`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching pending factories:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch pending factories');
    }
  }

  // Get pending collector applications
  async getPendingCollectors() {
    try {
      const response = await api.get(`${this.baseURL}/approval/collectors/pending`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching pending collectors:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch pending collectors');
    }
  }

  // Get all applications with filtering
  async getAllApplications(filters: {
    type?: 'factory' | 'collector';
    status?: 'pending' | 'approved' | 'rejected';
    page?: number;
    limit?: number;
  } = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Handle different value types appropriately
          if (typeof value === 'number') {
            queryParams.append(key, value.toString());
          } else if (typeof value === 'string') {
            queryParams.append(key, value);
          }
        }
      });
      
      const response = await api.get(`${this.baseURL}/approval/applications?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch applications');
    }
  }

  // Approve factory application
  async approveFactoryApplication(applicationId: string) {
    try {
      const response = await api.put(`${this.baseURL}/approval/factories/${applicationId}/approve`);
      return response.data;
    } catch (error: any) {
      console.error('Error approving factory application:', error);
      throw new Error(error.response?.data?.message || 'Failed to approve factory application');
    }
  }

  // Reject factory application
  async rejectFactoryApplication(applicationId: string, rejectionReason: string) {
    try {
      const response = await api.put(`${this.baseURL}/approval/factories/${applicationId}/reject`, { rejectionReason });
      return response.data;
    } catch (error: any) {
      console.error('Error rejecting factory application:', error);
      throw new Error(error.response?.data?.message || 'Failed to reject factory application');
    }
  }

  // Approve collector application
  async approveCollectorApplication(applicationId: string) {
    try {
      const response = await api.put(`${this.baseURL}/approval/collectors/${applicationId}/approve`);
      return response.data;
    } catch (error: any) {
      console.error('Error approving collector application:', error);
      throw new Error(error.response?.data?.message || 'Failed to approve collector application');
    }
  }

  // Reject collector application
  async rejectCollectorApplication(applicationId: string, rejectionReason: string) {
    try {
      const response = await api.put(`${this.baseURL}/approval/collectors/${applicationId}/reject`, { rejectionReason });
      return response.data;
    } catch (error: any) {
      console.error('Error rejecting collector application:', error);
      throw new Error(error.response?.data?.message || 'Failed to reject collector application');
    }
  }

  // Get specific factory application details
  async getFactoryApplicationDetails(applicationId: string) {
    try {
      const response = await api.get(`${this.baseURL}/approval/factories/${applicationId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching factory application details:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch factory application details');
    }
  }

  // Get specific collector application details
  async getCollectorApplicationDetails(applicationId: string) {
    try {
      const response = await api.get(`${this.baseURL}/approval/collectors/${applicationId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching collector application details:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch collector application details');
    }
  }
}

const adminService = new AdminService();
export default adminService;