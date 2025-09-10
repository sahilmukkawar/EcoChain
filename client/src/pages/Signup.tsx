import React, { useState } from 'react';
import '../App.css';
import { useAuth } from '../context/AuthContext.tsx';

const Signup: React.FC = () => {
  const { register, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user'|'collector'|'factory'>('user');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register(name, email, password);
      window.location.href = '/dashboard';
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create account</h1>
        <p className="auth-subtitle">Join EcoChain and start earning EcoTokens</p>
        <form onSubmit={onSubmit} className="auth-form">
          {error && <div className="error">{error}</div>}
          <input placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} required />
          <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <select value={role} onChange={e=>setRole(e.target.value as any)}>
            <option value="user">User</option>
            <option value="collector">Collector</option>
            <option value="factory">Factory</option>
          </select>
          <button className="primary-button" type="submit" disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Account'}</button>
        </form>
      </div>
    </div>
  );
};

export default Signup;

