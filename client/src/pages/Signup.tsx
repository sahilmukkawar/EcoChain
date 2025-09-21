import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition.tsx';
import { UserPlus, User, Mail, Lock } from 'lucide-react';

const Signup: React.FC = () => {
  const { register, verifyOTP, resendOTP, isLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user'|'collector'|'factory'>('user');
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  // Additional fields for collectors
  const [collectorData, setCollectorData] = useState({
    companyName: '',
    serviceArea: '',
    vehicleDetails: '',
    licenseNumber: '',
    contactPerson: {
      name: '',
      email: '',
      phone: ''
    },
    businessDetails: {
      establishedYear: '',
      website: '',
      description: ''
    }
  });
  
  // Additional fields for factories
  const [factoryData, setFactoryData] = useState({
    factoryName: '',
    gstNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    contactPerson: {
      name: '',
      email: '',
      phone: ''
    },
    businessDetails: {
      establishedYear: '',
      website: '',
      description: ''
    }
  });

  const handleCollectorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setCollectorData(prev => {
        if (parent === 'contactPerson') {
          return {
            ...prev,
            contactPerson: {
              ...prev.contactPerson,
              [child]: value
            }
          };
        } else if (parent === 'businessDetails') {
          return {
            ...prev,
            businessDetails: {
              ...prev.businessDetails,
              [child]: value
            }
          };
        }
        return prev;
      });
    } else {
      setCollectorData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFactoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFactoryData(prev => {
        if (parent === 'contactPerson') {
          return {
            ...prev,
            contactPerson: {
              ...prev.contactPerson,
              [child]: value
            }
          };
        } else if (parent === 'businessDetails') {
          return {
            ...prev,
            businessDetails: {
              ...prev.businessDetails,
              [child]: value
            }
          };
        } else if (parent === 'address') {
          return {
            ...prev,
            address: {
              ...prev.address,
              [child]: value
            }
          };
        }
        return prev;
      });
    } else {
      setFactoryData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // For collectors and factories, we need to collect additional information
      if (role === 'collector' || role === 'factory') {
        // Validate required fields for collector
        if (role === 'collector') {
          if (!collectorData.companyName || !collectorData.serviceArea || 
              !collectorData.vehicleDetails || !collectorData.licenseNumber) {
            setError('Please fill in all required collector information');
            return;
          }
        }
        
        // Validate required fields for factory
        if (role === 'factory') {
          if (!factoryData.factoryName || !factoryData.gstNumber || 
              !factoryData.address.street || !factoryData.address.city || 
              !factoryData.address.state || !factoryData.address.zipCode) {
            setError('Please fill in all required factory information');
            return;
          }
        }
      }
      
      // Prepare additional info for registration
      const additionalInfo = role === 'collector' 
        ? { collectorData } 
        : role === 'factory' 
          ? { factoryData } 
          : {};
      
      const result = await register(name, email, password, undefined, role, additionalInfo);
      
      if (result.requiresEmailVerification) {
        setRequiresEmailVerification(true);
      } else {
        // For immediate login (if any)
        window.location.href = '/dashboard';
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Signup failed');
    }
  };

  const onVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);
    try {
      await verifyOTP(email, otp);
      
      // After successful verification, redirect based on role
      if (role === 'collector' || role === 'factory') {
        // For collectors and factories, redirect to pending approval page
        // Add a small delay to ensure the user sees the success message
        setTimeout(() => {
          navigate('/pending-approval');
        }, 1000);
      } else {
        // For regular users, redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'OTP verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const submitAdditionalInfo = async () => {
    // This function is no longer needed as additional info is sent during registration
    // The application is automatically created in the backend
    navigate('/pending-approval');
  };

  const onResendOTP = async () => {
    setError(null);
    setIsResending(true);
    try {
      await resendOTP(email);
      // Show success message
      setError('OTP resent successfully. Please check your email.');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  // Render OTP verification form
  if (requiresEmailVerification) {
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
                  <h2 className="text-2xl font-bold text-eco-green-dark mb-2">Verify Your Account</h2>
                  <p className="text-sm text-eco-green">Enter the code sent to your email to complete registration.</p>
                </motion.div>
              </div>
            </motion.div>
            
            {/* OTP Verification Form Side */}
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
              <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Verify Email</h1>
              <p className="text-gray-600 text-center mb-8">Enter the 6-digit code sent to your email</p>
              
              <form onSubmit={onVerifyOTP} className="space-y-5">
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
                  <input 
                    placeholder="Enter 6-digit code" 
                    value={otp} 
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                    required 
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-green focus:border-eco-green outline-none transition bg-gray-50 text-center text-2xl tracking-widest"
                  />
                </div>
                
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={isVerifying || otp.length !== 6}
                  className="w-full bg-gradient-to-r from-eco-green-dark to-eco-green text-white font-bold py-3 px-4 rounded-lg shadow hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                >
                  {isVerifying ? 'Verifying...' : 'Verify Email'}
                </motion.button>
                
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={onResendOTP}
                    disabled={isResending}
                    className="text-sm text-eco-green hover:text-eco-green-dark font-medium disabled:opacity-50"
                  >
                    {isResending ? 'Resending...' : 'Resend Code'}
                  </button>
                </div>
              </form>
              
              <div className="text-center mt-6 text-gray-600">
                <button
                  onClick={() => setRequiresEmailVerification(false)}
                  className="text-eco-green hover:text-eco-green-dark transition"
                >
                  ← Back to Sign Up
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Render regular signup form
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
                <select 
                  value={role} 
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-green focus:border-eco-green outline-none transition bg-gray-50 appearance-none"
                >
                  <option value="user">User</option>
                  <option value="collector">Collector</option>
                  <option value="factory">Factory</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🏷️</span>
                </div>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">▼</span>
                </div>
              </div>
              
              {/* Collector Additional Information */}
              {role === 'collector' && (
                <div className="border-t border-gray-200 pt-6 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Collector Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                      <input
                        type="text"
                        name="companyName"
                        value={collectorData.companyName}
                        onChange={handleCollectorChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service Area *</label>
                      <input
                        type="text"
                        name="serviceArea"
                        value={collectorData.serviceArea}
                        onChange={handleCollectorChange}
                        required
                        placeholder="Enter city or area name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Details *</label>
                      <textarea
                        name="vehicleDetails"
                        value={collectorData.vehicleDetails}
                        onChange={handleCollectorChange}
                        required
                        rows={3}
                        placeholder="Describe your vehicle(s) - type, capacity, registration, etc."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
                      <input
                        type="text"
                        name="licenseNumber"
                        value={collectorData.licenseNumber}
                        onChange={handleCollectorChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <h4 className="text-md font-medium text-gray-800 mt-6 mb-3">Contact Person</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        name="contactPerson.name"
                        value={collectorData.contactPerson.name}
                        onChange={handleCollectorChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        name="contactPerson.email"
                        value={collectorData.contactPerson.email}
                        onChange={handleCollectorChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        name="contactPerson.phone"
                        value={collectorData.contactPerson.phone}
                        onChange={handleCollectorChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <h4 className="text-md font-medium text-gray-800 mt-6 mb-3">Business Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
                      <input
                        type="number"
                        name="businessDetails.establishedYear"
                        value={collectorData.businessDetails.establishedYear}
                        onChange={handleCollectorChange}
                        min="1900"
                        max={new Date().getFullYear()}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input
                        type="url"
                        name="businessDetails.website"
                        value={collectorData.businessDetails.website}
                        onChange={handleCollectorChange}
                        placeholder="https://example.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        name="businessDetails.description"
                        value={collectorData.businessDetails.description}
                        onChange={handleCollectorChange}
                        rows={2}
                        placeholder="Brief description of your business"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Factory Additional Information */}
              {role === 'factory' && (
                <div className="border-t border-gray-200 pt-6 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Factory Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Factory Name *</label>
                      <input
                        type="text"
                        name="factoryName"
                        value={factoryData.factoryName}
                        onChange={handleFactoryChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">GST Number *</label>
                      <input
                        type="text"
                        name="gstNumber"
                        value={factoryData.gstNumber}
                        onChange={handleFactoryChange}
                        required
                        placeholder="e.g., 22AAAAA0000A1Z5"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <h4 className="text-md font-medium text-gray-800 mt-4 mb-3">Factory Address</h4>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                      <input
                        type="text"
                        name="address.street"
                        value={factoryData.address.street}
                        onChange={handleFactoryChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        name="address.city"
                        value={factoryData.address.city}
                        onChange={handleFactoryChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                      <input
                        type="text"
                        name="address.state"
                        value={factoryData.address.state}
                        onChange={handleFactoryChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                      <input
                        type="text"
                        name="address.zipCode"
                        value={factoryData.address.zipCode}
                        onChange={handleFactoryChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        name="address.country"
                        value={factoryData.address.country}
                        onChange={handleFactoryChange}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent bg-gray-100"
                      />
                    </div>
                  </div>
                  
                  <h4 className="text-md font-medium text-gray-800 mt-6 mb-3">Contact Person</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        name="contactPerson.name"
                        value={factoryData.contactPerson.name}
                        onChange={handleFactoryChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        name="contactPerson.email"
                        value={factoryData.contactPerson.email}
                        onChange={handleFactoryChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        name="contactPerson.phone"
                        value={factoryData.contactPerson.phone}
                        onChange={handleFactoryChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <h4 className="text-md font-medium text-gray-800 mt-6 mb-3">Business Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
                      <input
                        type="number"
                        name="businessDetails.establishedYear"
                        value={factoryData.businessDetails.establishedYear}
                        onChange={handleFactoryChange}
                        min="1900"
                        max={new Date().getFullYear()}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input
                        type="url"
                        name="businessDetails.website"
                        value={factoryData.businessDetails.website}
                        onChange={handleFactoryChange}
                        placeholder="https://example.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        name="businessDetails.description"
                        value={factoryData.businessDetails.description}
                        onChange={handleFactoryChange}
                        rows={2}
                        placeholder="Brief description of your factory"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                      />
                    </div>
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
                {isLoading ? 'Creating Account...' : 'Register'}
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

export default Signup;