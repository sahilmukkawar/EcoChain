import React, { useEffect, useState } from 'react';
import '../App.css';
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

  if (loading) return <div className="loading">Loading wallet...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>EcoWallet</h1>
      </div>
      {wallet && (
        <section className="stats-section" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'16px'}}>
          <div className="stat-card"><h3>Current Balance</h3><p>{wallet.balance} EcoTokens</p></div>
          <div className="stat-card"><h3>Total Earned</h3><p>{wallet.lifetimeEarned} EcoTokens</p></div>
          <div className="stat-card"><h3>Total Spent</h3><p>{wallet.lifetimeSpent} EcoTokens</p></div>
        </section>
      )}
    </div>
  );
};

export default Wallet;

