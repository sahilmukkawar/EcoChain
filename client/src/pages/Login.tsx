import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <h1 className="text-3xl font-bold text-center mb-2">Welcome back</h1>
        <p className="text-gray-600 text-center mb-8">Sign in to your EcoChain account</p>
        <form onSubmit={onSubmit} className="space-y-6">
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}
          <div>
            <input 
              placeholder="Email" 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              required 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            />
          </div>
          <div>
            <input 
              placeholder="Password" 
              type="password" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              required 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            />
          </div>
          <button 
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:from-green-600 hover:to-green-700 hover:shadow-lg transition-all duration-300 disabled:opacity-50" 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600 mb-3">Quick Accounts:</div>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={()=>quickFill('admin@ecochain.com','Admin@123')} 
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded transition"
            >
              Admin
            </button>
            <button 
              onClick={()=>quickFill('factory@ecochain.com','Factory@123')} 
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded transition"
            >
              Factory
            </button>
            <button 
              onClick={()=>quickFill('collector@ecochain.com','Collector@123')} 
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded transition"
            >
              Collector
            </button>
            <button 
              onClick={()=>quickFill('user@ecochain.com','User@123')} 
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded transition"
            >
              User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;