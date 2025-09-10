import React, { useState } from 'react';
import '../App.css';
import { useAuth } from '../context/AuthContext.tsx';

const Signup: React.FC = () => {
  const { register, isLoading } = useAuth();
  const [name, setName] = useState('Admin User');
  const [email, setEmail] = useState('admin@ecochain.com');
  const [password, setPassword] = useState('Admin@123');
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
    <div className="dashboard-container">
      <div className="dashboard-header"><h1>Sign Up</h1></div>
      <form onSubmit={onSubmit} style={{maxWidth:480, margin:'0 auto', display:'grid', gap:12}}>
        {error && <div className="error">{error}</div>}
        <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="buy-button" type="submit" disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Account'}</button>
      </form>
    </div>
  );
};

export default Signup;

