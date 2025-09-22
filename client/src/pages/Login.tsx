import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getUserRole } from '../utils/auth';
import PageTransition from '../components/PageTransition';
import { LogIn, User, Lock, Leaf, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
    } catch (e: any) {
      // More specific error messages for login
      if (e?.response?.status === 401) {
        setError('Invalid email or password. Please try again.');
      } else if (e?.response?.status === 403) {
        setError('Your account is not authorized. Please contact support.');
      } else if (e?.response?.status === 429) {
        setError('Too many login attempts. Please try again later.');
      } else if (e?.response?.status === 400) {
        const backendMessage = e?.response?.data?.message;
        if (backendMessage) {
          if (backendMessage.toLowerCase().includes('email')) {
            setError('Please enter a valid email address');
          } else if (backendMessage.toLowerCase().includes('password')) {
            setError('Password must be at least 6 characters long');
          } else {
            setError(backendMessage);
          }
        } else {
          setError('Invalid login credentials. Please check your information.');
        }
      } else if (e?.response?.data?.message) {
        setError(e.response.data.message);
      } else if (e?.message) {
        setError(e.message);
      } else {
        setError('Login failed. Please check your connection and try again.');
      }
    }
  };

  const quickFill = (e: string, p: string) => { setEmail(e); setPassword(p); };

  return (
    <PageTransition>
      <div className="min-h-screen grid md:grid-cols-2 bg-eco-beige">
        {/* Left: Hero with blob and tokens */}
        <div className="relative hidden md:block overflow-hidden">
          {/* subtle emerald grid using your color */}
          <div className="absolute inset-0 [background-image:linear-gradient(#16a34a14_1px,transparent_1px),linear-gradient(90deg,#16a34a14_1px,transparent_1px)] [background-size:28px_28px]" />

          {/* soft emerald blob (your green tones only) - positioned on the left */}
          <motion.svg
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewBox="0 0 600 600"
            className="absolute -left-24 -top-24 w-[750px] h-[750px]"
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
              animate={{
                d: [
                  'M423 115c54 32 96 101 86 165s-78 118-150 164-151 82-204 56-78-109-60-182 79-131 147-168 127-66 181-35z',
                  'M410 130c70 40 115 119 95 179s-92 106-162 145-152 60-205 30-73-114-45-184 101-121 173-160 142-50 144-10z',
                  'M423 115c54 32 96 101 86 165s-78 118-150 164-151 82-204 56-78-109-60-182 79-131 147-168 127-66 181-35z'
                ]
              }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.svg>

          {/* headline + token cluster - positioned in the center of the left side */}
          <div className="relative h-full flex items-center justify-center px-12">
            <div className="max-w-md">
              <div className="inline-flex items-center gap-2 rounded-full border border-eco-green-light/50 bg-eco-green-light/20 px-3 py-1 mb-4">
                <Leaf className="h-4 w-4 text-eco-green" />
                <span className="text-eco-green-dark text-xs font-medium">EcoChain</span>
              </div>
              <h2 className="text-4xl font-semibold tracking-tight text-eco-green-dark">
                Welcome back
              </h2>
              <p className="mt-3 text-eco-green">
                Sign in to your account to continue your eco journey.
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

        {/* Right: Form (unchanged logic, colors constrained to your palette) */}
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
                  <LogIn className="h-7 w-7 text-eco-green" />
                </div>
              </div>

              <h1 className="text-[28px] font-semibold text-center text-gray-900">Welcome back</h1>
              <p className="text-center text-gray-600 mt-1">Sign in to your EcoChain account</p>

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
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    onChange={(e) => setPassword(e.target.value)}
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

                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-lg text-white font-semibold bg-eco-green-dark hover:brightness-105 transition shadow-lg disabled:opacity-60"
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </motion.button>

                <div className="text-center text-sm">
                  <Link to="/signup" className="text-eco-green hover:text-eco-green-dark underline-offset-4 hover:underline">
                    Don&apos;t have an account? Sign up
                  </Link>
                </div>
              </form>

              {/* Quick accounts */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="text-sm text-gray-700 mb-3 font-medium">Quick accounts</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Admin', email: 'admin@ecochain.com', pass: 'Admin@123' },
                    { label: 'Factory', email: 'factory@ecochain.com', pass: 'Factory@123' },
                    { label: 'Collector', email: 'collector@ecochain.com', pass: 'Collector@123' },
                    { label: 'User', email: 'user@ecochain.com', pass: 'User@123' },
                  ].map((q) => (
                    <motion.button
                      key={q.label}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => quickFill(q.email, q.pass)}
                      className="text-xs bg-eco-green-light/10 hover:bg-eco-green-light/20 text-eco-green-dark py-2 px-3 rounded-lg border border-eco-green-light/30 flex items-center justify-center gap-1"
                    >
                      <Leaf className="h-3 w-3 text-eco-green" />
                      {q.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Login;
