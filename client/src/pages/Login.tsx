import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import { useAuth } from '../context/AuthContext.tsx';
import { getUserRole } from '../utils/auth.ts';

const Login: React.FC = () => {
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const role = getUserRole();
      if (role === 'admin') navigate('/admin-dashboard');
      else if (role === 'factory') navigate('/factory-dashboard');
      else if (role === 'collector') navigate('/collector-dashboard');
      else navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      // Navigation will be handled by the useEffect above
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Login failed');
    }
  };

  const quickFill = (e: string, p: string) => { setEmail(e); setPassword(p); };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to your EcoChain account</p>
        <form onSubmit={onSubmit} className="auth-form">
          {error && <div className="error">{error}</div>}
          <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <button className="primary-button" type="submit" disabled={isLoading}>{isLoading ? 'Logging in...' : 'Login'}</button>
        </form>
        <div className="quick-fill">
          <span>Quick Accounts:</span>
          <button onClick={()=>quickFill('admin@ecochain.com','Admin@123')}>Admin</button>
          <button onClick={()=>quickFill('factory@ecochain.com','Factory@123')}>Factory</button>
          <button onClick={()=>quickFill('collector@ecochain.com','Collector@123')}>Collector</button>
          <button onClick={()=>quickFill('user@ecochain.com','User@123')}>User</button>
        </div>
      </div>
    </div>
  );
};

export default Login;

