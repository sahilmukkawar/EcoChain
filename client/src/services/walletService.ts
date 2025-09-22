import { walletAPI } from './api';

export interface WalletInfo {
  currentBalance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface WalletTransaction {
  _id: string;
  transactionId: string;
  userId: string;
  transactionType: 'earned' | 'spent' | 'bonus' | 'penalty' | 'refund';
  details: {
    amount: number;
    monetaryValue: number;
    description: string;
    referenceId?: string;
  };
  metadata: {
    source: string;
    category?: string;
    relatedEntity?: string;
    entityType?: string;
  };
  walletBalance: {
    beforeTransaction: number;
    afterTransaction: number;
  };
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

const walletService = {
  // Get user's wallet information
  getWalletInfo: async (): Promise<WalletInfo> => {
    try {
      const response = await walletAPI.getBalance();
      if (response.data.success) {
        return response.data.data.wallet;
      } else {
        throw new Error('Failed to fetch wallet information');
      }
    } catch (error: any) {
      console.error('Error fetching wallet info:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch wallet information');
    }
  },

  // Get user's transaction history
  getTransactionHistory: async (filters?: { 
    type?: string; 
    startDate?: string; 
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ transactions: WalletTransaction[]; pagination: any }> => {
    try {
      const response = await walletAPI.getTransactions(filters);
      if (response.data.success) {
        return {
          transactions: response.data.data,
          pagination: response.data.pagination
        };
      } else {
        throw new Error('Failed to fetch transaction history');
      }
    } catch (error: any) {
      console.error('Error fetching transaction history:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch transaction history');
    }
  },

  // Get a single transaction by ID
  getTransactionById: async (transactionId: string): Promise<WalletTransaction> => {
    try {
      const response = await walletAPI.getTransactionById(transactionId);
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Failed to fetch transaction');
      }
    } catch (error: any) {
      console.error(`Error fetching transaction ${transactionId}:`, error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch transaction');
    }
  },

  // Get earning statistics
  getEarningStats: async (period?: 'day' | 'week' | 'month' | 'year') => {
    try {
      const response = await walletAPI.getEarningStats(period);
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Failed to fetch earning stats');
      }
    } catch (error: any) {
      console.error('Error fetching earning stats:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch earning stats');
    }
  },

  // Get spending statistics
  getSpendingStats: async (period?: 'day' | 'week' | 'month' | 'year') => {
    try {
      const response = await walletAPI.getSpendingStats(period);
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Failed to fetch spending stats');
      }
    } catch (error: any) {
      console.error('Error fetching spending stats:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch spending stats');
    }
  },

  // Get environmental impact statistics
  getImpactStats: async () => {
    try {
      const response = await walletAPI.getImpactStats();
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Failed to fetch impact stats');
      }
    } catch (error: any) {
      console.error('Error fetching impact stats:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch impact stats');
    }
  }
};

export default walletService;