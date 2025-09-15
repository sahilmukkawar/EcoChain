import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import walletService, { WalletInfo, WalletTransaction } from '../services/walletService.ts';

const Wallet: React.FC = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');

  const fetchWallet = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Fetch wallet info from the new wallet service
      const walletData = await walletService.getWalletInfo();
      setWallet(walletData);
      
      // Fetch transaction history
      const transactionResponse = await walletService.getTransactionHistory({ limit: 20 });
      setTransactions(transactionResponse.transactions);
      setError(null);
      
      // Update user context if balance changed
      if (walletData.currentBalance !== user?.ecoWallet?.currentBalance) {
        // The AuthContext should handle updating the user state
        // We could trigger a refresh through AuthContext methods if needed
      }
    } catch (e: any) {
      console.error('Failed to load wallet:', e);
      setError(e.message || 'Failed to load wallet information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const getTransactionIcon = (transaction: WalletTransaction) => {
    if (transaction.transactionType === 'earned') {
      switch (transaction.metadata.source) {
        case 'garbage_collection':
          return (
            <div className="w-10 h-10 bg-eco-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-eco-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
          );
        case 'bonus':
        case 'referral':
          return (
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          );
        default:
          return (
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          );
      }
    } else {
      return (
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-green-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading your EcoWallet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-red-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Wallet Error</h3>
            <p className="text-red-600 text-sm mb-6 leading-relaxed">{error}</p>
            <button 
              onClick={() => fetchWallet()}
              className="bg-eco-green-600 hover:bg-eco-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">EcoWallet</h1>
              <p className="text-sm text-gray-500">Manage your EcoTokens and view transaction history</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Current Balance Badge */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-eco-green-50 text-eco-green-700 border border-eco-green-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span>{wallet?.currentBalance || 0} EcoTokens</span>
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => fetchWallet(true)}
                disabled={refreshing}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${refreshing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-600 hover:bg-gray-700 text-white shadow-sm hover:shadow-md'
                  }`}
              >
                <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-eco-green-500 text-eco-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'transactions'
                  ? 'border-eco-green-500 text-eco-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transaction History
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && wallet && (
          <div className="space-y-8">
            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-eco-green-50 rounded-full -mr-10 -mt-10"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">Current Balance</h3>
                    <div className="w-10 h-10 bg-eco-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-eco-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{wallet.currentBalance}</p>
                  <p className="text-sm text-gray-500">EcoTokens available</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full -mr-10 -mt-10"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">Total Earned</h3>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{wallet.totalEarned}</p>
                  <p className="text-sm text-gray-500">EcoTokens earned</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-full -mr-10 -mt-10"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">Total Spent</h3>
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{wallet.totalSpent}</p>
                  <p className="text-sm text-gray-500">EcoTokens spent</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button className="flex items-center gap-3 p-4 bg-eco-green-50 hover:bg-eco-green-100 rounded-xl transition-all duration-200 border border-eco-green-100 hover:border-eco-green-200">
                    <div className="w-10 h-10 bg-eco-green-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 text-sm">Shop Products</div>
                      <div className="text-xs text-gray-600">Use your tokens</div>
                    </div>
                  </button>

                  <button className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-100 hover:border-gray-200">
                    <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 text-sm">Submit Waste</div>
                      <div className="text-xs text-gray-600">Earn more tokens</div>
                    </div>
                  </button>

                  <button className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-100 hover:border-gray-200">
                    <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 002 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 text-sm">View Stats</div>
                      <div className="text-xs text-gray-600">Track progress</div>
                    </div>
                  </button>

                  <button className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-100 hover:border-gray-200">
                    <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 text-sm">Earn Bonus</div>
                      <div className="text-xs text-gray-600">Complete tasks</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="text-sm text-eco-green-600 hover:text-eco-green-700 font-medium"
                  >
                    View All →
                  </button>
                </div>
              </div>
              <div className="p-6">
                {transactions.slice(0, 3).length > 0 ? (
                  <div className="space-y-4">
                    {transactions.slice(0, 3).map(transaction => (
                      <div key={transaction._id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        {getTransactionIcon(transaction)}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">
                            {transaction.details.description}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className={`text-sm font-semibold ${
                          transaction.transactionType === 'earned' ? 'text-eco-green-600' : 'text-red-600'
                        }`}>
                          {transaction.transactionType === 'earned' ? '+' : '-'}{transaction.details.amount} tokens
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
            </div>
            <div className="p-6">
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map(transaction => (
                    <div key={transaction._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      {getTransactionIcon(transaction)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-gray-900">
                            {transaction.details.description}
                          </div>
                          <div className={`text-lg font-bold ${
                            transaction.transactionType === 'earned' ? 'text-eco-green-600' : 'text-red-600'
                          }`}>
                            {transaction.transactionType === 'earned' ? '+' : '-'}{transaction.details.amount} tokens
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString()} • {transaction.metadata.source}
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.status === 'completed' ? 'bg-eco-green-100 text-eco-green-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
                  <p className="text-gray-600">Start earning EcoTokens by submitting waste collections!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;