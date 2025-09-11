import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { authAPI } from '../services/api.ts';

interface User {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
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
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
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
      throw new Error(error.response?.data?.message || error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
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