import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MotionConfig, motion, useReducedMotion } from "framer-motion";
import {
  Leaf,
  Factory,
  Link as ChainLink,
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
  Package
} from 'lucide-react';
import marketplaceService, { PopulatedMarketplaceItem } from '../services/marketplaceService.ts';
import { useCart } from '../contexts/CartContext.tsx';

interface Dashboard {
  title: string;
  description: string;
  image: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  tokenPrice: number;
  category?: string;
  imageUrl?: string;
  sustainabilityScore?: number;
  status?: 'available' | 'sold_out';
  factoryName?: string;
  stock: number;
}

// Function to convert API product to our Product interface
const mapApiProductToProduct = (apiProduct: PopulatedMarketplaceItem): Product => ({
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
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const { addToCart } = useCart();
  const [addedToCartItems, setAddedToCartItems] = useState<Record<string, boolean>>({});

  // Dashboard carousel state
  const [currentDashboard, setCurrentDashboard] = useState(0);
  const dashboards = [
    {
      title: "Admin Dashboard",
      description: "Complete overview of all supply chain operations and sustainability metrics",
      image: "/images/admin-dashboard.png",
      icon: BarChart3
    },
    {
      title: "Factory Dashboard",
      description: "Real-time production monitoring with environmental impact tracking",
      image: "/images/factory-dashboard.png",
      icon: Factory
    },
    {
      title: "Product Manager",
      description: "Track products from source to consumer with full transparency",
      image: "/images/product-dashboard.png",
      icon: ChainLink
    }
  ];

  // Animated counter values
  const factoriesRef = useRef<HTMLSpanElement | null>(null);
  const carbonRef = useRef<HTMLSpanElement | null>(null);
  const transparencyRef = useRef<HTMLSpanElement | null>(null);

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
        setFeaturedProducts([]);
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
          // Animate counters
          animateCounter(factoriesRef.current, 0, 50, 2000, '+');
          animateCounter(carbonRef.current, 0, 20, 2000, '%');
          animateCounter(transparencyRef.current, 0, 100, 2000, '%');
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
  }, [statsInView]);

  const animateCounter = (
    element: HTMLSpanElement | null,
    start: number,
    end: number,
    duration: number,
    suffix = ''
  ) => {
    if (!element) return;
    const range = end - start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.max(16, Math.abs(Math.floor(duration / range)));
    let current = start;
    const timer = setInterval(() => {
      current += increment;
      element.textContent = current.toLocaleString() + suffix;
      if (current === end) {
        clearInterval(timer);
      }
    }, stepTime);
  };

  const nextDashboard = () => {
    setCurrentDashboard((prev) => (prev + 1) % dashboards.length);
  };

  const prevDashboard = () => {
    setCurrentDashboard((prev) => (prev - 1 + dashboards.length) % dashboards.length);
  };

  // Function to handle adding to cart with feedback
  const handleAddToCart = (product: Product) => {
    addToCart(product);
    
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
    }, 450);
  };

  return (
    <div className=" bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-0 md:pb-0">
          <div className="flex flex-col md:flex-row items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="md:w-1/2 mb-12 md:mb-0 md:pr-1"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-gray-900 mb-6">
                <span className="text-eco-green">Recycle.</span> <span className="text-eco-yellow">Earn.</span> <span className="text-eco-green">Sustain.</span>
              </h1>
              <p className="text-xl text-gray-700 mb-8 max-w-lg">
                Join our eco-friendly blockchain platform that rewards sustainable waste management and recycling efforts.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/signup"
                  className="px-6 py-3 bg-eco-green hover:bg-eco-green-dark text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/marketplace"
                  className="px-6 py-3 bg-white hover:bg-gray-50 text-eco-green border border-eco-green font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                >
                  Marketplace
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="md:w-2/3"
            >
              <img
                src="/images/recycling-illustration.png"
                alt="Recycling waste illustration"
                className="w-full h-auto max-w-4xl mx-auto drop-shadow-xl"
              />
            </motion.div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">Powerful Features for Modern Supply Chains</h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">Everything you need to build sustainable, transparent, and efficient supply chain operations.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg hover:border-eco-green-200 transition-all duration-300 group"
            >
              <div className="w-16 h-16 bg-eco-green-100 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:bg-eco-green-200 transition-colors duration-300">
                <Leaf className="h-8 w-8 text-eco-green" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-center">Track Sustainable Products</h3>
              <p className="text-gray-700 text-center">Monitor environmental impact and sustainability metrics across your entire product lifecycle.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg hover:border-eco-green-200 transition-all duration-300 group"
            >
              <div className="w-16 h-16 bg-eco-green-100 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:bg-eco-green-200 transition-colors duration-300">
                <Factory className="h-8 w-8 text-eco-green" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-center">Factory & Production Dashboards</h3>
              <p className="text-gray-700 text-center">Real-time visibility into manufacturing processes with integrated sustainability controls.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg hover:border-eco-green-200 transition-all duration-300 group"
            >
              <div className="w-16 h-16 bg-eco-green-100 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:bg-eco-green-200 transition-colors duration-300">
                <ChainLink className="h-8 w-8 text-eco-green" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-center">Transparent Supply Chains</h3>
              <p className="text-gray-700 text-center">Blockchain-powered traceability ensuring complete transparency from source to consumer.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg hover:border-eco-green-200 transition-all duration-300 group"
            >
              <div className="w-16 h-16 bg-eco-green-100 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:bg-eco-green-200 transition-colors duration-300">
                <BarChart3 className="h-8 w-8 text-eco-green" />
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
                            className={`w-full flex items-center justify-center gap-2 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${
                              product.status === 'sold_out' 
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
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Dashboards for every role</h2>
            <div className="flex gap-2">
              <button
                onClick={prevDashboard}
                className="p-2 rounded-full border border-border bg-card hover:bg-surface"
                aria-label="Previous dashboard"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextDashboard}
                className="p-2 rounded-full border border-border bg-card hover:bg-surface"
                aria-label="Next dashboard"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 p-8">
                <motion.h3
                  key={dashboards[currentDashboard].title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="text-2xl font-bold"
                >
                  {dashboards[currentDashboard].title}
                </motion.h3>
                <motion.p
                  key={dashboards[currentDashboard].description}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.05 }}
                  className="mt-2 text-muted"
                >
                  {dashboards[currentDashboard].description}
                </motion.p>

                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface text-sm">
                  {React.createElement(
                    dashboards[currentDashboard].icon,
                    { className: "h-5 w-5" }
                  )}
                  Interactive preview
                </div>
              </div>

              <div className="flex-1 p-8 bg-surface min-h-[320px] flex items-center justify-center">
                {/* Placeholder preview area (replace with live preview in your app) */}
                <div className="text-center">
                  <div className="w-28 h-28 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="h-12 w-12 text-primary" />
                  </div>
                  <div className="text-sm text-muted">
                    Real-time data visualization
                  </div>
                </div>
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
                      "w-2.5 h-2.5 rounded-full",
                      i === currentDashboard ? "bg-primary" : "bg-border",
                    ].join(" ")}
                    aria-label={`Go to ${dashboards[i].title}`}
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
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">Why Choose EcoChain?</h2>
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
              <div className="w-20 h-20 bg-eco-green rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
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
              <div className="w-20 h-20 bg-eco-green rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
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
              <div className="w-20 h-20 bg-eco-green rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
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
              <div className="w-20 h-20 bg-eco-green rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Efficiency</h3>
              <p className="text-gray-700">Streamline operations with AI-powered insights and automated workflow optimization.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Impact Statistics */}
      <section ref={statsRef} className="py-20 bg-eco-green text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Trusted Worldwide</h2>
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
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">What Our Customers Say</h2>
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
                  <Star key={i} className="h-5 w-5 text-eco-yellow fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic text-lg">
                "EcoChain has revolutionized how we manage our supply chain. The transparency and sustainability insights have helped us reduce our carbon footprint by 20% while improving efficiency."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-eco-green-100 rounded-full flex items-center justify-center mr-4">
                  <Users className="h-6 w-6 text-eco-green" />
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
                  <Star key={i} className="h-5 w-5 text-eco-yellow fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic text-lg">
                "The blockchain transparency features give our customers complete confidence in our sustainability claims. It's been a game-changer for our brand trust and market positioning."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-eco-green-100 rounded-full flex items-center justify-center mr-4">
                  <Users className="h-6 w-6 text-eco-green" />
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
      <section className="py-20 bg-gradient-to-r from-eco-green to-eco-green-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Join EcoChain and make your supply chain sustainable
            </h2>
            <p className="text-xl mb-12 max-w-3xl mx-auto">
              Start building transparent, sustainable supply chains today. Join thousands of companies already using EcoChain to drive positive environmental impact.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {/* Updated to Link -> /signup */}
              <Link
                to="/signup"
                className="px-8 py-4 bg-white text-eco-green hover:bg-gray-100 font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
              >
                Sign Up Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <button className="px-8 py-4 border-2 border-white text-white hover:bg-white hover:text-eco-green font-bold rounded-lg transition-all duration-300">
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