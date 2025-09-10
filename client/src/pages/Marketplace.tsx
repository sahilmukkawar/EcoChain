import React, { useEffect, useState } from 'react';
import '../App.css';
import { marketplaceAPI } from '../services/api.ts';

interface Product {
  _id: string;
  name: string;
  description: string;
  images?: string[];
  price?: { tokenAmount?: number; fiatAmount?: number };
  sustainabilityScore?: number;
  status?: string;
}

const Marketplace: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await marketplaceAPI.getProducts();
        setProducts(res.data.products || []);
      } catch (e) {
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) return <div className="loading">Loading products...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="marketplace-container">
      <h1>Marketplace</h1>
      <div className="products-grid">
        {products.map((p) => (
          <div className="product-card" key={p._id}>
            <div className="product-image">
              <img src={(p.images && p.images[0]) || '/logo192.png'} alt={p.name} />
            </div>
            <div className="product-info">
              <h3>{p.name}</h3>
              <p className="product-desc">{p.description}</p>
              <div className="product-meta">
                <span className="product-price">
                  {p.price?.tokenAmount ? `${p.price.tokenAmount} EcoTokens` : '—'}
                </span>
                {typeof p.sustainabilityScore === 'number' && (
                  <span className="product-score">♻ {p.sustainabilityScore}</span>
                )}
              </div>
              <button className="buy-button" disabled={p.status === 'sold_out'}>
                {p.status === 'sold_out' ? 'Sold Out' : 'Buy'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marketplace;
