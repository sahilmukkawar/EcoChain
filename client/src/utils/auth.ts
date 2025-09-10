// client/src/utils/auth.ts

/**
 * Get the authentication token from local storage
 * @returns The authentication token or null if not found
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Set the authentication token in local storage
 * @param token The token to store
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem('token', token);
};

/**
 * Remove the authentication token from local storage
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem('token');
};

/**
 * Check if the user is authenticated
 * @returns True if the user is authenticated, false otherwise
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

/**
 * Get the current user from local storage
 * @returns The user object or null if not found
 */
export const getCurrentUser = (): any | null => {
  const userJson = localStorage.getItem('user');
  return userJson ? JSON.parse(userJson) : null;
};

/**
 * Set the current user in local storage
 * @param user The user object to store
 */
export const setCurrentUser = (user: any): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Remove the current user from local storage
 */
export const removeCurrentUser = (): void => {
  localStorage.removeItem('user');
};

/**
 * Get the current user's role from local storage
 * @returns The role string or null if not available
 */
export const getUserRole = (): string | null => {
  const user = getCurrentUser();
  return user?.role || null;
};