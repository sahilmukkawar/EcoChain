import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import marketplaceService, { MarketplaceItem } from '../services/marketplaceService.ts';

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
    return <div className="text-center py-5 text-lg">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-5">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Factory Dashboard</h1>
        <p className="text-gray-600 text-lg">Welcome, {user?.name}! Manage your products and track your sales.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-lg shadow-md text-center">
          <div className="text-3xl font-bold text-green-500 mb-1">{totalProducts}</div>
          <div className="text-gray-600">Total Products</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-md text-center">
          <div className="text-3xl font-bold text-green-500 mb-1">{activeProducts}</div>
          <div className="text-gray-600">Active Products</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-md text-center">
          <div className="text-3xl font-bold text-green-500 mb-1">{totalStock}</div>
          <div className="text-gray-600">Total Stock</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-md text-center">
          <div className="text-3xl font-bold text-green-500 mb-1">{outOfStockProducts}</div>
          <div className="text-gray-600">Out of Stock</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/factory-product-management" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
              Manage Products
            </Link>
            <Link to="/materials" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
              Manage Materials
            </Link>
            <Link to="/production" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
              Production Batches
            </Link>
            <Link to="/orders" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
              View Orders
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Products</h2>
          {products.length === 0 ? (
            <div className="text-center p-10 bg-white rounded-lg shadow-md">
              <p className="text-gray-600 text-lg mb-5">You haven't added any products yet.</p>
              <Link to="/factory-product-management" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                Add Your First Product
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-500 text-white">
                    <th className="text-left p-4 font-bold">Product</th>
                    <th className="text-left p-4 font-bold">Category</th>
                    <th className="text-left p-4 font-bold">Price</th>
                    <th className="text-left p-4 font-bold">Stock</th>
                    <th className="text-left p-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 5).map((product) => (
                    <tr key={product._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-bold mb-1">{product.productInfo.name}</div>
                        <div className="text-sm text-gray-600">{product.productInfo.description}</div>
                      </td>
                      <td className="p-4">{product.productInfo.category}</td>
                      <td className="p-4">
                        ₹{product.pricing.sellingPrice} + {product.pricing.ecoTokenDiscount} Tokens
                      </td>
                      <td className="p-4">{product.inventory.currentStock}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          product.availability.isActive 
                            ? 'bg-green-500 text-white' 
                            : 'bg-red-500 text-white'
                        }`}>
                          {product.availability.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length > 5 && (
                <div className="p-4 text-center bg-gray-50">
                  <Link to="/factory-product-management" className="text-blue-500 hover:text-blue-700 font-bold">
                    View All Products
                  </Link>
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