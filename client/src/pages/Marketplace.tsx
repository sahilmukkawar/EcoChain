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
  const [sortBy, setSortBy] = useState<'popular'|'price_low'|'price_high'|'rating'>('popular');
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
    if (sortBy === 'price_low') result.sort((a,b) => a.price - b.price);
    if (sortBy === 'price_high') result.sort((a,b) => b.price - a.price);
    if (sortBy === 'rating') result.sort((a,b) => (b.sustainabilityScore || 0) - (a.sustainabilityScore || 0));
    
    const total = result.length;
    const start = (page-1)*pageSize;
    const end = start + pageSize;
    return { total, items: result.slice(start, end) };
  }, [products, activeCategory, searchTerm, sortBy, page]);
  
  useEffect(() => {
    setFilteredProducts(computed.items);
  }, [computed]);
  
  // Get unique categories from products
  const categories = ['all', ...new Set(products.map(product => product.category || 'uncategorized'))];
  const totalPages = Math.max(1, Math.ceil(computed.total / pageSize));

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
    console.error('Cart is undefined in Marketplace component');
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Cart Error</h3>
            <p className="text-red-700">Error loading cart data. Please refresh the page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64 bg-green-50 rounded-lg border border-green-200">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 text-green-500 animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">Loading Products</h3>
            <p className="text-green-700">Please wait while we fetch the latest eco-friendly products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Products</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-green-500 to-blue-400 text-transparent bg-clip-text">
              EcoChain Marketplace
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover eco-friendly products made from recycled materials by sustainable factories
          </p>
        </div>
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* EcoTokens Balance */}
          <div className="flex items-center gap-4 bg-gradient-to-r from-green-50 to-blue-50 px-6 py-4 rounded-xl border border-green-200">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <Leaf className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-800">
                {totalEcoTokens?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-green-600 font-medium">EcoTokens Available</div>
            </div>
          </div>
          
          {/* Cart Actions */}
          {cart.length > 0 && (
            <div className="flex gap-3">
              <Link 
                to="/cart" 
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <ShoppingCart size={20} />
                <span>View Cart ({cart.length})</span>
              </Link>
              <Link 
                to="/checkout" 
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <CreditCard size={20} />
                <span>Checkout</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900 placeholder-gray-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:hidden"
            >
              <Filter size={18} />
              <span>Filters</span>
            </button>
            
            {/* Sort Dropdown */}
            <div className="relative">
              <select 
                value={sortBy} 
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setPage(1);
                }}
                className="appearance-none bg-white border border-gray-300 text-gray-900 py-2 pl-3 pr-8 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
              >
                <option value="popular">Most Popular</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                {sortBy.includes('price') ? (
                  sortBy === 'price_low' ? <SortAsc className="h-4 w-4 text-gray-400" /> : <SortDesc className="h-4 w-4 text-gray-400" />
                ) : (
                  <Filter className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>

            {/* Results Count */}
            <span className="text-sm text-gray-600">
              {computed.total} product{computed.total !== 1 ? 's' : ''} found
            </span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-green-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Grid view"
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-green-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="List view"
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className={`${showFilters ? 'block' : 'hidden sm:block'}`}>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button 
                key={category} 
                className={`px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
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
                className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <X size={16} />
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
                  className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg hover:border-green-300 transition-all duration-300"
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
                        <Building2 size={12} />
                        <span className="truncate max-w-24">{product.factoryName}</span>
                      </div>
                    )}

                    {/* Sustainability Score */}
                    <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                      <Leaf size={10} />
                      <span>{product.sustainabilityScore}%</span>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>
                    
                    {/* Pricing */}
                    <div className="flex justify-between items-center mb-4">
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
                        <div className="text-sm text-gray-500">Stock</div>
                        <div className="font-semibold text-gray-900">{product.stock}</div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {cartQuantity > 0 ? (
                        <div className="flex items-center flex-1 bg-gray-100 rounded-lg">
                          <button 
                            onClick={() => updateQuantity(product.id, Math.max(0, cartQuantity - 1))}
                            className="p-2 hover:bg-gray-200 rounded-l-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                            disabled={product.status === 'sold_out'}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="flex-1 text-center font-semibold py-2">
                            {cartQuantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(product.id, cartQuantity + 1)}
                            className="p-2 hover:bg-gray-200 rounded-r-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                            disabled={product.status === 'sold_out'}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => addToCart(product)}
                          disabled={product.status === 'sold_out'}
                          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                          {product.status === 'sold_out' ? (
                            <Package size={16} />
                          ) : (
                            <Plus size={16} />
                          )}
                          <span>
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
                  className="bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all p-6"
                >
                  <div className="flex gap-6">
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
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
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                            <Leaf size={10} />
                            {product.sustainabilityScore}% eco
                          </span>
                          {product.status === 'sold_out' && (
                            <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">
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
                            <div className="text-sm text-gray-500">Stock</div>
                            <div className="font-semibold text-gray-900">{product.stock}</div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                          {cartQuantity > 0 ? (
                            <div className="flex items-center bg-gray-100 rounded-lg">
                              <button 
                                onClick={() => updateQuantity(product.id, Math.max(0, cartQuantity - 1))}
                                className="p-2 hover:bg-gray-200 rounded-l-lg transition-colors"
                                disabled={product.status === 'sold_out'}
                              >
                                <Minus size={16} />
                              </button>
                              <span className="px-4 py-2 font-semibold">{cartQuantity}</span>
                              <button 
                                onClick={() => updateQuantity(product.id, cartQuantity + 1)}
                                className="p-2 hover:bg-gray-200 rounded-r-lg transition-colors"
                                disabled={product.status === 'sold_out'}
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => addToCart(product)}
                              disabled={product.status === 'sold_out'}
                              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-2 px-6 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
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
          <div className="text-center py-16 bg-gray-50 rounded-xl">
            <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">
              We couldn't find any products matching your criteria.
            </p>
            <button 
              onClick={clearAllFilters}
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <X size={16} />
              <span>Clear All Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-between border-t border-gray-200 pt-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
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
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                        page === pageNumber
                          ? 'bg-green-500 text-white'
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
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;