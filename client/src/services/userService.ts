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
    const response = await api.post<AuthResponse>('/users/login', credentials);
    return response.data;
  },

  // Register new user
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/users/register', userData);
    return response.data;
  },

  // Get current user profile
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/users/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await api.put<User>('/users/profile', userData);
    return response.data;
  },

  // Logout (client-side only)
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to home page
    window.location.href = '/';
  },
};

export default userService;