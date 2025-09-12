import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import marketplaceService, { MarketplaceItem } from '../services/marketplaceService.ts';
import './FactoryDashboard.css';

const FactoryDashboard: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await marketplaceService.getFactoryProducts();
        setProducts(response);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching products:', err);
        // More detailed error message
        let errorMessage = 'Failed to load products. ';
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          errorMessage += `Server responded with status ${err.response.status}. `;
          if (err.response.data && err.response.data.message) {
            errorMessage += err.response.data.message;
          }
        } else if (err.request) {
          // The request was made but no response was received
          errorMessage += 'No response received from server. Please check your connection.';
        } else {
          // Something happened in setting up the request that triggered an Error
          errorMessage += err.message;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Calculate dashboard metrics
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.availability.isActive).length;
  const totalStock = products.reduce((sum, product) => sum + product.inventory.currentStock, 0);
  const outOfStockProducts = products.filter(p => p.inventory.currentStock === 0).length;

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="retry-button"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="factory-dashboard">
      <div className="dashboard-header">
        <h1>Factory Dashboard</h1>
        <p>Welcome, {user?.name}! Manage your products and track your sales.</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{totalProducts}</div>
          <div className="stat-label">Total Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{activeProducts}</div>
          <div className="stat-label">Active Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalStock}</div>
          <div className="stat-label">Total Stock</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{outOfStockProducts}</div>
          <div className="stat-label">Out of Stock</div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <Link to="/factory-product-management" className="btn btn-primary">
              Manage Products
            </Link>
            <Link to="/materials" className="btn btn-secondary">
              Manage Materials
            </Link>
            <Link to="/production" className="btn btn-secondary">
              Production Batches
            </Link>
            <Link to="/orders" className="btn btn-secondary">
              View Orders
            </Link>
          </div>
        </div>

        <div className="recent-products">
          <h2>Your Products</h2>
          {products.length === 0 ? (
            <div className="no-products">
              <p>You haven't added any products yet.</p>
              <Link to="/factory-product-management" className="btn btn-primary">
                Add Your First Product
              </Link>
            </div>
          ) : (
            <div className="products-table">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 5).map((product) => (
                    <tr key={product._id}>
                      <td>
                        <div className="product-name">{product.productInfo.name}</div>
                        <div className="product-description">{product.productInfo.description}</div>
                      </td>
                      <td>{product.productInfo.category}</td>
                      <td>
                        ₹{product.pricing.costPrice} + {product.pricing.sellingPrice} Tokens
                      </td>
                      <td>{product.inventory.currentStock}</td>
                      <td>
                        <span className={`status ${product.availability.isActive ? 'active' : 'inactive'}`}>
                          {product.availability.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length > 5 && (
                <div className="view-all">
                  <Link to="/factory-product-management">View All Products</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FactoryDashboard;