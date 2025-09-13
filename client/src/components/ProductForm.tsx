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
    <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
      <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="productInfo.name" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Product Name
          </label>
          <input
            type="text"
            id="productInfo.name"
            name="productInfo.name"
            value={formData.productInfo.name}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="productInfo.description" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Description
          </label>
          <textarea
            id="productInfo.description"
            name="productInfo.description"
            value={formData.productInfo.description}
            onChange={handleChange}
            required
            rows={4}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="productInfo.category" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Category
          </label>
          <select
            id="productInfo.category"
            name="productInfo.category"
            value={formData.productInfo.category}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
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
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Product Images
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            multiple
            accept="image/*"
            style={{ marginBottom: '8px' }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {imagePreviews.map((preview, index) => (
              <div key={index} style={{ position: 'relative' }}>
                <img 
                  src={preview} 
                  alt={`Preview ${index + 1}`} 
                  style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} 
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',

                    width: '20px',
                    height: '20px',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            {imagePreviews.length === 0 && (
              <div style={{ 
                width: '100px', 
                height: '100px', 
                border: '2px dashed #ccc', 
                borderRadius: '4px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#999'
              }}>
                No images
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label htmlFor="pricing.sellingPrice" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              EcoToken Price
            </label>
            <input
              type="number"
              id="pricing.sellingPrice"
              name="pricing.sellingPrice"
              value={formData.pricing.sellingPrice}
              onChange={handleChange}
              min="0"
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label htmlFor="pricing.costPrice" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Fiat Price (₹)
            </label>
            <input
              type="number"
              id="pricing.costPrice"
              name="pricing.costPrice"
              value={formData.pricing.costPrice}
              onChange={handleChange}
              min="0"
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="inventory.currentStock" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Available Stock
          </label>
          <input
            type="number"
            id="inventory.currentStock"
            name="inventory.currentStock"
            value={formData.inventory.currentStock}
            onChange={handleChange}
            min="0"
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="sustainability.recycledMaterialPercentage" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
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
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            <input
              type="checkbox"
              name="availability.isActive"
              checked={formData.availability.isActive}
              onChange={handleChange}
              style={{ marginRight: '8px' }}
            />
            Active Status
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{ padding: '10px 20px', backgroundColor: '#f5f5f5', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '10px 20px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {loading ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;