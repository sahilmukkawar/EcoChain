/**
 * Utility functions for handling image URLs and processing
 */

/**
 * Resolves a server-hosted asset path (e.g. "/uploads/product-images/x.jpg")
 * into a URL the browser can actually fetch.
 *
 * Uploaded files are served from the API host's ROOT - see server.js, which
 * mounts express.static at "/uploads", NOT at "/api/uploads". So we take the
 * configured API base URL and strip a trailing "/api" to get the origin.
 *
 * This matters because the frontend and backend are separate Render services:
 * a bare "/uploads/..." path resolves against the FRONTEND origin, where the
 * SPA fallback returns index.html - an HTML document where an image was
 * expected, which fails silently rather than 404ing.
 *
 * In development REACT_APP_API_BASE_URL is "/api", so this yields a relative
 * "/uploads/..." path and CRA's dev proxy forwards it to the API server.
 */
export const assetUrl = (path?: string | null): string => {
  if (!path || typeof path !== 'string') return '';

  const cleanPath = path.trim();
  if (!cleanPath) return '';

  // Already absolute, or an inline/object URL - leave it alone
  if (/^(https?:)?\/\//i.test(cleanPath) || cleanPath.startsWith('data:') || cleanPath.startsWith('blob:')) {
    return cleanPath;
  }

  const origin = (process.env.REACT_APP_API_BASE_URL || '')
    .replace(/\/+$/, '')      // drop any trailing slash
    .replace(/\/api$/i, '');  // uploads live at the root, not under /api

  return `${origin}${cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath}`;
};

/**
 * Constructs a proper profile image URL with error handling
 * @param imagePath - The image path from the user profile
 * @returns Properly formatted image URL or null if invalid
 */
export const getProfileImageUrl = (imagePath?: string): string | null => {
  if (!imagePath || typeof imagePath !== 'string') return null;

  const cleanPath = imagePath.trim();
  if (!cleanPath) return null;

  // A bare filename means it lives in the profile-images folder
  const relative = cleanPath.includes('/') || cleanPath.includes('\\')
    ? cleanPath
    : `/uploads/profile-images/${cleanPath}`;

  return assetUrl(relative) || null;
};

/**
 * Validates image file type and size
 * @param file - The file to validate
 * @returns Object with validation result and error message
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Validate file type - be more specific about allowed types
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please select a valid image file (JPG, PNG, GIF, or WebP)'
    };
  }
  
  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return {
      isValid: false,
      error: 'Image size should be less than 2MB'
    };
  }

  return { isValid: true };
};

/**
 * Creates a preview URL for an image file
 * @param file - The image file
 * @returns Promise that resolves to the preview URL or rejects with error
 */
export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        resolve(result);
      } else {
        reject(new Error('Failed to read image file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Preloads an image to check if it's accessible
 * @param imageUrl - The image URL to preload
 * @returns Promise that resolves when image loads or rejects if it fails
 */
export const preloadImage = (imageUrl: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Add timestamp to prevent caching issues
    const urlWithTimestamp = `${imageUrl}?t=${Date.now()}`;
    
    img.onload = () => {
      resolve();
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };
    
    img.src = urlWithTimestamp;
  });
};

/**
 * Creates a stable image loader with retry mechanism
 * @param imageUrl - The image URL to load
 * @param maxRetries - Maximum number of retry attempts
 * @returns Promise that resolves when image loads or rejects if all retries fail
 */
export const loadImageWithRetry = (imageUrl: string, maxRetries = 3): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const tryLoad = () => {
      attempts++;
      const img = new Image();
      
      // Add timestamp to prevent caching issues
      const urlWithTimestamp = `${imageUrl}?t=${Date.now()}`;
      
      img.onload = () => {
        resolve(img);
      };
      
      img.onerror = () => {
        if (attempts < maxRetries) {
          // Wait before retrying (exponential backoff)
          setTimeout(tryLoad, Math.min(1000 * Math.pow(2, attempts), 5000));
        } else {
          reject(new Error(`Failed to load image after ${maxRetries} attempts: ${imageUrl}`));
        }
      };
      
      img.src = urlWithTimestamp;
    };
    
    tryLoad();
  });
};

/**
 * Creates a fallback image URL for when the primary image fails to load
 * @param imageUrl - The primary image URL
 * @param fallbackUrl - The fallback image URL
 * @returns Promise that resolves to the working image URL
 */
export const getImageWithFallback = async (imageUrl: string, fallbackUrl: string): Promise<string> => {
  try {
    await preloadImage(imageUrl);
    return imageUrl;
  } catch (error) {
    try {
      await preloadImage(fallbackUrl);
      return fallbackUrl;
    } catch (fallbackError) {
      throw new Error(`Both primary and fallback images failed to load`);
    }
  }
};