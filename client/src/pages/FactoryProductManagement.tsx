import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm.tsx';
import marketplaceService, { MarketplaceItem, CreateMarketplaceItemData } from '../services/marketplaceService.ts';

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
    return <div className="text-center py-5 text-lg">Loading products...</div>;
  }

  if (error) {
    return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-5">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Product Management</h1>
        <button 
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add New Product'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-100 p-5 rounded-lg shadow-md mb-8">
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

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Products</h2>
        {products.length === 0 ? (
          <div className="text-center p-10 bg-gray-100 rounded-lg">
            <p className="text-gray-600 text-lg mb-5">You haven't added any products yet.</p>
            <button 
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              onClick={() => setShowForm(true)}
            >
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-500 text-white">
                  <th className="text-left p-4 font-bold">Product</th>
                  <th className="text-left p-4 font-bold">Price</th>
                  <th className="text-left p-4 font-bold">Stock</th>
                  <th className="text-left p-4 font-bold">Sustainability</th>
                  <th className="text-left p-4 font-bold">Status</th>
                  <th className="text-left p-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-bold mb-1">{product.productInfo.name}</div>
                      <div className="text-sm text-gray-600">{product.productInfo.description}</div>
                    </td>
                    <td className="p-4">
                      ₹{product.pricing.costPrice} + {product.pricing.sellingPrice} Tokens
                    </td>
                    <td className="p-4">{product.inventory.currentStock}</td>
                    <td className="p-4">
                      ♻ {product.sustainability.recycledMaterialPercentage}%
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        product.availability.isActive 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}>
                        {product.availability.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button 
                          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded text-sm transition-colors"
                          onClick={() => handleEdit(product)}
                        >
                          Edit
                        </button>
                        <button 
                          className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm transition-colors"
                          onClick={() => handleDelete(product._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FactoryProductManagement;