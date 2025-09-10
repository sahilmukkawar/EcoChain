import React, { useState } from 'react';
import '../App.css';
import { useAuth } from '../context/AuthContext.tsx';
import { getUserRole } from '../utils/auth.ts';

const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('admin@ecochain.com');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      const role = getUserRole();
      if (role === 'admin') window.location.href = '/admin';
      else if (role === 'factory') window.location.href = '/factory';
      else if (role === 'collector') window.location.href = '/collector';
      else window.location.href = '/dashboard';
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header"><h1>Login</h1></div>
      <form onSubmit={onSubmit} style={{maxWidth:480, margin:'0 auto', display:'grid', gap:12}}>
        {error && <div className="error">{error}</div>}
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="buy-button" type="submit" disabled={isLoading}>{isLoading ? 'Logging in...' : 'Login'}</button>
      </form>
    </div>
  );
};

export default Login;

