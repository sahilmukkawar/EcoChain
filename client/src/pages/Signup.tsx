import React, { useState } from 'react';
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
    <div className="flex flex-col items-center justify-center p-8 max-w-md mx-auto">
      <div className="w-full bg-white rounded-xl shadow-md border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">Create account</h1>
        <p className="text-gray-600 text-center mb-6">Join EcoChain and start earning EcoTokens 🌱</p>
        <form onSubmit={onSubmit} className="w-full flex flex-col gap-5">
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
          <div className="relative">
            <input 
              placeholder="Full name" 
              value={name} 
              onChange={e=>setName(e.target.value)} 
              required 
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all pl-10"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">👤</span>
          </div>
          <div className="relative">
            <input 
              placeholder="Email" 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              required 
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all pl-10"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">✉️</span>
          </div>
          <div className="relative">
            <input 
              placeholder="Password" 
              type="password" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              required 
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all pl-10"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔒</span>
          </div>
          <div className="relative">
            <select 
              value={role} 
              onChange={e=>setRole(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all pl-10 appearance-none bg-white"
            >
              <option value="user">User</option>
              <option value="collector">Collector</option>
              <option value="factory">Factory</option>
            </select>
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🏷️</span>
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-gradient-to-r from-green-500 to-teal-400 hover:from-green-600 hover:to-teal-500 text-white font-medium py-3 rounded-lg shadow-sm hover:shadow transition-all duration-300 disabled:opacity-50 transform hover:-translate-y-0.5 mt-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2 animate-spin"></span>
                Creating...
              </span>
            ) : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;