import React, { useEffect, useState } from 'react';
import { authAPI } from '../services/api.ts';

interface WalletInfo {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
}

const Wallet: React.FC = () => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await authAPI.getCurrentUser();
        // Then fetch wallet
        const w = await fetch('/api/users/wallet', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json());
        setWallet(w.wallet);
      } catch (e) {
        setError('Failed to load wallet');
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-32 bg-gray-100 rounded-lg">Loading wallet...</div>;
  if (error) return <div className="p-3 rounded-lg bg-red-100 border border-red-300 text-red-700">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">EcoWallet</h1>
      </div>
      {wallet && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
            <h3 className="text-gray-600 mb-2">Current Balance</h3>
            <p className="text-2xl font-bold">{wallet.balance} EcoTokens</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
            <h3 className="text-gray-600 mb-2">Total Earned</h3>
            <p className="text-2xl font-bold">{wallet.lifetimeEarned} EcoTokens</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
            <h3 className="text-gray-600 mb-2">Total Spent</h3>
            <p className="text-2xl font-bold">{wallet.lifetimeSpent} EcoTokens</p>
          </div>
        </section>
      )}
    </div>
  );
};

export default Wallet;