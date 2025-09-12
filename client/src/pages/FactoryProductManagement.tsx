import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm.tsx';
import marketplaceService, { MarketplaceItem, CreateMarketplaceItemData } from '../services/marketplaceService.ts';
import './FactoryProductManagement.css';

const FactoryProductManagement: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<MarketplaceItem | null>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);

  // Fetch factory products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await marketplaceService.getFactoryProducts();
        setProducts(response);
        setError(null);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Handle form submission
  const handleSubmit = async (productData: CreateMarketplaceItemData, images: File[]) => {
    setFormLoading(true);
    try {
      if (editingProduct) {
        // Update existing product
        await marketplaceService.updateFactoryProduct(editingProduct._id, productData, images);
      } else {
        // Create new product
        await marketplaceService.createFactoryProduct(productData, images);
      }
      
      // Refresh product list
      const response = await marketplaceService.getFactoryProducts();
      setProducts(response);
      
      // Reset form
      setShowForm(false);
      setEditingProduct(null);
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Failed to save product. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle edit product
  const handleEdit = (product: MarketplaceItem) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  // Handle delete product
  const handleDelete = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await marketplaceService.deleteFactoryProduct(productId);
        // Refresh product list
        const response = await marketplaceService.getFactoryProducts();
        setProducts(response);
      } catch (err) {
        console.error('Error deleting product:', err);
        setError('Failed to delete product. Please try again.');
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="factory-product-management">
      <div className="page-header">
        <h1>Product Management</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add New Product'}
        </button>
      </div>

      {showForm && (
        <div className="product-form-container">
          <ProductForm 
            product={editingProduct ? {
              productInfo: {
                name: editingProduct.productInfo.name,
                description: editingProduct.productInfo.description,
                category: editingProduct.productInfo.category,
                images: editingProduct.productInfo.images || []
              },
              pricing: {
                costPrice: editingProduct.pricing.costPrice,
                sellingPrice: editingProduct.pricing.sellingPrice
              },
              inventory: {
                currentStock: editingProduct.inventory.currentStock
              },
              sustainability: {
                recycledMaterialPercentage: editingProduct.sustainability.recycledMaterialPercentage
              },
              availability: {
                isActive: editingProduct.availability.isActive
              }
            } as any : undefined}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            loading={formLoading}
          />
        </div>
      )}

      <div className="products-list">
        <h2>Your Products</h2>
        {products.length === 0 ? (
          <div className="no-products-message">
            <p>You haven't added any products yet.</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <div key={product._id} className="product-card">
                <div className="product-image">
                  <img 
                    src={(product.productInfo.images && product.productInfo.images[0]) || '/uploads/default-product.svg'} 
                    alt={product.productInfo.name} 
                  />
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.productInfo.name}</h3>
                  <p className="product-description">{product.productInfo.description}</p>
                  <div className="product-details">
                    <div className="product-price">
                      ₹{product.pricing.costPrice} + {product.pricing.sellingPrice} Tokens
                    </div>
                    <div className="product-stock">
                      Stock: {product.inventory.currentStock}
                    </div>
                    <div className="product-sustainability">
                      ♻ {product.sustainability.recycledMaterialPercentage}%
                    </div>
                    <div className="product-status">
                      <span className={`status ${product.availability.isActive ? 'active' : 'inactive'}`}>
                        {product.availability.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="product-actions">
                    <button 
                      className="btn btn-small btn-secondary" 
                      onClick={() => handleEdit(product)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-small btn-danger" 
                      onClick={() => handleDelete(product._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FactoryProductManagement;