import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useAnimation } from "framer-motion";
import {
  Leaf,
  Factory,
  LinkIcon,
  BarChart3,
  Eye,
  Shield,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
  Users,
  Globe,
  Zap,
  BadgeCheck,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Building2,
  Check,
  Plus,
  Package,
  Recycle,
  Play,
  Calculator,
  Award,
  TreePine,
  X,
  ArrowDown,
  ShoppingBag
} from 'lucide-react';
import marketplaceService, { PopulatedMarketplaceItem } from '../services/marketplaceService.ts';
import { useCart, Product as CartProduct } from '../contexts/CartContext.tsx';

// Extended product interface for Home page display
interface ExtendedProduct extends CartProduct {
  factoryName?: string;
  stock: number;
  sustainabilityScore?: number;
  status?: 'available' | 'sold_out';
}

// Mock data for demonstration
const mockProducts: ExtendedProduct[] = [
  {
    id: '1',
    name: 'Eco-Friendly Water Bottle',
    description: 'Made from 100% recycled materials',
    price: 299,
    tokenPrice: 50,
    category: 'Lifestyle',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=300&fit=crop&crop=center',
    sustainabilityScore: 92,
    status: 'available',
    stock: 150
  },
  {
    id: '2',
    name: 'Recycled Plastic Chair',
    description: 'Comfortable seating from ocean plastic',
    price: 1899,
    tokenPrice: 200,
    category: 'Furniture',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop&crop=center',
    sustainabilityScore: 88,
    status: 'available',
    stock: 45
  },
  {
    id: '3',
    name: 'Solar Power Bank',
    description: 'Renewable energy on the go',
    price: 799,
    tokenPrice: 100,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=300&fit=crop&crop=center',
    sustainabilityScore: 95,
    status: 'available',
    stock: 89
  },
  {
    id: '4',
    name: 'Organic Cotton Tote',
    description: 'Sustainable shopping companion',
    price: 149,
    tokenPrice: 25,
    category: 'Accessories',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop&crop=center',
    sustainabilityScore: 90,
    status: 'sold_out',
    stock: 0
  }
];

const mockCompanyLogos = [
  { name: 'TechCorp', logo: '🏢' },
  { name: 'GreenInc', logo: '🌱' },
  { name: 'EcoSystems', logo: '♻' },
  { name: 'CleanTech', logo: '🔋' },
  { name: 'SustainCo', logo: '🌍' }
];

interface Dashboard {
  title: string;
  description: string;
  image: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
}

// Function to convert API product to our ExtendedProduct interface
const mapApiProductToProduct = (apiProduct: PopulatedMarketplaceItem): ExtendedProduct => ({
  id: apiProduct._id,
  name: apiProduct.productInfo.name,
  description: apiProduct.productInfo.description,
  price: apiProduct.pricing.sellingPrice || 0,
  tokenPrice: apiProduct.pricing.ecoTokenDiscount || 0,
  category: apiProduct.productInfo.category,
  imageUrl: apiProduct.productInfo.images?.[0] || '/uploads/default-product.svg',
  sustainabilityScore: apiProduct.sustainability.recycledMaterialPercentage || 85,
  status: apiProduct.inventory.currentStock > 0 && apiProduct.availability.isActive ? 'available' : 'sold_out',
  factoryName: apiProduct.factoryId?.companyInfo?.name,
  stock: apiProduct.inventory.currentStock
});

