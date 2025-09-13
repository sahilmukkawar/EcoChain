import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import marketplaceService, { PopulatedMarketplaceItem } from '../services/marketplaceService.ts';

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
  tokenPrice: apiProduct.pricing.ecoTokenDiscount || 0, // Use stored token price
  category: apiProduct.productInfo.category,
  imageUrl: apiProduct.productInfo.images?.[0] || '/uploads/default-product.svg',
  sustainabilityScore: apiProduct.sustainability.recycledMaterialPercentage || 85,
  status: apiProduct.inventory.currentStock > 0 && apiProduct.availability.isActive ? 'available' : 'sold_out',
  factoryName: apiProduct.factoryId?.companyInfo?.name,
  stock: apiProduct.inventory.currentStock
});

const Marketplace: React.FC = () => {
  // Use cart context
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
  const pageSize = 12;

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await marketplaceService.getProducts();
        // Map API products to our Product interface
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
    // popular keeps seed order
    const total = result.length;
    const start = (page-1)*pageSize;
    const end = start + pageSize;
    return { total, items: result.slice(start, end) };
  }, [products, activeCategory, searchTerm, sortBy, page]);
  
  useEffect(() => {
    setFilteredProducts(computed.items);
  }, [computed]);
  
  // Calculate max tokens usable
  const maxTokensUsable = Math.min(tokenTotal, totalEcoTokens);

  // Get unique categories from products
  const categories = ['all', ...new Set(products.map(product => product.category || 'uncategorized'))];
  const totalPages = Math.max(1, Math.ceil(computed.total / pageSize));

  // Ensure cart is defined
  if (!cart) {
    console.error('Cart is undefined in Marketplace component');
    return <div className="error">Error loading cart data</div>;
  }

  if (loading) {
    return <div className="flex justify-center items-center h-32 bg-gray-100 rounded-lg">Loading products...</div>;
  }

  if (error) {
    return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Error: {error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">EcoChain Marketplace</h1>
        <p className="text-gray-600 mb-6">Browse eco-friendly products made from recycled materials</p>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
            <span className="text-2xl">🌱</span>
            <div>
              <div className="font-bold text-green-800">{totalEcoTokens || 0}</div>
              <div className="text-xs text-green-600">EcoTokens Available</div>
            </div>
          </div>
          
          {cart.length > 0 && (
            <div className="flex gap-2">
              <Link 
                to="/cart" 
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow hover:from-blue-600 hover:to-blue-700 hover:shadow-lg transition-all"
              >
                View Cart ({cart.length})
              </Link>
              <Link 
                to="/checkout" 
                className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 px-6 rounded-lg shadow hover:from-green-600 hover:to-green-700 hover:shadow-lg transition-all"
              >
                Checkout
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input 
            type="text" 
            placeholder="Search products or factories..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
        </div>
        
        <div className="flex gap-2">
          <select 
            value={sortBy} 
            onChange={e=>{setSortBy(e.target.value as any); setPage(1);}}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          >
            <option value="popular">Most Popular</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map(category => (
          <button 
            key={category} 
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeCategory === category 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setActiveCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      <div className="marketplace-content">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(p => (
              <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-shadow" key={p.id}>
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={p.imageUrl || '/uploads/default-product.svg'} 
                    alt={p.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to default image if the image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = '/uploads/default-product.svg';
                    }}
                  />
                  {p.status === 'sold_out' && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      Sold Out
                    </span>
                  )}
                  {p.factoryName && (
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      By {p.factoryName}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">{p.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{p.description}</p>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <div className="font-bold text-green-600">₹{p.price}</div>
                      <div className="text-sm text-gray-500">{p.tokenPrice} tokens</div>
                    </div>
                    <div className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                      {p.sustainabilityScore}% eco
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => addToCart(p)}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-2 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
                      disabled={p.status === 'sold_out'}
                    >
                      {p.status === 'sold_out' ? 'Sold Out' : 'Add to Cart'}
                    </button>
                    <button 
                      onClick={() => removeFromCart(p.id)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold w-10 h-10 rounded-lg transition-colors"
                    >
                      -
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-500 mb-4">No products found matching your criteria</div>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setActiveCategory('all');
                  setSortBy('popular');
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Marketplace;