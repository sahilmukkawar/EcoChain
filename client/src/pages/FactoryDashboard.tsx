import React, { useEffect, useState } from 'react';
import '../App.css';
import { marketplaceAPI } from '../services/api.ts';

const FactoryDashboard: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await marketplaceAPI.getProducts();
        setProducts(res.data.products || []);
      } catch (e) {
        setError('Failed to load factory data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="loading">Loading factory dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header"><h1>Factory Dashboard</h1></div>
      <section className="stats-section" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'16px'}}>
        <div className="stat-card"><h3>Active Products</h3><p>{products.length}</p></div>
        <div className="stat-card"><h3>Pending Orders</h3><p>0</p></div>
        <div className="stat-card"><h3>Quality Reports</h3><p>0</p></div>
      </section>
      <h2 style={{marginTop:16}}>Your Products</h2>
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
                <span className="product-price">{p.price?.tokenAmount} EcoTokens</span>
                <span className="product-score">{p.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FactoryDashboard;