const EcoChainLanding = () => {
  const [statsInView, setStatsInView] = useState(false);
  const statsRef = useRef<HTMLDivElement | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<ExtendedProduct[]>(mockProducts);
  const [productsLoading, setProductsLoading] = useState(false);
  const { addToCart } = useCart();
  const [addedToCartItems, setAddedToCartItems] = useState<Record<string, boolean>>({});
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [currentDashboard, setCurrentDashboard] = useState(0);
  const [impactValue, setImpactValue] = useState(3000);
  const [realTimeStats, setRealTimeStats] = useState({
    factories: 147,
    carbonSaved: 23.4,
    transparency: 98.7,
    tokensEarned: 1247389
  });

  // Real-time stats updater
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeStats(prev => ({
        factories: prev.factories + Math.floor(Math.random() * 2),
        carbonSaved: Number((prev.carbonSaved + Math.random() * 0.1).toFixed(1)),
        transparency: Math.min(99.9, Number((prev.transparency + Math.random() * 0.01).toFixed(1))),
        tokensEarned: prev.tokensEarned + Math.floor(Math.random() * 100)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Exit intent detection
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !showExitIntent) {
        setShowExitIntent(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [showExitIntent]);

  const dashboards = [
    {
      title: "Admin Dashboard",
      description: "Gain a centralized view of your entire supply chain with advanced analytics, sustainability insights, and operational performance metrics—all in one place.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&crop=center",
      icon: BarChart3,
      features: ["Real-time Analytics", "Supply Chain Overview", "Sustainability Reports"]
    },
    {
      title: "Factory Dashboard",
      description: "Monitor factory operations in real time with live production data, energy consumption tracking, and environmental impact reports for smarter decision-making.",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop&crop=center",
      icon: Factory,
      features: ["Production Monitoring", "Energy Tracking", "Quality Control"]
    },
    {
      title: "User Dashboard",
      description: "Empower consumers with complete product transparency—trace items from origin to destination and verify ethical and sustainable sourcing practices.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop&crop=center",
      icon: LinkIcon,
      features: ["Product Tracing", "Impact Tracking", "Rewards Management"]
    },
    {
      title: "Collector Dashboard",
      description: "Enable waste collectors and recyclers to track collection activities, measure recovery impact, and contribute directly to a more circular and sustainable economy.",
      image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&h=400&fit=crop&crop=center",
      icon: Recycle,
      features: ["Collection Tracking", "Impact Measurement", "Earnings Overview"]
    }
  ];

  // Animated counter values
  const factoriesRef = useRef<HTMLSpanElement | null>(null);
  const carbonRef = useRef<HTMLSpanElement | null>(null);
  const transparencyRef = useRef<HTMLSpanElement | null>(null);
  const tokensRef = useRef<HTMLSpanElement | null>(null);

  // Fetch featured products
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setProductsLoading(true);
        const response = await marketplaceService.getProducts();
        const mappedProducts = response.slice(0, 4).map(mapApiProductToProduct);
        setFeaturedProducts(mappedProducts);
      } catch (error) {
        console.error('Error fetching featured products:', error);
        setFeaturedProducts(mockProducts);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchFeaturedProducts();
  }, []);

  // Intersection Observer for stats
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !statsInView) {
          setStatsInView(true);
          // Animate counters with real-time data
          animateCounter(factoriesRef.current, 0, realTimeStats.factories, 2000, '+');
          animateCounter(carbonRef.current, 0, realTimeStats.carbonSaved, 2000, '%');
          animateCounter(transparencyRef.current, 0, realTimeStats.transparency, 2000, '%');
          animateCounter(tokensRef.current, 0, realTimeStats.tokensEarned, 2500, '');
        }
      },
      { threshold: 0.1 }
    );
    if (statsRef.current) {
      observer.observe(statsRef.current);
    }
    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
      }
    };
  }, [statsInView, realTimeStats]);

  const animateCounter = (
    element: HTMLSpanElement | null,
    start: number,
    end: number,
    duration: number,
    suffix = ''
  ) => {
    if (!element) return;
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        current = end;
        clearInterval(timer);
      }

      if (suffix === '' && end > 10000) {
        element.textContent = Math.floor(current).toLocaleString() + suffix;
      } else {
        element.textContent = current.toFixed(suffix === '%' ? 1 : 0) + suffix;
      }
    }, 16);
  };

  const nextDashboard = () => {
    setCurrentDashboard((prev) => (prev + 1) % dashboards.length);
  };

  const prevDashboard = () => {
    setCurrentDashboard((prev) => (prev - 1 + dashboards.length) % dashboards.length);
  };

  // Function to handle adding to cart with feedback
  const handleAddToCart = (product: ExtendedProduct) => {
    // Create a product object that matches the CartContext Product interface
    const cartProduct: CartProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      tokenPrice: product.tokenPrice,
      category: product.category,
      imageUrl: product.imageUrl,
      sustainabilityScore: product.sustainabilityScore,
      status: product.status
    };
    
    addToCart(cartProduct);

    // Show added to cart feedback
    setAddedToCartItems(prev => ({
      ...prev,
      [product.id]: true
    }));

    // Hide the feedback after 1 second
    setTimeout(() => {
      setAddedToCartItems(prev => ({
        ...prev,
        [product.id]: false
      }));
    }, 2000);
  };

  const calculateImpact = (investment: number) => {
    return {
      tokensEarned: Math.floor(investment * 0.1),
      carbonSaved: (investment * 0.05).toFixed(1),
      treesPlanted: Math.floor(investment / 100)
    };
  };

  const currentImpact = calculateImpact(impactValue);

  return (
    <div className="bg-white min-h-screen overflow-x-hidden">
      {/* Exit Intent Popup */}
      {showExitIntent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-8 max-w-md w-full text-center relative"
          >
            <button
              onClick={() => setShowExitIntent(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-2xl font-bold mb-4">Wait! Don't Miss Out</h3>
            <p className="text-gray-600 mb-6">
              Join 10,000+ users earning tokens while saving the planet. Get started with 50 free eco-tokens!
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowExitIntent(false);
                  // Navigate to registration
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Claim My Free Tokens
              </button>
              <button
                onClick={() => setShowExitIntent(false)}
                className="w-full text-gray-500 hover:text-gray-700"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden bg-white -mt-10">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-20 left-10 w-32 h-32 bg-green-100 rounded-full opacity-20"
          />
          <motion.div
            animate={{
              x: [0, -80, 0],
              y: [0, 100, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-20 right-20 w-24 h-24 bg-yellow-200 rounded-full opacity-30"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative">
          <div className="flex flex-col lg:flex-row items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:w-1/2 mb-12 lg:mb-0 lg:pr-12"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-green-600"
                >
                  Recycle.
                </motion.span>{" "}
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-yellow-500"
                >
                  Earn.
                </motion.span>{" "}
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-green-600"
                >
                  Sustain.
                </motion.span>
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-xl text-gray-700 mb-8 max-w-lg leading-relaxed"
              >
                Transform waste into wealth on the world's first blockchain-powered sustainability platform.
                <span className="font-semibold text-green-600"> Earn tokens, save the planet.</span>
              </motion.p>

              {/* Value proposition bullets */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-wrap gap-4 mb-8"
              >
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full shadow-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Instant Rewards</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full shadow-sm">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">100% Transparent</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full shadow-sm">
                  <Zap className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Easy to Use</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-1"
              >
                <Link
                  to="/register"
                  className="group px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-md"
                >
                  Start Earning Today 
                  <ArrowRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <button className="flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200">
                  <Play className="h-5 w-5 text-green-600" />
                  Watch 2-min Demo
                </button>
              </motion.div>

              {/* Social proof */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-6 text-sm text-gray-500"
              >
                ⚡ Get started in under 60 seconds • No credit card required
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="lg:w-2/3 relative -mt-20"
            >
              <div className="relative">
                <img
                  src="/images/recycling-illustration.png"
                  alt="Recycling waste illustration"
                  className="w-full h-auto max-w-2xl mx-auto drop-shadow-2xl rounded-2xl"
                />

              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-gray-500"
          >
            <span className="text-xs">Discover more</span>
            <ArrowDown className="h-4 w-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* Trust Indicators - Company Logos */}
      <section className="py-12 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-gray-600 mb-8">Trusted by industry leaders worldwide</p>
            <div className="flex justify-center items-center space-x-12 opacity-60">
              {mockCompanyLogos.map((company, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center gap-2 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <div className="text-4xl">{company.logo}</div>
                  <span className="text-xs font-medium text-gray-500">{company.name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mr-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How EcoChain Works
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              A simple closed-loop system where every action makes a difference
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                step: "01",
                title: "Recycle & Report",
                description:
                  "Upload photos of your recycling activities or submit waste for processing",
                icon: Recycle,
                color: "green",
              },
              {
                step: "02",
                title: "Get Verified",
                description:
                  "Our AI and community validate your sustainable actions on the blockchain",
                icon: BadgeCheck,
                color: "yellow",
              },
              {
                step: "03",
                title: "Earn Rewards",
                description:
                  "Receive eco-tokens that can be redeemed, traded, or saved for future benefits",
                icon: Award,
                color: "green",
              },
              {
                step: "04",
                title: "Shop Sustainably",
                description:
                  "Use eco-tokens to buy recycled products in our marketplace, completing the cycle",
                icon: ShoppingBag, // <-- lucide-react icon
                color: "blue",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative text-center group"
              >
                <div className="relative mb-8">
                  <div
                    className={`w-20 h-20 ${item.color === "green"
                        ? "bg-green-600"
                        : item.color === "yellow"
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                      } mx-auto rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <item.icon className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">
                  {item.title}
                </h3>
                <p className="text-gray-700 leading-relaxed">{item.description}</p>

                {index < 3 && (
                  <div className="hidden md:block absolute top-10 -right-4 w-10 h-0.5 ">
                    <ArrowRight className="absolute -top-2 -right-2 h-10 w-20 text-gray-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>


          {/* Impact Calculator */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-16 bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto"
          >
            <div className="text-center mb-6">
              <Calculator className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-gray-900">Calculate Your Impact</h3>
              <p className="text-gray-600">See how much you could earn and save the planet</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Sustainable Spending (₹)
                </label>
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  value={impactValue}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setImpactValue(value);
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>₹1,000</span>
                  <span>₹{impactValue.toLocaleString()}</span>
                  <span>₹10,000</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{currentImpact.tokensEarned}</div>
                  <div className="text-sm text-gray-600">Tokens/month</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{currentImpact.carbonSaved}kg</div>
                  <div className="text-sm text-gray-600">CO₂ saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{currentImpact.treesPlanted}</div>
                  <div className="text-sm text-gray-600">Trees planted</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Powerful Features for Modern Supply Chains</h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">Everything you need to build sustainable, transparent, and efficient supply chain operations.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all duration-300 group"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:bg-green-200 transition-colors duration-300">
                <Leaf className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-center">Track Sustainable Products</h3>
              <p className="text-gray-700 text-center">Monitor environmental impact and sustainability metrics across your entire product lifecycle.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all duration-300 group"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:bg-green-200 transition-colors duration-300">
                <Factory className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-center">Factory & Production Dashboards</h3>
              <p className="text-gray-700 text-center">Real-time visibility into manufacturing processes with integrated sustainability controls.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all duration-300 group"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:bg-green-200 transition-colors duration-300">
                <LinkIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-center">Transparent Supply Chains</h3>
              <p className="text-gray-700 text-center">Blockchain-powered traceability ensuring complete transparency from source to consumer.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all duration-300 group"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:bg-green-200 transition-colors duration-300">
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-center">Eco Analytics & Reports</h3>
              <p className="text-gray-700 text-center">Comprehensive reporting and analytics to measure and improve your environmental impact.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Product Cards Section (NEW) */}
      <section className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Discover products</h2>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm text-gray-800"
              aria-label="View all products"
            >
              <Sparkles className="h-4 w-4" />
              View all products
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {productsLoading ? (
              // Loading skeleton cards
              [...Array(4)].map((_, index) => (
                <div key={index} className="rounded-xl border border-gray-200 bg-white overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-3 w-3/4"></div>
                    <div className="flex gap-2 mb-4">
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product, index) => {
                const isAddedToCart = addedToCartItems[product.id];

                return (
                  <motion.article
                    key={product.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.05 }}
                    viewport={{ once: true, margin: "-80px" }}
                    className="group rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-green-300 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                      <img
                        src={product.imageUrl || '/uploads/default-product.svg'}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/uploads/default-product.svg';
                        }}
                      />
                      {/* Status Badge */}
                      {product.status === 'sold_out' && (
                        <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          Sold Out
                        </div>
                      )}
                      {/* Factory Badge */}
                      {product.factoryName && (
                        <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                          <Building2 size={10} />
                          <span className="truncate max-w-20">{product.factoryName}</span>
                        </div>
                      )}
                      {/* Sustainability Score */}
                      <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                        <Leaf size={10} />
                        <span>{product.sustainabilityScore || 85}%</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Star className="h-4 w-4 text-amber-500" />
                          {((product.sustainabilityScore || 85) / 20).toFixed(1)}
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">{product.factoryName || 'EcoChain Partner'}</div>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border border-gray-200 bg-gray-50 text-gray-800">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                          {product.category || 'Eco-Friendly'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border border-gray-200 bg-gray-50 text-gray-800">
                          <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                          Verified
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold text-gray-900">₹{product.price.toLocaleString()}</div>
                          {product.tokenPrice > 0 && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Leaf size={10} />
                              {product.tokenPrice} tokens
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Stock</div>
                          <div className="font-semibold text-gray-900 text-sm">{product.stock}</div>
                        </div>
                      </div>
                      {/* Action Buttons */}
                      <div className="mt-4">
                        {isAddedToCart ? (
                          <button
                            className="w-full flex items-center justify-center gap-2 bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-sm"
                            disabled
                          >
                            <Check size={16} />
                            <span className="text-sm">Added</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(product)}
                            disabled={product.status === 'sold_out'}
                            className={`w-full flex items-center justify-center gap-2 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${product.status === 'sold_out'
                              ? 'bg-gray-400'
                              : 'bg-green-600 hover:bg-green-700'
                              }`}
                          >
                            {product.status === 'sold_out' ? (
                              <>
                                <Package size={16} />
                                <span className="text-sm">Sold Out</span>
                              </>
                            ) : (
                              <>
                                <Plus size={16} />
                                <span className="text-sm">Add to Cart</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.article>
                );
              })
            ) : (
              // No products available
              <div className="col-span-full text-center py-8">
                <div className="text-gray-500 mb-2">No products available at the moment</div>
                <Link
                  to="/marketplace"
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Visit our marketplace →
                </Link>
              </div>
            )}
          </div>

          {/* View all products CTA */}
          {!productsLoading && featuredProducts.length > 0 && (
            <div className="mt-8 text-center">
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              >
                <Sparkles className="h-4 w-4" />
                View all products
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Role dashboards carousel */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Heading + Navigation */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Dashboards for every role
            </h2>
            <div className="flex gap-2">
              <button
                onClick={prevDashboard}
                className="p-2 rounded-full border border-gray-200 bg-white hover:bg-green-50 hover:text-green-600 transition"
                aria-label="Previous dashboard"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextDashboard}
                className="p-2 rounded-full border border-gray-200 bg-white hover:bg-green-50 hover:text-green-600 transition"
                aria-label="Next dashboard"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Dashboard Card */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-xl hover:border-green-200 transition">
            <div className="flex flex-col md:flex-row">

              {/* Left Panel - Text */}
              <div className="flex-1 p-8 flex flex-col justify-center">
                <motion.h3
                  key={dashboards[currentDashboard].title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="text-2xl font-bold text-green-600"
                >
                  {dashboards[currentDashboard].title}
                </motion.h3>

                <motion.p
                  key={dashboards[currentDashboard].description}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.05 }}
                  className="mt-3 text-gray-600 text-base leading-relaxed"
                >
                  {dashboards[currentDashboard].description}
                </motion.p>

                {/* CTA Buttons */}
                <div className="mt-6 flex gap-3">
                  <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-green-50 text-sm font-medium transition">
                    {React.createElement(dashboards[currentDashboard].icon, { className: "h-4 w-4" })}
                    Interactive preview
                  </button>
                  <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 text-sm font-medium transition">
                    Learn more
                  </button>
                </div>
              </div>

              {/* Right Panel - Dashboard Preview Image */}
              <div className="flex-1 p-8 bg-white  flex items-center justify-center min-h-[320px]">
                <motion.div
                  key={dashboards[currentDashboard].image}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.45 }}
                  className="w-full max-w-lg rounded-xl border border-gray-200 shadow-lg overflow-hidden"
                >
                  <img
                    src={dashboards[currentDashboard].image}
                    alt={dashboards[currentDashboard].title + " preview"}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center py-4">
              <div className="flex gap-2">
                {dashboards.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentDashboard(i)}
                    className={[
                      "w-3 h-3 rounded-full transition",
                      i === currentDashboard ? "bg-green-500" : "bg-gray-300",
                    ].join(" ")}
                    aria-label={"Go to " + dashboards[i].title}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why EcoChain Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose EcoChain?</h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">Built on four core pillars that drive sustainable business success.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
                <Eye className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Transparency</h3>
              <p className="text-gray-700">Complete visibility into every step of your supply chain with immutable blockchain records.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
                <Leaf className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Sustainability</h3>
              <p className="text-gray-700">Advanced tools to measure, track, and reduce your environmental impact across all operations.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Accountability</h3>
              <p className="text-gray-700">Automated compliance monitoring and reporting to meet regulatory requirements effortlessly.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Efficiency</h3>
              <p className="text-gray-700">Streamline operations with AI-powered insights and automated workflow optimization.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Impact Statistics */}
      <section ref={statsRef} className="py-20 bg-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted Worldwide</h2>
            <p className="text-xl max-w-3xl mx-auto">Join leading organizations making a real impact on sustainability.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="bg-white bg-opacity-10 rounded-xl p-8 text-center backdrop-blur-sm"
            >
              <div className="flex items-center justify-center mb-4">
                <Factory className="h-8 w-8 mr-2" />
                <span className="text-4xl md:text-5xl font-bold" ref={factoriesRef}>0</span>
              </div>
              <p className="text-xl">Factories Connected</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white bg-opacity-10 rounded-xl p-8 text-center backdrop-blur-sm"
            >
              <div className="flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 mr-2" />
                <span className="text-4xl md:text-5xl font-bold" ref={carbonRef}>0</span>
              </div>
              <p className="text-xl">Carbon Reduction</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white bg-opacity-10 rounded-xl p-8 text-center backdrop-blur-sm"
            >
              <div className="flex items-center justify-center mb-4">
                <Globe className="h-8 w-8 mr-2" />
                <span className="text-4xl md:text-5xl font-bold" ref={transparencyRef}>0</span>
              </div>
              <p className="text-xl">Supply Chain Transparency</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">See how EcoChain is transforming supply chains worldwide.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-8 shadow-md"
            >
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic text-lg">
                "EcoChain has revolutionized how we manage our supply chain. The transparency and sustainability insights have helped us reduce our carbon footprint by 20% while improving efficiency."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Sarah Chen</h4>
                  <p className="text-gray-600">Supply Chain Director, GreenTech Industries</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-8 shadow-md"
            >
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic text-lg">
                "The blockchain transparency features give our customers complete confidence in our sustainability claims. It's been a game-changer for our brand trust and market positioning."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Michael Rodriguez</h4>
                  <p className="text-gray-600">CEO, Sustainable Manufacturing Co.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 bg-white ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Join EcoChain and make your supply chain sustainable
            </h2>
            <p className="text-xl mb-12 max-w-3xl mx-auto">
              Start building transparent, sustainable supply chains today. Join thousands of companies already using EcoChain to drive positive environmental impact.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {/* Updated to Link -> /signup */}
              <Link
                to="/signup"
                className="px-8 py-4 bg-white text-green-600 hover:bg-gray-100 font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
              >
                Sign Up Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <button className="px-8 py-4 border-2 bg-green-600 text-white hover:bg-white hover:text-green-600 font-bold rounded-lg transition-all duration-300">
                Contact Sales
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default EcoChainLanding;