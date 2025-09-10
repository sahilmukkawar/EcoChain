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
    const response = await api.post<any>('/auth/login', credentials);
    const data = response.data?.data || response.data;
    return {
      token: data.tokens?.accessToken || data.token,
      user: data.user,
    } as AuthResponse;
  },

  // Register new user
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<any>('/auth/register', userData);
    const data = response.data?.data || response.data;
    return {
      token: data.tokens?.accessToken || data.token,
      user: data.user,
    } as AuthResponse;
  },

  // Get current user profile
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<any>('/auth/me');
    const data = response.data?.data || response.data;
    return data as User;
  },

  // Update user profile
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await api.put<any>('/auth/profile', userData);
    const data = response.data?.data || response.data;
    return data as User;
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