import React, { useState, useEffect, useRef } from 'react';

interface ProductFormData {
  productInfo: {
    name: string;
    description: string;
    category: string;
    images: string[];
  };
  pricing: {
    costPrice: number;
    sellingPrice: number;
  };
  inventory: {
    currentStock: number;
  };
  sustainability: {
    recycledMaterialPercentage: number;
  };
  availability: {
    isActive: boolean;
  };
}

interface ProductFormProps {
  product?: ProductFormData & { _id: string };
  onSubmit: (data: ProductFormData, images: File[]) => void;
  onCancel: () => void;
  loading: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState<ProductFormData>({
    productInfo: {
      name: '',
      description: '',
      category: 'home_decor',
      images: []
    },
    pricing: {
      costPrice: 0,
      sellingPrice: 0
    },
    inventory: {
      currentStock: 0
    },
    sustainability: {
      recycledMaterialPercentage: 80
    },
    availability: {
      isActive: true
    }
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]); // Track existing images

  useEffect(() => {
    if (product) {
      const images = product.productInfo.images || [];
      setFormData({
        productInfo: {
          name: product.productInfo.name,
          description: product.productInfo.description,
          category: product.productInfo.category || 'home_decor',
          images: images
        },
        pricing: {
          costPrice: product.pricing.costPrice || 0,
          sellingPrice: product.pricing.sellingPrice || 0
        },
        inventory: {
          currentStock: product.inventory.currentStock || 0
        },
        sustainability: {
          recycledMaterialPercentage: product.sustainability.recycledMaterialPercentage || 80
        },
        availability: {
          isActive: product.availability.isActive !== undefined ? product.availability.isActive : true
        }
      });
      setImagePreviews(images);
      setExistingImages(images); // Store existing images
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox separately
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      const isChecked = checkbox.checked;
      
      if (name === 'availability.isActive') {
        setFormData(prev => ({
          ...prev,
          availability: {
            ...prev.availability,
            isActive: isChecked
          }
        }));
      }
      return;
    }
    
    // Handle nested properties
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: child.includes('Price') || child.includes('Stock') || child.includes('Percentage') ? Number(value) : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name.includes('Price') || name.includes('Stock') || name.includes('Percentage') ? Number(value) : value
      }));
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const previews: string[] = [];
      
      // Create preview URLs
      files.forEach(file => {
        const previewUrl = URL.createObjectURL(file);
        previews.push(previewUrl);
      });
      
      setSelectedFiles(files);
      // Combine existing images with new previews
      setImagePreviews(prev => [...existingImages, ...previews]);
    }
  };
  
  const removeImage = (index: number) => {
    // Check if this is an existing image or a new preview
    if (index < existingImages.length) {
      // Removing an existing image
      const newExistingImages = existingImages.filter((_, i) => i !== index);
      setExistingImages(newExistingImages);
      setImagePreviews([...newExistingImages, ...selectedFiles.map(file => URL.createObjectURL(file))]);
      
      // Update form data to reflect removed existing image
      setFormData(prev => ({
        ...prev,
        productInfo: {
          ...prev.productInfo,
          images: newExistingImages
        }
      }));
    } else {
      // Removing a new preview
      const newSelectedFiles = [...selectedFiles];
      newSelectedFiles.splice(index - existingImages.length, 1);
      setSelectedFiles(newSelectedFiles);
      setImagePreviews([...existingImages, ...newSelectedFiles.map(file => URL.createObjectURL(file))]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure exact value preservation by validating numeric fields
    const formDataToSend = { ...formData };
    
    // Validate and ensure pricing values are exact numbers (no precision loss)
    if (formDataToSend.pricing) {
      // Ensure pricing values are properly formatted numbers
      formDataToSend.pricing.costPrice = Number(formDataToSend.pricing.costPrice);
      formDataToSend.pricing.sellingPrice = Number(formDataToSend.pricing.sellingPrice);
      
      // Log the exact values being submitted for debugging
      console.log('ProductForm submitting exact values:');
      console.log('  Fiat Price (₹):', formDataToSend.pricing.costPrice);
      console.log('  Token Price:', formDataToSend.pricing.sellingPrice);
    }
    
    // For new products, don't send images array, let backend handle it
    // For existing products, send the images array
    if (!product && (!formData.productInfo.images || formData.productInfo.images.length === 0)) {
      const { images, ...productInfoWithoutImages } = formData.productInfo;
      formDataToSend.productInfo = { ...productInfoWithoutImages, images: [] };
    }
    
    onSubmit(formDataToSend, selectedFiles);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-green-800 flex items-center gap-2">
        <span className="text-xl">🌱</span>
        <span className="bg-gradient-to-r from-green-500 to-blue-400 text-transparent bg-clip-text">
          {product ? 'Edit Product' : 'Add New Product'}
        </span>
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-group">
          <label htmlFor="productInfo.name" className="block text-sm font-medium text-gray-700 mb-1">
            Product Name
          </label>
          <input
            type="text"
            id="productInfo.name"
            name="productInfo.name"
            value={formData.productInfo.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
            placeholder="Enter product name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="productInfo.description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="productInfo.description"
            name="productInfo.description"
            value={formData.productInfo.description}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
            placeholder="Describe your product"
          />
        </div>

        <div className="form-group">
          <label htmlFor="productInfo.category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="productInfo.category"
            name="productInfo.category"
            value={formData.productInfo.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white"
          >
            <option value="home_decor">Home Decor</option>
            <option value="furniture">Furniture</option>
            <option value="clothing">Clothing</option>
            <option value="accessories">Accessories</option>
            <option value="electronics">Electronics</option>
            <option value="toys">Toys</option>
            <option value="stationery">Stationery</option>
            <option value="packaging">Packaging</option>
            <option value="construction">Construction</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Image Upload Section */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Images
          </label>
          <div className="flex items-center justify-center w-full mb-4">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p className="mb-1 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                multiple
                accept="image/*"
                className="hidden"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img 
                  src={preview} 
                  alt={`Preview ${index + 1}`} 
                  className="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow-sm transition-all group-hover:shadow-md" 
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
            {imagePreviews.length === 0 && (
              <div className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                No images
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label htmlFor="pricing.sellingPrice" className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-1">
                <span className="text-green-600">🪙</span> EcoToken Price
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                id="pricing.sellingPrice"
                name="pricing.sellingPrice"
                value={formData.pricing.sellingPrice}
                onChange={handleChange}
                min="0"
                required
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                placeholder="0"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-green-600 text-sm">Ξ</span>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="pricing.costPrice" className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-1">
                <span>💰</span> Fiat Price (₹)
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                id="pricing.costPrice"
                name="pricing.costPrice"
                value={formData.pricing.costPrice}
                onChange={handleChange}
                min="0"
                required
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                placeholder="0"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500">₹</span>
              </div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="inventory.currentStock" className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center gap-1">
              <span>📦</span> Available Stock
            </span>
          </label>
          <input
            type="number"
            id="inventory.currentStock"
            name="inventory.currentStock"
            value={formData.inventory.currentStock}
            onChange={handleChange}
            min="0"
            required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
            placeholder="0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="sustainability.recycledMaterialPercentage" className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center gap-1">
              <span>♻️</span> Sustainability Score (0-100)
            </span>
          </label>
          <div className="relative">
            <input
              type="number"
              id="sustainability.recycledMaterialPercentage"
              name="sustainability.recycledMaterialPercentage"
              value={formData.sustainability.recycledMaterialPercentage}
              onChange={handleChange}
              min="0"
              max="100"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
            />
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-400 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${formData.sustainability.recycledMaterialPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="availability.isActive"
                checked={formData.availability.isActive}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">Active Status</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-blue-400 hover:from-green-600 hover:to-blue-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              <span>{product ? 'Update Product' : 'Add Product'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;