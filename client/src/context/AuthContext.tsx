import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { authAPI } from '../services/api';
import userDataCache from '../services/userDataCache';

interface User {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  profileImage?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  ecoWallet?: {
    currentBalance: number;
    totalEarned: number;
    totalSpent: number;
  };
  sustainabilityScore?: number;
  isEmailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string, role?: string, additionalInfo?: any) => Promise<{requiresEmailVerification?: boolean, requiresApplication?: boolean}>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  resendOTP: (email: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Logout function
  const logout = useCallback(() => {
    try {
      // Call logout endpoint to invalidate refresh token
      if (token) {
        authAPI.logout().catch(error => {
          console.error('Logout API error:', error);
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      userDataCache.clearCache(); // Clear the user data cache
      setUser(null);
      setToken(null);
      setRefreshToken(null);
    }
  }, [token]);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      
      if (storedToken && storedRefreshToken) {
        try {
          setToken(storedToken);
          setRefreshToken(storedRefreshToken);
          
          // Try to get current user with stored token using cache
          const userData = await userDataCache.getUserData();
          
          if (userData) {
            setUser(userData);
          } else {
            throw new Error('Failed to get user data');
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          // Clear invalid tokens and logout
          logout();
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, [logout]);

  // Refresh access token
  const refreshAccessToken = async () => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authAPI.refreshToken(storedRefreshToken);
      
      if (response.data.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        setToken(accessToken);
        setRefreshToken(newRefreshToken);
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // Get updated user data using cache
        const userData = await userDataCache.refreshUserData();
        if (userData) {
          setUser(userData);
        }
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      throw error;
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      
      if (response.data.success) {
        const { user: userData, tokens } = response.data.data;
        
        setUser(userData);
        setToken(tokens.accessToken);
        setRefreshToken(tokens.refreshToken);
        
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Your account is not authorized. Please contact support.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up function
  const register = async (name: string, email: string, password: string, phone?: string, role: string = 'user', additionalInfo?: any) => {
    setIsLoading(true);
    try {
      // Prepare the registration data
      const registrationData: any = { name, email, password, phone, role };
      
      // Add additional information for collectors and factories
      if (role === 'collector' && additionalInfo?.collectorData) {
        registrationData.collectorInfo = additionalInfo.collectorData;
      } else if (role === 'factory' && additionalInfo?.factoryData) {
        registrationData.factoryInfo = additionalInfo.factoryData;
      }
      
      const response = await authAPI.register(registrationData);
      
      if (response.data.success) {
        // For sign up that requires email verification
        if (response.data.data.requiresEmailVerification) {
          // Don't set user/token yet, they need to verify email first
          return { requiresEmailVerification: true };
        } else {
          // For immediate login (if any)
          const { user: userData, tokens } = response.data.data;
          
          setUser(userData);
          setToken(tokens.accessToken);
          setRefreshToken(tokens.refreshToken);
          
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          localStorage.setItem('user', JSON.stringify(userData));
          
          return { requiresEmailVerification: false };
        }
      } else {
        throw new Error(response.data.message || 'Sign up failed');
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      let errorMessage = 'Sign up failed. Please try again.';
      
      if (error.response?.status === 409) {
        errorMessage = 'An account with this email already exists.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid sign up data. Please check your information.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP function
  const verifyOTP = async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.verifyOTP({ email, otp });
      
      if (response.data.success) {
        const { user: userData, tokens } = response.data.data;
        
        setUser(userData);
        
        // Set tokens if they exist (for regular users)
        if (tokens) {
          setToken(tokens.accessToken);
          setRefreshToken(tokens.refreshToken);
          
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
        }
        
        localStorage.setItem('user', JSON.stringify(userData));
        
        // For factory and collector users, redirect to application form
        if ((userData.role === 'factory' || userData.role === 'collector') && !tokens) {
          // These users need to submit an application after email verification
          setTimeout(() => {
            window.location.href = userData.role === 'factory' 
              ? '/factory-application' 
              : '/collector-application';
          }, 100);
        }
      } else {
        throw new Error(response.data.message || 'OTP verification failed');
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      let errorMessage = 'OTP verification failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP function
  const resendOTP = async (email: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.resendOTP({ email });
      
      if (response.data.success) {
        // OTP resent successfully
        return;
      } else {
        throw new Error(response.data.message || 'Failed to resend OTP');
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      let errorMessage = 'Failed to resend OTP. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Update user data
  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    userDataCache.updateCachedData(userData); // Update the cache with new user data
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        verifyOTP,
        resendOTP,
        logout,
        refreshAccessToken,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};