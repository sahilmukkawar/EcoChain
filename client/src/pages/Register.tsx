import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.tsx';
import PageTransition from '../components/PageTransition.tsx';
import { UserPlus, User, Mail, Lock } from 'lucide-react';

const Register: React.FC = () => {
  const { register, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'user'|'collector'|'factory'>('user');
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
      await register(name, email, password, undefined, role);
      // Navigation will be handled by the useEffect above
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Registration failed');
    }
  };

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
                <path d="M250,50c-110.5,0-200,89.5-200,200s89.5,200,200,200s200-89.5,200-200S360.5,50,250,50z" fill="#4ade80" opacity="0.1"/>
                <path d="M360,170c0,22.1-17.9,40-40,40H180c-22.1,0-40-17.9-40-40v-20c0-22.1,17.9-40,40-40h140c22.1,0,40,17.9,40,40V170z" fill="#2D9D78"/>
                <path d="M360,250c0,22.1-17.9,40-40,40H180c-22.1,0-40-17.9-40-40v-20c0-22.1,17.9-40,40-40h140c22.1,0,40,17.9,40,40V250z" fill="#3EB489"/>
                <path d="M360,330c0,22.1-17.9,40-40,40H180c-22.1,0-40-17.9-40-40v-20c0-22.1,17.9-40,40-40h140c22.1,0,40,17.9,40,40V330z" fill="#facc15"/>
                <circle cx="180" cy="150" r="15" fill="#ffffff"/>
                <circle cx="180" cy="230" r="15" fill="#ffffff"/>
                <circle cx="180" cy="310" r="15" fill="#ffffff"/>
                <path d="M320,150H220c-2.8,0-5-2.2-5-5s2.2-5,5-5h100c2.8,0,5,2.2,5,5S322.8,150,320,150z" fill="#ffffff"/>
                <path d="M320,230H220c-2.8,0-5-2.2-5-5s2.2-5,5-5h100c2.8,0,5,2.2,5,5S322.8,230,320,230z" fill="#ffffff"/>
                <path d="M320,310H220c-2.8,0-5-2.2-5-5s2.2-5,5-5h100c2.8,0,5,2.2,5,5S322.8,310,320,310z" fill="#ffffff"/>
              </svg>
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-6"
              >
                <h2 className="text-2xl font-bold text-eco-green-dark mb-2">Join Our Community</h2>
                <p className="text-sm text-eco-green">Create an account to start your recycling journey and earn eco rewards.</p>
              </motion.div>
            </div>
          </motion.div>
          
          {/* Register Form Side */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 w-full max-w-md mx-auto"
          >
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-eco-green-light/20 flex items-center justify-center">
                <UserPlus className="h-8 w-8 text-eco-green" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Join EcoChain</h1>
            <p className="text-gray-600 text-center mb-8">Create your account to get started</p>
            
            <form onSubmit={onSubmit} className="space-y-5">
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
                  placeholder="Full Name" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-green focus:border-eco-green outline-none transition bg-gray-50"
                />
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  placeholder="Email" 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
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
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-green focus:border-eco-green outline-none transition bg-gray-50"
                />
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  placeholder="Confirm Password" 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-green focus:border-eco-green outline-none transition bg-gray-50"
                />
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <select 
                  value={role} 
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-green focus:border-eco-green outline-none transition bg-gray-50 appearance-none"
                >
                  <option value="user">User</option>
                  <option value="collector">Collector</option>
                  <option value="factory">Factory</option>
                </select>
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-eco-green-dark to-eco-green text-white font-bold py-3 px-4 rounded-lg shadow hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </motion.button>
            </form>
            
            <div className="text-center mt-6 text-gray-600">
              Already have an account? <Link to="/login" className="text-eco-green hover:text-eco-green-dark transition">Login</Link>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Register;