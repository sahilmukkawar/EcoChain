import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';

interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

export const useApiError = () => {
  const [error, setError] = useState<ApiError | null>(null);

  const handleError = useCallback((err: unknown) => {
    if (err instanceof AxiosError) {
      // Handle Axios errors
      const status = err.response?.status;
      const responseData = err.response?.data;
      
      setError({
        message: responseData?.message || err.message || 'An error occurred',
        status,
        details: responseData?.details || responseData
      });
    } else if (err instanceof Error) {
      // Handle regular JS errors
      setError({
        message: err.message || 'An error occurred'
      });
    } else {
      // Handle unknown errors
      setError({
        message: 'An unknown error occurred'
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
};