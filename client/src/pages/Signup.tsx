import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.tsx';
import PageTransition from '../components/PageTransition.tsx';
import { UserPlus, User, Mail, Lock, Phone, MapPin, Building, FileText } from 'lucide-react';

const Signup: React.FC = () => {
  const { register, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'user' | 'collector' | 'factory'>('user');
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  });
  
  // Factory specific fields
  const [factoryName, setFactoryName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  
  // Collector specific fields
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      // Prepare registration data based on role
      let registrationData: any = {
        name,
        email,
        password,
        phone,
        role,
        address
      };
      
      // Add role-specific fields
      if (role === 'factory') {
        registrationData = {
          ...registrationData,
          factoryName,
          ownerName,
          gstNumber
        };
      } else if (role === 'collector') {
        registrationData = {
          ...registrationData,
          companyName,
          contactName,
          serviceArea: serviceArea.split(',').map(area => area.trim()).filter(area => area)
        };
      }
      
      const response: any = await register(registrationData);
      
      // Show success message based on role
      if (role === 'factory' || role === 'collector') {
        setSuccess(`Account created successfully. ${response?.data?.message || 'Waiting for admin approval.'} You can log in to check your approval status.`);
      } else {
        // Redirect regular users to dashboard
        navigate('/dashboard');
      }
    } catch (e: any) {
      console.error('Signup error:', e);
      const errorMessage = e?.message || e?.response?.data?.message || 'Signup failed. Please try again.';
      setError(errorMessage);
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
          
          {/* Signup Form Side */}
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
            
            {success ? (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 mb-6">
                <p className="text-sm font-medium">{success}</p>
                <p className="text-sm mt-2">You can log in to check your approval status.</p>
                <button 
                  onClick={() => navigate('/login')}
                  className="mt-3 text-green-600 hover:text-green-800 font-medium"
                >
                  Go to Login
                </button>
              </div>
            ) : (
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
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    placeholder="Phone" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
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
                    minLength={8}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-green focus:border-eco-green outline-none transition bg-gray-50"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                      placeholder="Street" 
                      value={address.street} 
                      onChange={e => setAddress({...address, street: e.target.value})} 
                      required 
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-green focus:border-eco-green outline-none transition bg-gray-50"
                    />
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                      placeholder="ZIP Code" 
                      value={address.zipCode} 
                      onChange={e => setAddress({...address, zipCode: e.target.value})} 
                      required 
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-green focus:border-eco-green outline-none transition bg-gray-50"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                      placeholder="City" 
                      value={address.city} 
                      onChange={e => setAddress({...address, city: e.target.value})} 
                      required 
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-green focus:border-eco-green outline-none transition bg-gray-50"
                    />
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                      placeholder="State" 
                      value={address.state} 
                      onChange={e => setAddress({...address, state: e.target.value})} 
                      required 
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-green focus:border-eco-green outline-none transition bg-gray-50"
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="h-5 w-5 text-gray-400" />
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
                
                {/* Role-specific fields */}
                {role === 'factory' && (
                  <div className="space-y-4 mt-2 p-4 bg-green-50 rounded-lg border border-green-100">
                    <h3 className="font-medium text-green-800">Factory Information</h3>
                    
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-green-400" />
                      </div>
                      <input 
                        placeholder="Factory Name" 
                        value={factoryName} 
                        onChange={e => setFactoryName(e.target.value)} 
                        required 
                        className="w-full pl-10 pr-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-green-400" />
                      </div>
                      <input 
                        placeholder="Owner Name" 
                        value={ownerName} 
                        onChange={e => setOwnerName(e.target.value)} 
                        required 
                        className="w-full pl-10 pr-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FileText className="h-5 w-5 text-green-400" />
                      </div>
                      <input 
                        placeholder="GST Number" 
                        value={gstNumber} 
                        onChange={e => setGstNumber(e.target.value)} 
                        required 
                        className="w-full pl-10 pr-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                )}
                
                {role === 'collector' && (
                  <div className="space-y-4 mt-2 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <h3 className="font-medium text-blue-800">Collector Information</h3>
                    
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-blue-400" />
                      </div>
                      <input 
                        placeholder="Company Name" 
                        value={companyName} 
                        onChange={e => setCompanyName(e.target.value)} 
                        required 
                        className="w-full pl-10 pr-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-blue-400" />
                      </div>
                      <input 
                        placeholder="Contact Person Name" 
                        value={contactName} 
                        onChange={e => setContactName(e.target.value)} 
                        required 
                        className="w-full pl-10 pr-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-blue-400" />
                      </div>
                      <input 
                        placeholder="Service Areas (comma separated)" 
                        value={serviceArea} 
                        onChange={e => setServiceArea(e.target.value)} 
                        required 
                        className="w-full pl-10 pr-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                )}
                
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-eco-green-dark to-eco-green text-white font-bold py-3 px-4 rounded-lg shadow hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2 animate-spin"></span>
                      Creating Account...
                    </span>
                  ) : 'Sign Up'}
                </motion.button>
              </form>
            )}
            
            <div className="text-center mt-6 text-gray-600">
              Already have an account? <Link to="/login" className="text-eco-green hover:text-eco-green-dark transition">Login</Link>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Signup;