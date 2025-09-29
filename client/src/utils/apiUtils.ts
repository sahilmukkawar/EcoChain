// client/src/utils/apiUtils.ts
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { getProfileImageUrl, preloadImage } from './imageUtils';

/**
 * Retry an API call with exponential backoff
 * @param apiCall - The API call function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param baseDelay - Base delay in milliseconds
 * @returns Promise that resolves with the API response or rejects with an error
 */
export async function retryApiCall<T>(
  apiCall: () => Promise<AxiosResponse<T>>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<AxiosResponse<T>> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await apiCall();
      return response;
    } catch (error) {
      lastError = error;
      
      // Don't retry on 4xx errors (client errors)
      if (axios.isAxiosError(error) && error.response?.status && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`API call failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Create an axios instance with default configuration for API calls
 * @returns Configured axios instance
 */
export function createApiInstance() {
  const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
  
  const instance = axios.create({
    baseURL,
    timeout: 30000, // 30 second timeout
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  // Add request interceptor to include auth token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  
  // Add response interceptor to handle common errors
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else if (error.response?.status === 500) {
          console.error('Server error:', error.response.data);
        }
      }
      return Promise.reject(error);
    }
  );
  
  return instance;
}

/**
 * Check if the API is reachable
 * @param url - The API URL to check
 * @returns Promise that resolves if API is reachable, rejects otherwise
 */
export async function checkApiHealth(url: string): Promise<boolean> {
  try {
    await axios.get(url, { timeout: 5000 });
    return true;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}

/**
 * Preload an image with retry mechanism
 * @param imageUrl - The image URL to preload
 * @param maxRetries - Maximum number of retry attempts
 * @returns Promise that resolves when image loads or rejects if all retries fail
 */
export async function preloadImageWithRetry(imageUrl: string, maxRetries: number = 3): Promise<void> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await preloadImage(imageUrl);
      return;
    } catch (error) {
      lastError = error;
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      console.log(`Image preload failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}