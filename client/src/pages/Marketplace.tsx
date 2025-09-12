import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import './Marketplace.css';
import { useCart } from '../contexts/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import marketplaceService, { MarketplaceItem } from '../services/marketplaceService.ts';

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
const mapApiProductToProduct = (apiProduct: MarketplaceItem): Product => ({
  id: apiProduct._id,
  name: apiProduct.productInfo.name,
  description: apiProduct.productInfo.description,
  price: apiProduct.pricing.costPrice || 0,
  tokenPrice: apiProduct.pricing.sellingPrice || 0,
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
            placeholder="Search products or factories..." 
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
                  <img 
                    src={p.imageUrl || '/uploads/default-product.svg'} 
                    alt={p.name} 
                    onError={(e) => {
                      // Fallback to default image if the image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = '/uploads/default-product.svg';
                    }}
                  />
                  {p.status === 'sold_out' && <span className="out-of-stock">Sold Out</span>}
                  {p.factoryName && (
                    <div className="factory-tag">
                      By {p.factoryName}
                    </div>
                  )}
                </div>
                <div className="product-info">
                  <h3>{p.name}</h3>
                  <p className="product-desc">{p.description}</p>
                  <div className="product-meta">
                    <span className="product-price">₹{p.price} + {p.tokenPrice} EcoTokens</span>
                    {typeof p.sustainabilityScore === 'number' && (
                      <span className="product-score">♻ {p.sustainabilityScore}%</span>
                    )}
                    <span className="product-stock">
                      {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>
                  <button 
                    className="add-to-cart-button" 
                    disabled={p.status === 'sold_out' || p.stock <= 0}
                    onClick={() => p.status !== 'sold_out' && p.stock > 0 && addToCart({
                      id: p.id,
                      name: p.name,
                      description: p.description,
                      price: p.price,
                      tokenPrice: p.tokenPrice,
                      category: p.category,
                      imageUrl: p.imageUrl,
                      sustainabilityScore: p.sustainabilityScore,
                      status: p.status,
                      stock: p.stock
                    })}
                  >
                    {p.status === 'sold_out' || p.stock <= 0 ? 'Sold Out' : 'Add to Cart'}
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
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= (item.product.stock || 0)}
                      >
                        +
                      </button>
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
              <Link to="/checkout" className="checkout-button">Proceed to Checkout</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;