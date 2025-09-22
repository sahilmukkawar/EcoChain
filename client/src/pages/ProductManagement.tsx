import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ProductForm from '../components/ProductForm';
import marketplaceService, { MarketplaceItem } from '../services/marketplaceService';

const ProductManagement: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MarketplaceItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await marketplaceService.getFactoryProducts();
      console.log('API Response:', response);
      setProducts(response);
      setError(null);
    } catch (e: any) {
      console.error('Error loading factory products:', e);
      // More detailed error message
      let errorMessage = 'Failed to load products. ';
      if (e.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage += `Server responded with status ${e.response.status}. `;
        if (e.response.data && e.response.data.message) {
          errorMessage += e.response.data.message;
        }
      } else if (e.request) {
        // The request was made but no response was received
        errorMessage += 'No response received from server. Please check your connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage += e.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (isActive: boolean) => {
    if (isActive) {
      return 'px-2 py-1 rounded text-sm font-bold bg-green-100 text-green-800';
    } else {
      return 'px-2 py-1 rounded text-sm font-bold bg-red-100 text-red-800';
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product: MarketplaceItem) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    
    try {
      await marketplaceService.deleteFactoryProduct(productId);
      setProducts(products.filter(p => p._id !== productId));
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product. Please try again.');
    }
  };

  const handleProductFormSubmit = async (productData: any) => {
    setFormLoading(true);
    try {
      if (editingProduct) {
        // Update existing product
        const response = await marketplaceService.updateFactoryProduct(editingProduct._id, productData);
        setProducts(products.map(p => p._id === editingProduct._id ? response : p));
      } else {
        // Create new product
        const response = await marketplaceService.createFactoryProduct(productData);
        setProducts([...products, response]);
      }
      setShowProductForm(false);
      setEditingProduct(null);
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Failed to save product. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  // Helper function to get product status as string
  const getProductStatus = (product: MarketplaceItem) => {
    return product.availability.isActive ? 'Active' : 'Inactive';
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div>Loading products...</div>
    </div>
  );
  
  if (error) return (
    <div className="m-5">
      <div className="text-red-700 p-3 bg-red-100 rounded flex items-center">
        Error: {error}
        <button 
          onClick={loadProducts}
          className="ml-3 px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <h1 className="text-2xl font-bold mb-6">Product Management {user && `- ${user.name}`}</h1>
      
      {/* Products Section */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold m-0">Your Products</h2>
        <button 
          onClick={handleAddProduct}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Add New Product
        </button>
      </div>
      
      {showProductForm ? (
        <div className="mb-8">
          <ProductForm 
            product={editingProduct ? {
              ...editingProduct,
              name: editingProduct.productInfo.name,
              description: editingProduct.productInfo.description,
              category: editingProduct.productInfo.category,
              price: {
                tokenAmount: editingProduct.pricing.sellingPrice,
                fiatAmount: editingProduct.pricing.costPrice
              },
              inventory: {
                available: editingProduct.inventory.currentStock
              },
              sustainabilityScore: editingProduct.sustainability.recycledMaterialPercentage,
              status: editingProduct.availability.isActive ? 'active' : 'inactive'
            } as any : undefined}
            onSubmit={handleProductFormSubmit}
            onCancel={handleCancelForm}
            loading={formLoading}
          />
        </div>
      ) : null}
      
      {products.length === 0 ? (
        <div className="text-center p-10 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">You haven't added any products yet.</p>
          <button 
            onClick={handleAddProduct}
            className="px-5 py-2.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {products.map((p) => (
            <div key={p._id} className="p-4 bg-white rounded-lg shadow flex flex-col">
              <div className="h-48 overflow-hidden mb-4 rounded">
                <img 
                  src={(p.productInfo.images && p.productInfo.images[0]) || '/logo192.png'} 
                  alt={p.productInfo.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <h3 className="text-lg font-semibold mb-2">{p.productInfo.name}</h3>
              <p className="text-gray-600 text-sm mb-4 flex-grow">
                {p.productInfo.description}
              </p>
              <div className="flex justify-between items-center mb-3">
                <strong className="text-lg">{p.pricing.sellingPrice} EcoTokens</strong>
                <span className={getStatusStyle(p.availability.isActive)}>
                  {getProductStatus(p)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm">Stock: {p.inventory.currentStock}</span>
                <span className="text-sm">♻ {p.sustainability.recycledMaterialPercentage}%</span>
              </div>
              <div className="flex justify-between items-center">
                <button 
                  onClick={() => handleEditProduct(p)}
                  className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mr-2"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDeleteProduct(p._id)}
                  className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductManagement;