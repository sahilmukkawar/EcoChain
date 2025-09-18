import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.tsx';
import { getUserRole } from '../utils/auth.ts';
import PageTransition from '../components/PageTransition.tsx';
import { LogIn, User, Lock } from 'lucide-react';

const Login: React.FC = () => {
  const { login, isLoading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response: any = await login(email, password);
      // Navigation will be handled by the useEffect below
      // But we can check the response for pending approval status
      if (response?.data?.pendingApproval) {
        // User logged in but needs approval - this will be handled by useEffect
        console.log('User logged in but pending approval');
      }
    } catch (e: any) {
      setError(e?.message || e?.response?.data?.message || 'Login failed');
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if factory or collector with pending approval
      if ((user.role === 'factory' || user.role === 'collector') && user.approvalStatus !== 'approved') {
        navigate('/pending-approval');
      } else {
        // Regular navigation logic
        if (user.role === 'admin') navigate('/admin-dashboard');
        else if (user.role === 'factory') navigate('/factory-dashboard');
        else if (user.role === 'collector') navigate('/collector-dashboard');
        else navigate('/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const quickFill = (e: string, p: string) => { setEmail(e); setPassword(p); };

  return (
    <PageTransition>
      <div className="min-h-screen bg-eco-beige flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
          {/* Illustration Side */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden md:flex flex-col items-center justify-center"
          >
            <div className="relative w-full max-w-md">
              <svg className="w-full h-auto" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                <path d="M416.1,143.3c-12.7-12.7-30.8-18.6-48.9-15.8c-18.1,2.8-33.7,14.5-41.5,31.4c-7.8,16.9-6.3,36.2,4,51.8 c10.3,15.6,28.2,24.4,47,23.2c18.8-1.2,35.3-12.5,43.7-29.9C428.8,186.6,428.8,156,416.1,143.3z" fill="#22c55e" />
                <path d="M278.5,218.5c-17.8,0-34.8,7.1-47.3,19.6c-12.5,12.5-19.6,29.5-19.6,47.3c0,17.8,7.1,34.8,19.6,47.3 c12.5,12.5,29.5,19.6,47.3,19.6c17.8,0,34.8-7.1,47.3-19.6c12.5-12.5,19.6-29.5,19.6-47.3c0-17.8-7.1-34.8-19.6-47.3 C313.3,225.6,296.3,218.5,278.5,218.5z" fill="#16a34a" />
                <path d="M160.7,143.3c-12.7,12.7-12.7,43.3-4.3,60.7c8.4,17.4,24.9,28.7,43.7,29.9c18.8,1.2,36.7-7.6,47-23.2 c10.3-15.6,11.8-34.9,4-51.8c-7.8-16.9-23.4-28.6-41.5-31.4C191.5,124.7,173.4,130.6,160.7,143.3z" fill="#facc15" />
                <path d="M278.5,68.1c-17.8,0-34.8,7.1-47.3,19.6c-12.5,12.5-19.6,29.5-19.6,47.3c0,17.8,7.1,34.8,19.6,47.3 c12.5,12.5,29.5,19.6,47.3,19.6c17.8,0,34.8-7.1,47.3-19.6c12.5-12.5,19.6-29.5,19.6-47.3c0-17.8-7.1-34.8-19.6-47.3 C313.3,75.2,296.3,68.1,278.5,68.1z" fill="#22c55e" />
                <path d="M278.5,368.9c-17.8,0-34.8,7.1-47.3,19.6c-12.5,12.5-19.6,29.5-19.6,47.3c0,17.8,7.1,34.8,19.6,47.3 c12.5,12.5,29.5,19.6,47.3,19.6c17.8,0,34.8-7.1,47.3-19.6c12.5-12.5,19.6-29.5,19.6-47.3c0-17.8-7.1-34.8-19.6-47.3 C313.3,376,296.3,368.9,278.5,368.9z" fill="#16a34a" />
                <path d="M160.7,368.9c-12.7-12.7-30.8-18.6-48.9-15.8c-18.1,2.8-33.7,14.5-41.5,31.4c-7.8,16.9-6.3,36.2,4,51.8 c10.3,15.6,28.2,24.4,47,23.2c18.8-1.2,35.3-12.5,43.7-29.9C173.4,412.2,173.4,381.6,160.7,368.9z" fill="#22c55e" />
                <path d="M84.1,218.5c-17.8,0-34.8,7.1-47.3,19.6c-12.5,12.5-19.6,29.5-19.6,47.3c0,17.8,7.1,34.8,19.6,47.3 c12.5,12.5,29.5,19.6,47.3,19.6c17.8,0,34.8-7.1,47.3-19.6c12.5-12.5,19.6-29.5,19.6-47.3c0-17.8-7.1-34.8-19.6-47.3 C118.9,225.6,101.9,218.5,84.1,218.5z" fill="#facc15" />
                <path d="M278.5,218.5l-47.3,47.3l47.3,47.3l47.3-47.3L278.5,218.5z" fill="#ffffff" />
                <path d="M278.5,68.1l-47.3,47.3l47.3,47.3l47.3-47.3L278.5,68.1z" fill="#ffffff" />
                <path d="M278.5,368.9l-47.3,47.3l47.3,47.3l47.3-47.3L278.5,368.9z" fill="#ffffff" />
                <path d="M84.1,218.5l-47.3,47.3l47.3,47.3l47.3-47.3L84.1,218.5z" fill="#ffffff" />
              </svg>
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-6"
              >
                <h2 className="text-2xl font-bold text-eco-green-dark mb-2">Welcome to EcoChain</h2>
                <p className="text-sm text-eco-green">Join our community and help build a sustainable future through recycling.</p>
              </motion.div>
            </div>
          </motion.div>
          
          {/* Login Form Side */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 w-full max-w-md mx-auto"
          >
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-eco-green-light/20 flex items-center justify-center">
                <LogIn className="h-8 w-8 text-eco-green" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Welcome back</h1>
            <p className="text-gray-600 text-center mb-8">Sign in to your EcoChain account</p>
            
            <form onSubmit={onSubmit} className="space-y-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-eco-red/10 border border-eco-red text-eco-red-dark px-4 py-3 rounded-lg"
                >
                  {error}
                </motion.div>
              )}
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  placeholder="Email" 
                  value={email} 
                  onChange={e=>setEmail(e.target.value)} 
                  required 
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-green focus:border-eco-green outline-none transition bg-gray-50"
                />
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  placeholder="Password" 
                  type="password" 
                  value={password} 
                  onChange={e=>setPassword(e.target.value)} 
                  required 
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-green focus:border-eco-green outline-none transition bg-gray-50"
                />
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-eco-green-dark to-eco-green text-white font-bold py-3 px-4 rounded-lg shadow hover:shadow-lg transition-all duration-300 disabled:opacity-50" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </motion.button>
              
              <div className="text-center text-sm">
                <Link to="/signup" className="text-eco-green hover:text-eco-green-dark transition">
                  Don't have an account? Sign Up here
                </Link>
              </div>
            </form>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-3 font-medium">Quick Accounts:</div>
              <div className="grid grid-cols-2 gap-2">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={()=>quickFill('admin@ecochain.com','Admin@123')} 
                  className="text-xs bg-eco-green-light/10 hover:bg-eco-green-light/20 text-eco-green-dark py-2 px-3 rounded-lg transition border border-eco-green-light/30"
                >
                  Admin
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={()=>quickFill('factory@ecochain.com','Factory@123')} 
                  className="text-xs bg-eco-green-light/10 hover:bg-eco-green-light/20 text-eco-green-dark py-2 px-3 rounded-lg transition border border-eco-green-light/30"
                >
                  Factory
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={()=>quickFill('collector@ecochain.com','Collector@123')} 
                  className="text-xs bg-eco-green-light/10 hover:bg-eco-green-light/20 text-eco-green-dark py-2 px-3 rounded-lg transition border border-eco-green-light/30"
                >
                  Collector
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={()=>quickFill('user@ecochain.com','User@123')} 
                  className="text-xs bg-eco-green-light/10 hover:bg-eco-green-light/20 text-eco-green-dark py-2 px-3 rounded-lg transition border border-eco-green-light/30"
                >
                  User
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Login;