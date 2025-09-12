import React, { useEffect, useState } from 'react';
import '../App.css';
import { useAuth } from '../context/AuthContext.tsx';
import ProductForm from '../components/ProductForm.tsx';
import marketplaceService, { MarketplaceItem } from '../services/marketplaceService.ts';

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
    const baseStyle = { padding: '4px 8px', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 'bold' };
    if (isActive) {
      return { ...baseStyle, backgroundColor: '#e8f5e8', color: '#2e7d32' };
    } else {
      return { ...baseStyle, backgroundColor: '#ffebee', color: '#d32f2f' };
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>Loading products...</div>
    </div>
  );
  
  if (error) return (
    <div style={{ margin: '20px' }}>
      <div style={{ color: 'red', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
        Error: {error}
        <button 
          onClick={loadProducts}
          style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Product Management {user && `- ${user.name}`}</h1>
      
      {/* Products Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Your Products</h2>
        <button 
          onClick={handleAddProduct}
          style={{ padding: '8px 16px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Add New Product
        </button>
      </div>
      
      {showProductForm ? (
        <div style={{ marginBottom: '32px' }}>
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
            } : undefined}
            onSubmit={handleProductFormSubmit}
            onCancel={handleCancelForm}
            loading={formLoading}
          />
        </div>
      ) : null}
      
      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h3>No products found</h3>
          <p>You haven't added any products yet.</p>
          <button 
            onClick={handleAddProduct}
            style={{ padding: '10px 20px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Add Your First Product
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {products.map((p) => (
            <div key={p._id} style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '200px', overflow: 'hidden', marginBottom: '16px', borderRadius: '4px' }}>
                <img 
                  src={(p.productInfo.images && p.productInfo.images[0]) || '/logo192.png'} 
                  alt={p.productInfo.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <h3 style={{ margin: '0 0 8px 0' }}>{p.productInfo.name}</h3>
              <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '0.875rem', flexGrow: 1 }}>
                {p.productInfo.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <strong>{p.pricing.sellingPrice} EcoTokens</strong>
                <span style={getStatusStyle(p.availability.isActive)}>
                  {getProductStatus(p)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.875rem' }}>Stock: {p.inventory.currentStock}</span>
                <span style={{ fontSize: '0.875rem' }}>♻ {p.sustainability.recycledMaterialPercentage}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  onClick={() => handleEditProduct(p)}
                  style={{ padding: '6px 12px', fontSize: '0.875rem', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDeleteProduct(p._id)}
                  style={{ padding: '6px 12px', fontSize: '0.875rem', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
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