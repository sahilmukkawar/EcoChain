import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { authAPI } from '../services/api.ts';

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
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string, role?: string) => Promise<void>;
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

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      
      if (storedToken && storedRefreshToken) {
        try {
          setToken(storedToken);
          setRefreshToken(storedRefreshToken);
          
          // Try to get current user with stored token
          const response = await authAPI.getCurrentUser();
          
          if (response.data.success) {
            setUser(response.data.data);
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
  }, []);

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
        
        // Get updated user data
        const userResponse = await authAPI.getCurrentUser();
        if (userResponse.data.success) {
          setUser(userResponse.data.data);
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
      console.log('Attempting login for:', email);
      console.log('Current tokens before login:', {
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken')
      });
      
      const response = await authAPI.login({ email, password });
      
      if (response.data.success) {
        const { user: userData, tokens } = response.data.data;
        
        console.log('Login successful, setting tokens:', {
          accessToken: tokens.accessToken ? 'present' : 'missing',
          refreshToken: tokens.refreshToken ? 'present' : 'missing'
        });
        
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
      console.error('Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        url: error.config?.url
      });
      
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

  // Register function
  const register = async (name: string, email: string, password: string, phone?: string, role: string = 'user') => {
    setIsLoading(true);
    try {
      const response = await authAPI.register({ name, email, password, phone, role });
      
      if (response.data.success) {
        const { user: userData, tokens } = response.data.data;
        
        setUser(userData);
        setToken(tokens.accessToken);
        setRefreshToken(tokens.refreshToken);
        
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.status === 409) {
        errorMessage = 'An account with this email already exists.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid registration data. Please check your information.';
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

  // Update user function
  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Logout function
  const logout = () => {
    try {
      // Only call logout endpoint if we have a valid token
      if (token && token !== 'null' && token !== 'undefined') {
        authAPI.logout().catch(error => {
          console.error('Logout API error:', error);
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear auth-related data from localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Clear state
      setUser(null);
      setToken(null);
      setRefreshToken(null);
    }
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