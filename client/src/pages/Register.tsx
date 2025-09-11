import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import './Auth.css';
import { useAuth } from '../context/AuthContext.tsx';
import { Link } from 'react-router-dom';

const Register: React.FC = () => {
  const { register, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      await register(name, email, password);
      // Navigation will be handled by the useEffect above
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Join EcoChain</h1>
        <p className="auth-subtitle">Create your account to get started</p>
        <form onSubmit={onSubmit} className="auth-form">
          {error && <div className="error">{error}</div>}
          <input 
            placeholder="Full Name" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
          />
          <input 
            placeholder="Email" 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <input 
            placeholder="Password" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          <input 
            placeholder="Confirm Password" 
            type="password" 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} 
            required 
          />
          <button 
            className="primary-button" 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        <p className="auth-redirect">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;