// client/src/utils/auth.ts

// Constants
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/**
 * Set authentication token in local storage
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Get authentication token from local storage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Remove authentication token from local storage
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Set user data in local storage
 */
export const setUserData = (user: any): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Get user data from local storage
 */
export const getUserData = (): any | null => {
  const userData = localStorage.getItem(USER_KEY);
  return userData ? JSON.parse(userData) : null;
};

/**
 * Remove user data from local storage
 */
export const removeUserData = (): void => {
  localStorage.removeItem(USER_KEY);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

/**
 * Logout user by removing all auth data
 */
export const logout = (): void => {
  removeAuthToken();
  removeUserData();
  // Additional cleanup can be added here
};

/**
 * Parse JWT token to get payload
 */
export const parseJwt = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = parseJwt(token);
    if (!decoded || !decoded.exp) return true;
    
    // Check if expiration timestamp is in the past
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

/**
 * Get user role from token
 */
export const getUserRole = (): string | null => {
  const token = getAuthToken();
  if (!token) return null;
  
  try {
    const decoded = parseJwt(token);
    return decoded?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};