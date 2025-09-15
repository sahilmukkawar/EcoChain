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
  const [existingImages, setExistingImages] = useState<string[]>([]);

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
          isActive: product.availability.isActive ?? true
        }
      });
      setImagePreviews(images);
      setExistingImages(images);
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
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
      
      files.forEach(file => {
        const previewUrl = URL.createObjectURL(file);
        previews.push(previewUrl);
      });
      
      setSelectedFiles(files);
      setImagePreviews(prev => [...existingImages, ...previews]);
    }
  };
  
  const removeImage = (index: number) => {
    if (index < existingImages.length) {
      const newExistingImages = existingImages.filter((_, i) => i !== index);
      setExistingImages(newExistingImages);
      setImagePreviews([...newExistingImages, ...selectedFiles.map(file => URL.createObjectURL(file))]);
      
      setFormData(prev => ({
        ...prev,
        productInfo: {
          ...prev.productInfo,
          images: newExistingImages
        }
      }));
    } else {
      const newSelectedFiles = [...selectedFiles];
      newSelectedFiles.splice(index - existingImages.length, 1);
      setSelectedFiles(newSelectedFiles);
      setImagePreviews([...existingImages, ...newSelectedFiles.map(file => URL.createObjectURL(file))]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formDataToSend = { ...formData };
    
    if (formDataToSend.pricing) {
      formDataToSend.pricing.costPrice = Number(formDataToSend.pricing.costPrice);
      formDataToSend.pricing.sellingPrice = Number(formDataToSend.pricing.sellingPrice);
      
      console.log('ProductForm submitting exact values:');
      console.log('  Fiat Price (₹):', formDataToSend.pricing.costPrice);
      console.log('  Token Price:', formDataToSend.pricing.sellingPrice);
    }
    
    if (!product && (!formData.productInfo.images || formData.productInfo.images.length === 0)) {
      const { images, ...productInfoWithoutImages } = formData.productInfo;
      formDataToSend.productInfo = { ...productInfoWithoutImages, images: [] };
    }
    
    onSubmit(formDataToSend, selectedFiles);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-eco-green-700 mb-8">
        {product ? 'Edit Product' : 'Add New Product'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-group">
          <label htmlFor="productInfo.name" className="block text-sm font-semibold text-gray-700 mb-2">
            Product Name
          </label>
          <input
            type="text"
            id="productInfo.name"
            name="productInfo.name"
            value={formData.productInfo.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-green focus:border-eco-green transition-colors"
            placeholder="Enter product name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="productInfo.description" className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="productInfo.description"
            name="productInfo.description"
            value={formData.productInfo.description}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-green focus:border-eco-green transition-colors resize-none"
            placeholder="Describe your product"
          />
        </div>

        <div className="form-group">
          <label htmlFor="productInfo.category" className="block text-sm font-semibold text-gray-700 mb-2">
            Category
          </label>
          <select
            id="productInfo.category"
            name="productInfo.category"
            value={formData.productInfo.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-green focus:border-eco-green transition-colors bg-white"
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

        <div className="form-group">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Product Images
          </label>
          <div className="flex items-center justify-center w-full mb-4">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p className="mb-1 text-sm text-gray-500"><span className="font-medium">Click to upload</span> or drag and drop</p>
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
                  className="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow-sm" 
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-eco-red text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-eco-red-dark transition-colors"
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
            <label htmlFor="pricing.sellingPrice" className="block text-sm font-semibold text-gray-700 mb-2">
              EcoToken Price
            </label>
            <input
              type="number"
              id="pricing.sellingPrice"
              name="pricing.sellingPrice"
              value={formData.pricing.sellingPrice || ''}
              onChange={handleChange}
              min="0"
              placeholder="Enter token price"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-green focus:border-eco-green transition-colors"
            />
          </div>
          <div className="form-group">
            <label htmlFor="pricing.costPrice" className="block text-sm font-semibold text-gray-700 mb-2">
              Fiat Price (₹)
            </label>
            <input
              type="number"
              id="pricing.costPrice"
              name="pricing.costPrice"
              value={formData.pricing.costPrice || ''}
              onChange={handleChange}
              min="0"
              placeholder="Enter fiat price"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-green focus:border-eco-green transition-colors"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="inventory.currentStock" className="block text-sm font-semibold text-gray-700 mb-2">
            Available Stock
          </label>
          <input
            type="number"
            id="inventory.currentStock"
            name="inventory.currentStock"
            value={formData.inventory.currentStock || ''}
            onChange={handleChange}
            min="0"
            placeholder="Enter stock quantity"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-green focus:border-eco-green transition-colors"
          />
        </div>

        <div className="form-group">
          <label htmlFor="sustainability.recycledMaterialPercentage" className="block text-sm font-semibold text-gray-700 mb-2">
            Sustainability Score (0-100)
          </label>
          <input
            type="number"
            id="sustainability.recycledMaterialPercentage"
            name="sustainability.recycledMaterialPercentage"
            value={formData.sustainability.recycledMaterialPercentage}
            onChange={handleChange}
            min="0"
            max="100"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-eco-green focus:border-eco-green transition-colors"
          />
          <div className="mt-3 w-full bg-eco-beige-light rounded-md h-3">
            <div 
              className="bg-eco-green h-3 rounded-md transition-all duration-300" 
              style={{ width: `${formData.sustainability.recycledMaterialPercentage}%` }}
            ></div>
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-eco-green rounded-xl peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-eco-green"></div>
              <span className="ml-3 text-sm font-semibold text-gray-700">Active Status</span>
            </label>
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-eco-green transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm font-semibold text-white bg-eco-green hover:bg-eco-green-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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