import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition.tsx';
import { UserPlus, User, Mail, Lock, Truck, Factory as FactoryIcon, BadgeCheck, Leaf, ChevronLeft, ChevronRight, X, Eye, EyeOff } from 'lucide-react';

const Signup: React.FC = () => {
  const { register, verifyOTP, resendOTP, isLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'user'|'collector'|'factory'>('user');
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  
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
    
    // Client-side validation
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!password) {
      setError('Password is required');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    // If we're on the main form and the user has selected collector or factory, show role form
    if (!showRoleForm && role !== 'user') {
      setShowRoleForm(true);
      return;
    }
    
    // For collectors and factories, we need to collect additional information
    if (showRoleForm && (role === 'collector' || role === 'factory')) {
      // Validate required fields for collector
      if (role === 'collector') {
        if (!collectorData.companyName.trim()) {
          setError('Company name is required for collectors');
          return;
        }
        if (!collectorData.serviceArea.trim()) {
          setError('Service area is required for collectors');
          return;
        }
        if (!collectorData.vehicleDetails.trim()) {
          setError('Vehicle details are required for collectors');
          return;
        }
        if (!collectorData.licenseNumber.trim()) {
          setError('License number is required for collectors');
          return;
        }
      }
      
      // Validate required fields for factory
      if (role === 'factory') {
        if (!factoryData.factoryName.trim()) {
          setError('Factory name is required for factories');
          return;
        }
        if (!factoryData.gstNumber.trim()) {
          setError('GST number is required for factories');
          return;
        }
        if (!factoryData.address.street.trim()) {
          setError('Street address is required for factories');
          return;
        }
        if (!factoryData.address.city.trim()) {
          setError('City is required for factories');
          return;
        }
        if (!factoryData.address.state.trim()) {
          setError('State is required for factories');
          return;
        }
        if (!factoryData.address.zipCode.trim()) {
          setError('ZIP code is required for factories');
          return;
        }
      }
    }
    
    try {
      // Prepare additional info for registration
      const additionalInfo = role === 'collector' 
        ? { collectorInfo: collectorData } 
        : role === 'factory' 
          ? { factoryInfo: factoryData } 
          : {};
      
      const result = await register(name, email, password, undefined, role, additionalInfo);
      
      if (result.requiresEmailVerification) {
        setRequiresEmailVerification(true);
      } else {
        // For immediate login (if any)
        window.location.href = '/dashboard';
      }
    } catch (e: any) {
      // More detailed error handling with specific messages
      console.error('Signup error:', e);
      
      // Handle specific HTTP status codes
      if (e?.response?.status === 409) {
        setError('An account with this email already exists. Please try logging in instead.');
      } else if (e?.response?.status === 400) {
        // Handle validation errors from the backend
        const errorMessage = e?.response?.data?.message;
        if (errorMessage) {
          // Check for specific field validation errors
          if (errorMessage.toLowerCase().includes('email')) {
            setError('Please enter a valid email address');
          } else if (errorMessage.toLowerCase().includes('password')) {
            setError('Password must be at least 6 characters long');
          } else if (errorMessage.toLowerCase().includes('name')) {
            setError('Please enter a valid name');
          } else if (errorMessage.toLowerCase().includes('company')) {
            setError('Please enter a valid company name');
          } else if (errorMessage.toLowerCase().includes('service')) {
            setError('Please enter a valid service area');
          } else if (errorMessage.toLowerCase().includes('vehicle')) {
            setError('Please provide vehicle details');
          } else if (errorMessage.toLowerCase().includes('license')) {
            setError('Please enter a valid license number');
          } else if (errorMessage.toLowerCase().includes('gst')) {
            setError('Please enter a valid GST number');
          } else if (errorMessage.toLowerCase().includes('address')) {
            setError('Please enter a valid address');
          } else if (errorMessage.toLowerCase().includes('city')) {
            setError('Please enter a valid city');
          } else if (errorMessage.toLowerCase().includes('state')) {
            setError('Please enter a valid state');
          } else if (errorMessage.toLowerCase().includes('zip')) {
            setError('Please enter a valid ZIP code');
          } else {
            setError(errorMessage);
          }
        } else {
          setError('Please check your information and try again');
        }
      } else if (e?.response?.status === 422) {
        // Handle validation errors (Unprocessable Entity)
        const validationErrors = e?.response?.data?.errors;
        if (validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0) {
          // Show the first specific validation error
          const firstError = validationErrors[0];
          if (firstError.msg) {
            setError(firstError.msg);
          } else if (firstError.param) {
            setError(`Invalid ${firstError.param}: ${firstError.msg || 'Please check this field'}`);
          } else {
            setError('Please check your information and try again');
          }
        } else {
          setError('Please check your information and try again');
        }
      } else if (e?.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (e?.message) {
        setError(e.message);
      } else {
        setError('Signup failed. Please check your connection and try again.');
      }
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
      // More specific error messages for OTP verification
      if (e?.response?.status === 400) {
        setError('Invalid OTP code. Please check the code and try again.');
      } else if (e?.response?.status === 404) {
        setError('Email not found. Please check your email address.');
      } else if (e?.response?.status === 410) {
        setError('OTP has expired. Please request a new code.');
      } else if (e?.response?.data?.message) {
        setError(e.response.data.message);
      } else if (e?.message) {
        setError(e.message);
      } else {
        setError('OTP verification failed. Please try again.');
      }
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
      // More specific error messages for resend OTP
      if (e?.response?.status === 429) {
        setError('Too many requests. Please wait before requesting another code.');
      } else if (e?.response?.status === 404) {
        setError('Email not found. Please check your email address.');
      } else if (e?.response?.data?.message) {
        setError(e.response.data.message);
      } else if (e?.message) {
        setError(e.message);
      } else {
        setError('Failed to resend OTP. Please try again.');
      }
    } finally {
      setIsResending(false);
    }
  };

  // Render OTP verification form
  if (requiresEmailVerification) {
    return (
      <PageTransition>
        <div className="min-h-screen grid md:grid-cols-2 bg-eco-beige">
          {/* Left: Hero with blob and tokens */}

          <div className="hidden md:block"> {/* no overflow-hidden here */}

            <div className="relative sticky top-0 h-screen overflow-hidden">

              {/* subtle emerald grid */}

              <div className="absolute inset-0 [background-image:linear-gradient(#16a34a14_1px,transparent_1px),linear-gradient(90deg,#16a34a14_1px,transparent_1px)] [background-size:28px_28px]" />



              {/* soft emerald blob */}

              <motion.svg

                initial={{ opacity: 0, scale: 0.98 }}

                animate={{ opacity: 1, scale: 1 }}

                transition={{ duration: 0.6 }}

                viewBox="0 0 600 600"

                className="absolute -left-24 -top-24 w-[750px] h-[750px] pointer-events-none"

              >

                <defs>

                  <linearGradient id="ecoGrad" x1="0" x2="1">

                    <stop offset="0%" stopColor="#22c55e" />

                    <stop offset="100%" stopColor="#16a34a" />

                  </linearGradient>

                </defs>

                <motion.path

                  d="M423 115c54 32 96 101 86 165s-78 118-150 164-151 82-204 56-78-109-60-182 79-131 147-168 127-66 181-35z"

                  fill="url(#ecoGrad)"

                  opacity="0.16"

                  animate={{ d: [

                    'M423 115c54 32 96 101 86 165s-78 118-150 164-151 82-204 56-78-109-60-182 79-131 147-168 127-66 181-35z',

                    'M410 130c70 40 115 119 95 179s-92 106-162 145-152 60-205 30-73-114-45-184 101-121 173-160 142-50 144-10z',

                    'M423 115c54 32 96 101 86 165s-78 118-150 164-151 82-204 56-78-109-60-182 79-131 147-168 127-66 181-35z'

                  ]}}

                  transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}

                />

              </motion.svg>



              {/* centered content */}

              <div className="relative h-full flex items-center justify-center px-12">

                <div className="max-w-md">

                  <div className="inline-flex items-center gap-2 rounded-full border border-eco-green-light/50 bg-eco-green-light/20 px-3 py-1 mb-4">

                    <Leaf className="h-4 w-4 text-eco-green" />

                    <span className="text-eco-green-dark text-xs font-medium">EcoChain</span>

                  </div>

                  <h2 className="text-4xl font-semibold tracking-tight text-eco-green-dark">

                    Secure your account

                  </h2>

                  <p className="mt-3 text-eco-green">

                    Verify your email to complete registration and start your eco journey.

                  </p>



                  {/* Original tokens reintroduced, arranged lightly */}

                  <motion.svg

                    initial={{ opacity: 0, y: 6 }}

                    animate={{ opacity: 1, y: 0 }}

                    transition={{ duration: 0.5, delay: 0.15 }}

                    viewBox="0 0 500 160"

                    className="mt-8 w-full h-auto"

                  >

                    {/* soft background dots in your palette */}

                    <circle cx="60" cy="40" r="12" fill="#22c55e" opacity="0.25" />

                    <circle cx="460" cy="30" r="10" fill="#facc15" opacity="0.45" />

                    <circle cx="420" cy="120" r="14" fill="#16a34a" opacity="0.25" />



                    {/* token row: circle with white rotated square */}

                    {[

                      { x: 110, y: 90, r: 24, c: '#22c55e' },

                      { x: 170, y: 110, r: 22, c: '#16a34a' },

                      { x: 230, y: 95, r: 24, c: '#facc15' },

                      { x: 290, y: 110, r: 22, c: '#22c55e' },

                      { x: 350, y: 95, r: 24, c: '#16a34a' },

                    ].map((t, i) => (

                      <g key={i}>

                        <circle cx={t.x} cy={t.y} r={t.r} fill={t.c} />

                        <rect

                          x={t.x - (t.r * 0.55)}

                          y={t.y - (t.r * 0.55)}

                          width={t.r * 1.1}

                          height={t.r * 1.1}

                          fill="white"

                          transform={`rotate(45 ${t.x} ${t.y})`}

                        />

                      </g>

                    ))}

                  </motion.svg>

                </div>

              </div>

            </div>

          </div>
          
          {/* Right: OTP Verification Form */}
          <div className="flex items-center justify-center px-4 py-12">
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.45 }}
              className="w-full max-w-md"
            >
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div className="flex justify-center mb-6">
                  <div className="h-14 w-14 rounded-xl bg-eco-green-light/30 flex items-center justify-center ring-1 ring-eco-green-light/50">
                    <UserPlus className="h-7 w-7 text-eco-green" />
                  </div>
                </div>

                <h1 className="text-[28px] font-semibold text-center text-gray-900">Verify Email</h1>
                <p className="text-center text-gray-600 mt-1">Enter the 6-digit code sent to your email</p>

                <form onSubmit={onVerifyOTP} className="space-y-5 mt-7">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
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
                      className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-green focus:border-eco-green outline-none transition bg-gray-50 text-center text-2xl tracking-widest"
                    />
                  </div>

                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isVerifying || otp.length !== 6}
                    className="w-full py-3.5 rounded-lg text-white font-semibold bg-eco-green-dark hover:brightness-105 transition shadow-lg disabled:opacity-60"
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
      <div className="min-h-screen grid md:grid-cols-2 bg-eco-beige">
        {/* Left: Hero with blob and tokens */}

        <div className="hidden md:block"> {/* no overflow-hidden here */}

          <div className="relative sticky top-0 h-screen overflow-hidden">

            {/* subtle emerald grid */}

            <div className="absolute inset-0 [background-image:linear-gradient(#16a34a14_1px,transparent_1px),linear-gradient(90deg,#16a34a14_1px,transparent_1px)] [background-size:28px_28px]" />



            {/* soft emerald blob */}

            <motion.svg

              initial={{ opacity: 0, scale: 0.98 }}

              animate={{ opacity: 1, scale: 1 }}

              transition={{ duration: 0.6 }}

              viewBox="0 0 600 600"

              className="absolute -left-24 -top-24 w-[750px] h-[750px] pointer-events-none"

            >

              <defs>

                <linearGradient id="ecoGrad" x1="0" x2="1">

                  <stop offset="0%" stopColor="#22c55e" />

                  <stop offset="100%" stopColor="#16a34a" />

                </linearGradient>

              </defs>

              <motion.path

                d="M423 115c54 32 96 101 86 165s-78 118-150 164-151 82-204 56-78-109-60-182 79-131 147-168 127-66 181-35z"

                fill="url(#ecoGrad)"

                opacity="0.16"

                animate={{ d: [

                  'M423 115c54 32 96 101 86 165s-78 118-150 164-151 82-204 56-78-109-60-182 79-131 147-168 127-66 181-35z',

                  'M410 130c70 40 115 119 95 179s-92 106-162 145-152 60-205 30-73-114-45-184 101-121 173-160 142-50 144-10z',

                  'M423 115c54 32 96 101 86 165s-78 118-150 164-151 82-204 56-78-109-60-182 79-131 147-168 127-66 181-35z'

                ]}}

                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}

              />

            </motion.svg>



            {/* centered content */}

            <div className="relative h-full flex items-center justify-center px-12">

              <div className="max-w-md">

                <div className="inline-flex items-center gap-2 rounded-full border border-eco-green-light/50 bg-eco-green-light/20 px-3 py-1 mb-4">

                  <Leaf className="h-4 w-4 text-eco-green" />

                  <span className="text-eco-green-dark text-xs font-medium">EcoChain</span>

                </div>

                <h2 className="text-4xl font-semibold tracking-tight text-eco-green-dark">

                  Join our eco community

                </h2>

                <p className="mt-3 text-eco-green">

                  Create an account to start your recycling journey and earn eco rewards.

                </p>



                {/* Original tokens reintroduced, arranged lightly */}

                <motion.svg

                  initial={{ opacity: 0, y: 6 }}

                  animate={{ opacity: 1, y: 0 }}

                  transition={{ duration: 0.5, delay: 0.15 }}

                  viewBox="0 0 500 160"

                  className="mt-8 w-full h-auto"

                >

                  {/* soft background dots in your palette */}

                  <circle cx="60" cy="40" r="12" fill="#22c55e" opacity="0.25" />

                  <circle cx="460" cy="30" r="10" fill="#facc15" opacity="0.45" />

                  <circle cx="420" cy="120" r="14" fill="#16a34a" opacity="0.25" />



                  {/* token row: circle with white rotated square */}

                  {[

                    { x: 110, y: 90, r: 24, c: '#22c55e' },

                    { x: 170, y: 110, r: 22, c: '#16a34a' },

                    { x: 230, y: 95, r: 24, c: '#facc15' },

                    { x: 290, y: 110, r: 22, c: '#22c55e' },

                    { x: 350, y: 95, r: 24, c: '#16a34a' },

                  ].map((t, i) => (

                    <g key={i}>

                      <circle cx={t.x} cy={t.y} r={t.r} fill={t.c} />

                      <rect

                        x={t.x - (t.r * 0.55)}

                        y={t.y - (t.r * 0.55)}

                        width={t.r * 1.1}

                        height={t.r * 1.1}

                        fill="white"

                        transform={`rotate(45 ${t.x} ${t.y})`}

                      />

                    </g>

                  ))}

                </motion.svg>

              </div>

            </div>

          </div>

        </div>
        
        {/* Right: Register Form */}
        <div className="flex items-center justify-center px-4 py-12">
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              {/* Slider Carousel */}
              <AnimatePresence mode="wait">
                {!showRoleForm ? (
                  // Main Form Slide
                  <motion.div
                    key="main-form"
                    initial={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex justify-center mb-6">
                      <div className="h-14 w-14 rounded-xl bg-eco-green-light/30 flex items-center justify-center ring-1 ring-eco-green-light/50">
                        <UserPlus className="h-7 w-7 text-eco-green" />
                      </div>
                    </div>

                    <h1 className="text-[28px] font-semibold text-center text-gray-900">Join EcoChain</h1>
                    <p className="text-center text-gray-600 mt-1">Create your account to get started</p>

                    <form onSubmit={onSubmit} className="space-y-5 mt-7">
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-eco-red/10 border border-eco-red text-eco-red-dark px-4 py-3 rounded-lg"
                        >
                          {error}
                        </motion.div>
                      )}

                      <div className="relative">
                        <User className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          placeholder="Full Name"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          required
                          className="w-full pl-10 pr-3 py-3.5 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-eco-green focus:border-eco-green outline-none transition"
                        />
                      </div>

                      <div className="relative">
                        <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          placeholder="Email"
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                          className="w-full pl-10 pr-3 py-3.5 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-eco-green focus:border-eco-green outline-none transition"
                        />
                      </div>

                      <div className="relative">
                        <Lock className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          placeholder="Password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                          className="w-full pl-10 pr-10 py-3.5 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-eco-green focus:border-eco-green outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>

                      {/* Role Selection Chips */}
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => setRole('user')}
                            className={`flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-lg border transition-all ${
                              role === 'user'
                                ? 'border-eco-green bg-eco-green-light/20 text-eco-green-dark'
                                : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <User className="h-5 w-5" />
                            <span className="text-sm font-medium">User</span>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => setRole('collector')}
                            className={`flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-lg border transition-all ${
                              role === ('collector' as typeof role)
                                ? 'border-eco-green bg-eco-green-light/20 text-eco-green-dark'
                                : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <Truck className="h-5 w-5" />
                            <span className="text-sm font-medium">Collector</span>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => setRole('factory')}
                            className={`flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-lg border transition-all ${
                              role === ('factory' as typeof role)
                                ? 'border-eco-green bg-eco-green-light/20 text-eco-green-dark'
                                : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <FactoryIcon className="h-5 w-5" />
                            <span className="text-sm font-medium">Factory</span>
                          </motion.button>
                        </div>

                        {/* Hidden select for form semantics */}
                        <select
                          value={role}
                          onChange={e => setRole(e.target.value as any)}
                          className="hidden"
                        >
                          <option value="user">User</option>
                          <option value="collector">Collector</option>
                          <option value="factory">Factory</option>
                        </select>
                      </div>

                      <motion.button
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 rounded-lg text-white font-semibold bg-eco-green-dark hover:brightness-105 transition shadow-lg disabled:opacity-60"
                      >
                        {isLoading ? 'Creating Account...' : (role !== 'user' ? 'Continue' : 'Create Account')}
                      </motion.button>
                    </form>

                    <div className="text-center mt-6 text-gray-600">
                      Already have an account? <Link to="/login" className="text-eco-green hover:text-eco-green-dark underline-offset-4 hover:underline">Sign In</Link>
                    </div>
                  </motion.div>
                ) : (
                  // Role-specific Form Slide
                  <motion.div
                    key="role-form"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <button
                        type="button"
                        onClick={() => setShowRoleForm(false)}
                        className="flex items-center gap-1 text-eco-green hover:text-eco-green-dark"
                      >
                        <ChevronLeft className="h-5 w-5" />
                        Back
                      </button>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {role === ('collector' as typeof role) ? 'Collector Info' : 'Factory Info'}
                      </h2>
                      <button
                        type="button"
                        onClick={() => setShowRoleForm(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-5">
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-eco-red/10 border border-eco-red text-eco-red-dark px-4 py-3 rounded-lg"
                        >
                          {error}
                        </motion.div>
                      )}

                      {role === ('collector' as typeof role) ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                              <input
                                type="text"
                                name="companyName"
                                value={collectorData.companyName}
                                onChange={handleCollectorChange}
                                required
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
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
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
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
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
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
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
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
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                              <input
                                type="email"
                                name="contactPerson.email"
                                value={collectorData.contactPerson.email}
                                onChange={handleCollectorChange}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                              <input
                                type="tel"
                                name="contactPerson.phone"
                                value={collectorData.contactPerson.phone}
                                onChange={handleCollectorChange}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
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
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
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
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
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
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Factory Name *</label>
                              <input
                                type="text"
                                name="factoryName"
                                value={factoryData.factoryName}
                                onChange={handleFactoryChange}
                                required
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
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
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
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
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
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
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
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
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
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
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
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
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent bg-gray-100"
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
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                              <input
                                type="email"
                                name="contactPerson.email"
                                value={factoryData.contactPerson.email}
                                onChange={handleFactoryChange}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                              <input
                                type="tel"
                                name="contactPerson.phone"
                                value={factoryData.contactPerson.phone}
                                onChange={handleFactoryChange}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
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
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
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
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
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
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <motion.button
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 rounded-lg text-white font-semibold bg-eco-green-dark hover:brightness-105 transition shadow-lg disabled:opacity-60"
                      >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                      </motion.button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Signup;
