import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import marketplaceService, { PopulatedMarketplaceItem } from '../services/marketplaceService.ts';
import {
  Search,
  Filter,
  ShoppingCart,
  CreditCard,
  Leaf,
  Star,
  Plus,
  Minus,
  Package,
  Building2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  X,
  Grid3X3,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react';

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

const Marketplace: React.FC = () => {
  const { cart, addToCart, removeFromCart, updateQuantity, cartTotal, tokenTotal } = useCart();
  const { user } = useAuth();
  const totalEcoTokens = user?.ecoWallet?.currentBalance || 0;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popular' | 'price_low' | 'price_high' | 'rating'>('popular');
  const [page, setPage] = useState(1);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 12;

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await marketplaceService.getProducts();
        const mappedProducts = response.map(mapApiProductToProduct);
        setProducts(mappedProducts);
        setError(null);
      } catch (e) {
        console.error('Error fetching products:', e);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Filter + sort + paginate (memoized for performance)
  const computed = useMemo(() => {
    let result = [...products];
    if (activeCategory !== 'all') {
      result = result.filter(p => p.category === activeCategory);
    }
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      result = result.filter(p =>
        (p.name || '').toLowerCase().includes(t) ||
        (p.description || '').toLowerCase().includes(t) ||
        (p.factoryName || '').toLowerCase().includes(t)
      );
    }
    if (sortBy === 'price_low') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'price_high') result.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') result.sort((a, b) => (b.sustainabilityScore || 0) - (a.sustainabilityScore || 0));

    const total = result.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return { total, items: result.slice(start, end) };
  }, [products, activeCategory, searchTerm, sortBy, page]);

  useEffect(() => {
    setFilteredProducts(computed.items);
  }, [computed]);

  // Get unique categories from products
  const categories = ['all', ...new Set(products.map(product => product.category || 'uncategorized'))];
  const totalPages = Math.max(1, Math.ceil(computed.total / pageSize));
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length;

  // Handle cart item quantity
  const getCartQuantity = (productId: string) => {
    const cartItem = cart.find(item => item.id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setActiveCategory('all');
    setSortBy('popular');
    setPage(1);
  };

  // Ensure cart is defined
  if (!cart) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64 bg-red-50 rounded-xl border border-red-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Cart Error</h3>
              <p className="text-red-700">Error loading cart data. Please refresh the page.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64 bg-green-50 rounded-xl border border-green-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">Loading Products</h3>
              <p className="text-green-700">Please wait while we fetch the latest eco-friendly products...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64 bg-red-50 rounded-xl border border-red-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Products</h3>
              <p className="text-red-700 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">EcoChain Marketplace</h1>
              <p className="text-sm text-gray-500">Welcome back, {user?.name}! Discover eco-friendly products</p>
            </div>

            <div className="flex items-center gap-4">
              {/* EcoTokens Balance */}
              <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-green-100 px-4 py-2 rounded-xl border border-green-200">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <Leaf className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-green-800">
                    {totalEcoTokens?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-green-600 font-medium">EcoTokens Available</div>
                </div>
              </div>

              {/* Cart Actions */}
              {cart.length > 0 && (
                <div className="flex items-center gap-2">
                  <Link
                    to="/cart"
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <ShoppingCart size={16} />
                    <span>Cart ({cart.length})</span>
                  </Link>
                  <Link
                    to="/checkout"
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <CreditCard size={16} />
                    <span>Checkout</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-amber-800 font-medium text-sm">
                  Inventory Alert: {lowStockCount} product{lowStockCount !== 1 ? 's' : ''} running low on stock
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products, categories, or factories..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="block w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900 placeholder-gray-500 transition-all shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Filter Controls */}
         
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors sm:hidden"
                >
                  <Filter size={16} />
                  <span className="text-sm font-medium">Filters</span>
                </button>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as any);
                      setPage(1);
                    }}
                    className="appearance-none bg-gray-50 border border-gray-300 text-gray-900 py-2 pl-3 pr-8 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors text-sm font-medium"
                  >
                    <option value="popular">Most Popular</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </select>
                </div>

                {/* Results Count */}
                <span className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                  {computed.total} product{computed.total !== 1 ? 's' : ''}
                </span>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* Category Filters */}
            <div className={`${showFilters ? 'block' : 'hidden sm:block'}`}>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      activeCategory === category
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                    onClick={() => {
                      setActiveCategory(category);
                      setPage(1);
                    }}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}

                {(searchTerm || activeCategory !== 'all' || sortBy !== 'popular') && (
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-medium text-sm transition-colors"
                  >
                    <X size={14} />
                    <span>Clear All</span>
                  </button>
                )}
              </div>
            </div>
          
        </div>

        {/* Products Grid/List */}
        <div className="marketplace-content">
          {filteredProducts.length > 0 ? (
            <div className={
              viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-6"
            }>
              {filteredProducts.map(product => {
                const cartQuantity = getCartQuantity(product.id);

                return viewMode === 'grid' ? (
                  // Grid View
                  <div
                    key={product.id}
                    className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-300"
                  >
                    {/* Product Image */}
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      <img
                        src={product.imageUrl || '/uploads/default-product.svg'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                        <span>{product.sustainabilityScore}%</span>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="p-6">
                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {product.description}
                      </p>

                      {/* Pricing */}
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <div className="text-xl font-bold text-green-600">
                            ₹{product.price.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Leaf size={12} />
                            {product.tokenPrice} tokens
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Stock</div>
                          <div className="font-semibold text-gray-900 text-sm">{product.stock}</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {cartQuantity > 0 ? (
                          <div className="flex items-center flex-1 bg-gray-100 rounded-lg">
                            <button
                              onClick={() => updateQuantity(product.id, Math.max(0, cartQuantity - 1))}
                              className="p-3 hover:bg-gray-200 rounded-l-lg transition-colors"
                              disabled={product.status === 'sold_out'}
                            >
                              <Minus size={16} />
                            </button>
                            <span className="flex-1 text-center font-semibold py-3">
                              {cartQuantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(product.id, cartQuantity + 1)}
                              className="p-3 hover:bg-gray-200 rounded-r-lg transition-colors"
                              disabled={product.status === 'sold_out'}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            disabled={product.status === 'sold_out'}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            {product.status === 'sold_out' ? <Package size={16} /> : <Plus size={16} />}
                            <span className="text-sm">
                              {product.status === 'sold_out' ? 'Sold Out' : 'Add to Cart'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // List View
                  <div
                    key={product.id}
                    className="bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200 p-6"
                  >
                    <div className="flex gap-6">
                      {/* Product Image */}
                      <div className="flex-shrink-0 w-32 h-32 bg-gray-100 rounded-xl overflow-hidden">
                        <img
                          src={product.imageUrl || '/uploads/default-product.svg'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/uploads/default-product.svg';
                          }}
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                          <div className="flex items-center gap-2">
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                              <Leaf size={10} />
                              {product.sustainabilityScore}% eco
                            </span>
                            {product.status === 'sold_out' && (
                              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                                Sold Out
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-600 mb-4">{product.description}</p>

                        {product.factoryName && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <Building2 size={14} />
                            <span>By {product.factoryName}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-6">
                            <div>
                              <div className="text-2xl font-bold text-green-600">
                                ₹{product.price.toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Leaf size={12} />
                                {product.tokenPrice} tokens
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Stock</div>
                              <div className="font-semibold text-gray-900">{product.stock}</div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-3">
                            {cartQuantity > 0 ? (
                              <div className="flex items-center bg-gray-100 rounded-lg">
                                <button
                                  onClick={() => updateQuantity(product.id, Math.max(0, cartQuantity - 1))}
                                  className="p-3 hover:bg-gray-200 rounded-l-lg transition-colors"
                                  disabled={product.status === 'sold_out'}
                                >
                                  <Minus size={16} />
                                </button>
                                <span className="px-4 py-3 font-semibold">{cartQuantity}</span>
                                <button
                                  onClick={() => updateQuantity(product.id, cartQuantity + 1)}
                                  className="p-3 hover:bg-gray-200 rounded-r-lg transition-colors"
                                  disabled={product.status === 'sold_out'}
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(product)}
                                disabled={product.status === 'sold_out'}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                {product.status === 'sold_out' ? <Package size={16} /> : <Plus size={16} />}
                                <span>{product.status === 'sold_out' ? 'Sold Out' : 'Add to Cart'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Empty State
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                We couldn't find any products matching your criteria. Try adjusting your filters or search terms.
              </p>
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <X size={16} />
                <span>Clear All Filters</span>
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>

              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{Math.min((page - 1) * pageSize + 1, computed.total)}</span> to{' '}
                    <span className="font-medium">{Math.min(page * pageSize, computed.total)}</span> of{' '}
                    <span className="font-medium">{computed.total}</span> results
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                    <span>Previous</span>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (page <= 3) {
                        pageNumber = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setPage(pageNumber)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            page === pageNumber
                              ? 'bg-green-500 text-white shadow-sm'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;