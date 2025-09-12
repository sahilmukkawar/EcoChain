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
      <div className="w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Create account</h1>
        <p className="text-gray-600 text-center mb-6">Join EcoChain and start earning EcoTokens</p>
        <form onSubmit={onSubmit} className="w-full flex flex-col gap-4">
          {error && <div className="p-3 rounded-lg bg-red-100 border border-red-300 text-red-700">{error}</div>}
          <input 
            placeholder="Full name" 
            value={name} 
            onChange={e=>setName(e.target.value)} 
            required 
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input 
            placeholder="Email" 
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
            required 
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input 
            placeholder="Password" 
            type="password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            required 
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <select 
            value={role} 
            onChange={e=>setRole(e.target.value as any)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="user">User</option>
            <option value="collector">Collector</option>
            <option value="factory">Factory</option>
          </select>
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-gradient-to-r from-green-500 to-yellow-500 text-gray-900 font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;