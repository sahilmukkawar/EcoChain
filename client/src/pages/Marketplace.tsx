import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import '../Marketplace.css';
// Mock cart context
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
}

interface CartItem {
  product: Product;
  quantity: number;
}

const useCart = () => {
  return {
    cart: [] as CartItem[],
    addToCart: (product: Product) => {},
    removeFromCart: (productId: string) => {},
    updateQuantity: (productId: string, quantity: number) => {},
    cartTotal: 0,
    tokenTotal: 0
  };
};

// Mock auth context
const useAuth = () => {
  return {
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      ecoTokens: 100
    }
  };
};

// Mock marketplace service
const marketplaceService = {
  getAllItems: async () => {
    return [
      {
        _id: '1',
        sellerId: 'user1',
        title: 'Recycled Paper Notebook',
        description: 'Made from 100% recycled paper',
        category: 'stationery',
        price: 12.99,
        imageUrl: 'https://example.com/notebook.jpg',
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '2',
        sellerId: 'user2',
        title: 'Bamboo Toothbrush',
        description: 'Biodegradable bamboo handle with soft bristles',
        category: 'personal-care',
        price: 4.99,
        imageUrl: 'https://example.com/toothbrush.jpg',
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '3',
        sellerId: 'user1',
        title: 'Reusable Water Bottle',
        description: 'Stainless steel, BPA-free water bottle',
        category: 'kitchen',
        price: 19.99,
        imageUrl: 'https://example.com/bottle.jpg',
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
};

// Adapter interface to map API response to our Product interface
interface ApiProduct {
  _id: string;
  name: string;
  description: string;
  images?: string[];
  price?: { tokenAmount?: number; fiatAmount?: number };
  sustainabilityScore?: number;
  status?: string;
  category?: string;
}

// Function to convert API product to our Product interface
const mapApiProductToProduct = (apiProduct: ApiProduct): Product => ({
  id: apiProduct._id,
  name: apiProduct.name,
  description: apiProduct.description,
  price: apiProduct.price?.fiatAmount || 0,
  tokenPrice: apiProduct.price?.tokenAmount || 0,
  category: apiProduct.category,
  imageUrl: apiProduct.images?.[0],
  sustainabilityScore: apiProduct.sustainabilityScore,
  status: apiProduct.status === 'sold_out' ? 'sold_out' : 'available'
});

const Marketplace: React.FC = () => {
  // Use cart context
  const { cart, addToCart, removeFromCart, updateQuantity, cartTotal, tokenTotal } = useCart();
  const { user } = useAuth();
  const totalEcoTokens = user?.ecoTokens || 0;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popular'|'price_low'|'price_high'>('popular');
  const [page, setPage] = useState(1);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const pageSize = 12;

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Use mock data for now until backend is fully integrated
        const apiProducts = await marketplaceService.getAllItems();
        // Map API products to our Product interface
        const mappedProducts = apiProducts.map((item) => ({
          id: item._id,
          name: item.title,
          description: item.description,
          price: item.price,
          tokenPrice: Math.round(item.price * 0.5), // Example conversion
          category: item.category,
          imageUrl: item.imageUrl || 'https://via.placeholder.com/150',
          sustainabilityScore: Math.floor(Math.random() * 100), // Placeholder
          status: item.status === 'sold' ? 'sold_out' : 'available'
        }));
        setProducts(mappedProducts);
      } catch (e) {
        console.error('Error fetching products:', e);
        setError('Failed to load products');
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
        (p.description || '').toLowerCase().includes(t)
      );
    }
    if (sortBy === 'price_low') result.sort((a,b) => a.price - b.price);
    if (sortBy === 'price_high') result.sort((a,b) => b.price - a.price);
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
    return <div className="loading">Loading products...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="marketplace-container">
      <div className="marketplace-header">
        <h1>EcoChain Marketplace</h1>
        <p>Browse eco-friendly products made from recycled materials</p>
        
        <div className="marketplace-header-actions">
          <div className="token-balance-display">
            <span className="token-icon">🌱</span>
            <span className="token-amount">{totalEcoTokens || 0}</span>
            <span className="token-label">EcoTokens Available</span>
          </div>
          
          {cart.length > 0 && (
            <Link to="/checkout" className="view-cart-button">
              View Cart ({cart.length}) - ₹{cartTotal} + {tokenTotal} Tokens
            </Link>
          )}
        </div>
      </div>

      <div className="marketplace-filters">
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="category-filters">
          {categories.map(category => (
            <button 
              key={category} 
              className={`category-button ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
        <div className="sort-controls">
          <select value={sortBy} onChange={e=>{setSortBy(e.target.value as any); setPage(1);}}>
            <option value="popular">Most Popular</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      <div className="marketplace-content">
        <div className="products-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(p => (
              <div className="product-card" key={p.id}>
                <div className="product-image">
                  <img src={p.imageUrl || '/logo192.png'} alt={p.name} />
                  {p.status === 'sold_out' && <span className="out-of-stock">Sold Out</span>}
                </div>
                <div className="product-info">
                  <h3>{p.name}</h3>
                  <p className="product-desc">{p.description}</p>
                  <div className="product-meta">
                    <span className="product-price">₹{p.price} + {p.tokenPrice} EcoTokens</span>
                    {typeof p.sustainabilityScore === 'number' && (
                      <span className="product-score">♻ {p.sustainabilityScore}</span>
                    )}
                  </div>
                  <button 
                    className="add-to-cart-button" 
                    disabled={p.status === 'sold_out'}
                    onClick={() => p.status !== 'sold_out' && addToCart(p)}
                  >
                    {p.status === 'sold_out' ? 'Sold Out' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-products">
              <p>No products found. Try different filters.</p>
              <button onClick={() => { setActiveCategory('all'); setSearchTerm(''); }}>Clear Filters</button>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page===totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</button>
          </div>
        )}

        {cart.length > 0 && (
          <div className="cart-sidebar">
            <h2>Your Cart</h2>
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.product.id} className="cart-item">
                  <div className="cart-item-info">
                    <h4>{item.product.name}</h4>
                    <div className="cart-item-price">
                      <span>₹{item.product.price}</span>
                      <span>+ {item.product.tokenPrice} Tokens</span>
                    </div>
                  </div>
                  <div className="cart-item-actions">
                    <div className="quantity-controls">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                    </div>
                    <button className="remove-button" onClick={() => removeFromCart(item.product.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="cart-summary">
              <div className="cart-total">
                <span>Subtotal:</span>
                <span>₹{cartTotal}</span>
              </div>
              <div className="token-usage">
                <span>EcoTokens Applied:</span>
                <span>{maxTokensUsable} tokens</span>
              </div>
              <div className="final-total">
                <span>Total:</span>
                <span>₹{cartTotal - (maxTokensUsable * 5)}</span>
              </div>
              <button className="checkout-button">Proceed to Checkout</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
