import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm.tsx';
import marketplaceService, { MarketplaceItem, CreateMarketplaceItemData } from '../services/marketplaceService.ts';

const FactoryProductManagement: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<MarketplaceItem | null>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch factory products
  const fetchProducts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      console.log('Fetching factory products...');
      const response = await marketplaceService.getFactoryProducts();
      console.log('Fetched products:', response.length);
      setProducts(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load products. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle form submission
  const handleSubmit = async (productData: CreateMarketplaceItemData, images: File[]) => {
    setFormLoading(true);
    setError(null);
    
    try {
      console.log('Submitting product data:', productData);
      console.log('Images:', images?.length || 0);
      
      if (editingProduct) {
        console.log('Updating existing product:', editingProduct._id);
        await marketplaceService.updateFactoryProduct(editingProduct._id, productData, images);
        console.log('Product updated successfully');
      } else {
        console.log('Creating new product');
        await marketplaceService.createFactoryProduct(productData, images);
        console.log('Product created successfully');
      }
      
      console.log('Refreshing product list...');
      const response = await marketplaceService.getFactoryProducts();
      console.log('Fetched products:', response.length);
      setProducts(response);
      
      setShowForm(false);
      setEditingProduct(null);
      console.log('Form reset complete');
      
    } catch (err) {
      console.error('Error saving product:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save product. Please try again.';
      setError(errorMessage);
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
        console.log('Deleting product:', productId);
        await marketplaceService.deleteFactoryProduct(productId);
        console.log('Product deleted successfully');
        
        console.log('Refreshing product list after delete...');
        const response = await marketplaceService.getFactoryProducts();
        console.log('Fetched products after delete:', response.length);
        setProducts(response);
        setError(null);
        
      } catch (err) {
        console.error('Error deleting product:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete product. Please try again.';
        setError(errorMessage);
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.productInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.productInfo.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && product.availability.isActive) ||
                         (filterStatus === 'inactive' && !product.availability.isActive);
    const matchesCategory = filterCategory === 'all' || product.productInfo.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique categories
  const categories = [...new Set(products.map(p => p.productInfo.category))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-green-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading product management...</p>
        </div>
      </div>
    );
  }

  if (error && !products.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-red-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Products</h3>
            <p className="text-red-600 text-sm mb-6 leading-relaxed">{error}</p>
            <button 
              onClick={() => fetchProducts()}
              className="bg-eco-green-600 hover:bg-eco-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
              <p className="text-sm text-gray-500">Create and manage your sustainable product catalog</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Product Count */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-eco-green-50 text-eco-green-700 border border-eco-green-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span>{filteredProducts.length} Product{filteredProducts.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => fetchProducts(true)}
                disabled={refreshing}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${refreshing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-600 hover:bg-gray-700 text-white shadow-sm hover:shadow-md'
                  }`}
              >
                <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>

              {/* Add Product Button */}
              <button 
                className="flex items-center gap-2 bg-eco-green-500 hover:bg-eco-green-600 text-white font-medium py-2 px-4 rounded-lg transition-all shadow-sm hover:shadow-md"
                onClick={() => setShowForm(!showForm)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {showForm ? 'Cancel' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && products.length > 0 && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-800 font-medium text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg mb-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {editingProduct ? 'Update your product information' : 'Create a new sustainable product listing'}
                  </p>
                </div>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <ProductForm 
                product={editingProduct ? {
                  productInfo: {
                    name: editingProduct.productInfo.name,
                    description: editingProduct.productInfo.description,
                    category: editingProduct.productInfo.category,
                    images: editingProduct.productInfo.images || []
                  },
                  pricing: {
                    costPrice: editingProduct.pricing.sellingPrice,
                    sellingPrice: editingProduct.pricing.ecoTokenDiscount || 0
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
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filter Products</h3>
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-eco-green-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-eco-green-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Products</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or description..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green-500 focus:border-transparent"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category} className="capitalize">
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Display */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Product Catalog</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredProducts.length} of {products.length} products displayed
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Export
                </button>
              </div>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-24 h-24 bg-eco-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-eco-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {products.length === 0 ? 'No Products Yet' : 'No Matching Products'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {products.length === 0 
                  ? 'Start building your sustainable product catalog to showcase your eco-friendly manufacturing capabilities.'
                  : 'Try adjusting your filters to find the products you\'re looking for.'
                }
              </p>
              {products.length === 0 && (
                <button 
                  className="inline-flex items-center gap-2 bg-eco-green-600 hover:bg-eco-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  onClick={() => setShowForm(true)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Your First Product
                </button>
              )}
            </div>
          ) : (
            <div className="p-6">
              {viewMode === 'grid' ? (
                // Grid View - Card Layout like your image
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <div key={product._id} className="group bg-white rounded-lg border border-gray-200 hover:border-eco-green-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
                      {/* Product Image */}
                      <div className="relative h-48 bg-gray-100 overflow-hidden">
                        <img 
                          src={product.productInfo.images?.[0] || '/uploads/default-product.svg'} 
                          alt={product.productInfo.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/uploads/default-product.svg';
                          }}
                        />
                        
                        {/* Sustainability Badge */}
                        <div className="absolute top-3 left-3 bg-eco-green-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                          {product.sustainability.recycledMaterialPercentage}%
                        </div>

                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            product.availability.isActive 
                              ? 'bg-eco-green-100 text-eco-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.availability.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {/* Factory Badge */}
                        <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          EcoChain Factory
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="p-4">
                        <div className="mb-3">
                          <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                            {product.productInfo.name}
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                            {product.productInfo.description}
                          </p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                            {product.productInfo.category}
                          </span>
                        </div>
                        
                        {/* Pricing & Stock */}
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <div className="text-xl font-bold text-eco-green-600">
                              ₹{product.pricing.sellingPrice.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                              {product.pricing.ecoTokenDiscount} tokens
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Stock</div>
                            <div className="font-medium text-gray-900 flex items-center gap-1">
                              {product.inventory.currentStock}
                              <div className={`w-2 h-2 rounded-full ${
                                product.inventory.currentStock > 10 
                                  ? 'bg-eco-green-500' 
                                  : product.inventory.currentStock > 0 
                                  ? 'bg-amber-500' 
                                  : 'bg-red-500'
                              }`}></div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button 
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            onClick={() => handleEdit(product)}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button 
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            onClick={() => handleDelete(product._id)}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // List View
                <div className="space-y-4">
                  {filteredProducts.map((product) => (
                    <div key={product._id} className="bg-white rounded-lg border border-gray-200 hover:border-eco-green-300 hover:shadow-md transition-all p-4">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                          <img 
                            src={product.productInfo.images?.[0] || '/uploads/default-product.svg'} 
                            alt={product.productInfo.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/uploads/default-product.svg';
                            }}
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0 pr-4">
                              <h3 className="text-lg font-bold text-gray-900 mb-1">
                                {product.productInfo.name}
                              </h3>
                              <p className="text-gray-600 text-sm mb-2">
                                {product.productInfo.description}
                              </p>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium capitalize">
                                  {product.productInfo.category}
                                </span>
                                <div className="flex items-center gap-1 text-eco-green-600">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                  </svg>
                                  {product.sustainability.recycledMaterialPercentage}% eco
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 flex-shrink-0">
                              {/* Pricing */}
                              <div className="text-right">
                                <div className="text-lg font-bold text-eco-green-600">
                                  ₹{product.pricing.sellingPrice.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-500">
                                  +{product.pricing.ecoTokenDiscount} tokens
                                </div>
                              </div>
                              
                              {/* Stock */}
                              <div className="text-right">
                                <div className="text-sm text-gray-500">Stock</div>
                                <div className="font-medium text-gray-900 flex items-center gap-1">
                                  {product.inventory.currentStock}
                                  <div className={`w-2 h-2 rounded-full ${
                                    product.inventory.currentStock > 10 
                                      ? 'bg-eco-green-500' 
                                      : product.inventory.currentStock > 0 
                                      ? 'bg-amber-500' 
                                      : 'bg-red-500'
                                  }`}></div>
                                </div>
                              </div>

                              {/* Status */}
                              <div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  product.availability.isActive 
                                    ? 'bg-eco-green-100 text-eco-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {product.availability.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2">
                                <button 
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                                  onClick={() => handleEdit(product)}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                                  onClick={() => handleDelete(product._id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FactoryProductManagement;
