// client/src/services/userDataCache.ts
import { authAPI } from './api';

interface User {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  profileImage?: string;
  ecoWallet?: {
    currentBalance: number;
    totalEarned: number;
    totalSpent: number;
  };
  sustainabilityScore?: number;
  [key: string]: any;
}

class UserDataCache {
  private userData: User | null = null;
  private lastFetchTime: number = 0;
  private fetchPromise: Promise<User | null> | null = null;
  private readonly cacheDuration: number = 10000; // 10 seconds cache duration
  private pendingRequests: Array<{
    resolve: (value: User | null) => void;
    reject: (reason?: any) => void;
  }> = [];

  /**
   * Get user data with caching
   * Returns cached data if available and not expired
   */
  public async getUserData(): Promise<User | null> {
    const now = Date.now();
    
    // If we have valid cached data, return it immediately
    if (this.userData && (now - this.lastFetchTime) < this.cacheDuration) {
      return this.userData;
    }
    
    // If there's already a fetch in progress, wait for it to complete
    if (this.fetchPromise) {
      return this.fetchPromise;
    }
    
    // Create a new promise for this fetch
    this.fetchPromise = new Promise<User | null>((resolve, reject) => {
      this.fetchUserData()
        .then(userData => {
          // Resolve all pending requests with the fetched data
          this.pendingRequests.forEach(request => request.resolve(userData));
          this.pendingRequests = [];
          resolve(userData);
        })
        .catch(error => {
          // Reject all pending requests with the error
          this.pendingRequests.forEach(request => request.reject(error));
          this.pendingRequests = [];
          reject(error);
        })
        .finally(() => {
          this.fetchPromise = null;
        });
    });
    
    return this.fetchPromise;
  }

  /**
   * Force refresh the user data cache
   */
  public async refreshUserData(): Promise<User | null> {
    this.userData = null;
    return this.getUserData();
  }

  /**
   * Update the cached user data without making an API call
   */
  public updateCachedData(userData: User): void {
    this.userData = userData;
    this.lastFetchTime = Date.now();
  }

  /**
   * Clear the cached user data
   */
  public clearCache(): void {
    this.userData = null;
    this.lastFetchTime = 0;
  }

  /**
   * Fetch user data from the API
   */
  private async fetchUserData(): Promise<User | null> {
    try {
      const response = await authAPI.getCurrentUser();
      if (response.data.success) {
        this.userData = response.data.data;
        this.lastFetchTime = Date.now();
        return this.userData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const userDataCache = new UserDataCache();
export default userDataCache;