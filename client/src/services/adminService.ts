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

class AdminService {
  private baseURL = '/admin';

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
        approveCollection: paymentData.approveCollection !== undefined ? paymentData.approveCollection : true,
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
}

const adminService = new AdminService();
export default adminService;