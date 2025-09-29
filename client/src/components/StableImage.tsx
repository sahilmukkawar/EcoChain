// client/src/components/StableImage.tsx
import React, { useState, useEffect } from 'react';
import { loadImageWithRetry, getImageWithFallback } from '../utils/imageUtils';

interface StableImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
  retryAttempts?: number;
  loadingPlaceholder?: React.ReactNode;
  errorPlaceholder?: React.ReactNode;
}

const StableImage: React.FC<StableImageProps> = ({
  src,
  fallbackSrc,
  retryAttempts = 3,
  loadingPlaceholder = <div className="bg-gray-200 animate-pulse rounded" />,
  errorPlaceholder = <div className="bg-gray-200 rounded flex items-center justify-center text-gray-500">
    Image not available
  </div>,
  alt = '',
  className = '',
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadImage = async () => {
      if (!src) {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
        return;
      }
      
      try {
        if (fallbackSrc) {
          // Try to load image with fallback
          const finalSrc = await getImageWithFallback(src, fallbackSrc);
          if (isMounted) {
            setImageSrc(finalSrc);
            setError(false);
          }
        } else {
          // Load image with retry mechanism
          await loadImageWithRetry(src, retryAttempts);
          if (isMounted) {
            setImageSrc(src);
            setError(false);
          }
        }
      } catch (err) {
        console.error('Failed to load image:', err);
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadImage();
    
    return () => {
      isMounted = false;
    };
  }, [src, fallbackSrc, retryAttempts]);

  if (loading) {
    return <div className={className}>{loadingPlaceholder}</div>;
  }
  
  if (error || !imageSrc) {
    return <div className={className}>{errorPlaceholder}</div>;
  }
  
  return (
    <img 
      src={imageSrc} 
      alt={alt} 
      className={className}
      {...props}
    />
  );
};

export default StableImage;