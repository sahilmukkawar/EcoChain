import api from './api.ts';

export interface Transaction {
  _id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  type: 'reward' | 'transfer' | 'purchase';
  status: 'pending' | 'completed' | 'failed';
  reference?: {
    type: 'collection' | 'marketplace';
    id: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionData {
  toUserId: string;
  amount: number;
  type: 'transfer' | 'purchase';
  reference?: {
    type: 'collection' | 'marketplace';
    id: string;
  };
}

const transactionService = {
  // Get user's transactions
  getUserTransactions: async (): Promise<Transaction[]> => {
    const response = await api.get<Transaction[]>('/transactions/user');
    return response.data;
  },

  // Get transaction by ID
  getTransactionById: async (id: string): Promise<Transaction> => {
    const response = await api.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },

  // Create new transaction
  createTransaction: async (transactionData: CreateTransactionData): Promise<Transaction> => {
    const response = await api.post<Transaction>('/transactions', transactionData);
    return response.data;
  },

  // Get user's wallet balance
  getWalletBalance: async (): Promise<{ balance: number }> => {
    const response = await api.get<{ balance: number }>('/transactions/balance');
    return response.data;
  },
};

export default transactionService;