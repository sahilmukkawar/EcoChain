import api from './api.ts';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

const userService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Login failed');
  },

  // Register new user
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Registration failed');
  },

  // Get current user profile
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to get user data');
  },

  // Update user profile
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await api.put('/auth/profile', userData);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update profile');
  },

  // Logout (client-side only)
  logout: (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // Redirect to home page
    window.location.href = '/';
  },
};

export default userService;