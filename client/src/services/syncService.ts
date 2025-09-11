// client/src/services/syncService.ts
import axios from 'axios';
import { getAuthToken } from '../utils/auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Interface for sync options
interface SyncOptions {
  forceFullSync?: boolean;
  entityTypes?: string[];
  onProgress?: (progress: number, entityType: string) => void;
}

// Interface for sync result
interface SyncResult {
  success: boolean;
  syncedEntities: {
    [entityType: string]: {
      added: number;
      updated: number;
      deleted: number;
      errors: number;
    };
  };
  timestamp: number;
  error?: string;
}

// Interface for entity update
interface EntityUpdate {
  id?: string;
  operation: 'create' | 'update' | 'delete';
  data?: any;
}

// Local storage keys
const LAST_SYNC_KEY = 'ecochain_last_sync';
const PENDING_UPDATES_KEY = 'ecochain_pending_updates';

/**
 * Service for handling data synchronization between frontend and backend
 */
class SyncService {
  private lastSyncTimestamps: { [entityType: string]: number } = {};
  private pendingUpdates: { [entityType: string]: EntityUpdate[] } = {};
  private isSyncing: boolean = false;
  
  constructor() {
    this.loadSyncState();
  }
  
  /**
   * Load sync state from local storage
   */
  private loadSyncState(): void {
    try {
      // Load last sync timestamps
      const lastSyncJson = localStorage.getItem(LAST_SYNC_KEY);
      if (lastSyncJson) {
        this.lastSyncTimestamps = JSON.parse(lastSyncJson);
      }
      
      // Load pending updates
      const pendingUpdatesJson = localStorage.getItem(PENDING_UPDATES_KEY);
      if (pendingUpdatesJson) {
        this.pendingUpdates = JSON.parse(pendingUpdatesJson);
      }
    } catch (error) {
      console.error('Error loading sync state:', error);
      // Reset state if there's an error
      this.lastSyncTimestamps = {};
      this.pendingUpdates = {};
    }
  }
  
  /**
   * Save sync state to local storage
   */
  private saveSyncState(): void {
    try {
      localStorage.setItem(LAST_SYNC_KEY, JSON.stringify(this.lastSyncTimestamps));
      localStorage.setItem(PENDING_UPDATES_KEY, JSON.stringify(this.pendingUpdates));
    } catch (error) {
      console.error('Error saving sync state:', error);
    }
  }
  
  /**
   * Get the latest data for a specific entity type
   */
  async getLatestData(entityType: string): Promise<any[]> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const lastSyncTimestamp = this.lastSyncTimestamps[entityType] || 0;
      
      const response = await axios.get(`${API_URL}/sync/${entityType}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          lastSyncTimestamp
        }
      });
      
      if (response.data.success) {
        // Update last sync timestamp
        this.lastSyncTimestamps[entityType] = response.data.syncTimestamp;
        this.saveSyncState();
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get latest data');
      }
    } catch (error) {
      console.error(`Error getting latest data for ${entityType}:`, error);
      throw error;
    }
  }
  
  /**
   * Queue an update to be synced with the server
   */
  queueUpdate(entityType: string, update: EntityUpdate): void {
    if (!this.pendingUpdates[entityType]) {
      this.pendingUpdates[entityType] = [];
    }
    
    this.pendingUpdates[entityType].push(update);
    this.saveSyncState();
  }
  
  /**
   * Push pending updates to the server
   */
  async pushUpdates(entityType: string): Promise<any> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const updates = this.pendingUpdates[entityType] || [];
      if (updates.length === 0) {
        return { success: true, results: [] };
      }
      
      const response = await axios.post(`${API_URL}/sync/${entityType}`, {
        updates
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        // Clear pending updates that were successfully processed
        const successfulIds = response.data.results
          .filter((result: any) => result.success)
          .map((result: any) => result.id);
        
        this.pendingUpdates[entityType] = updates.filter(update => 
          update.id && !successfulIds.includes(update.id)
        );
        
        // Update last sync timestamp
        this.lastSyncTimestamps[entityType] = response.data.syncTimestamp;
        this.saveSyncState();
        
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to push updates');
      }
    } catch (error) {
      console.error(`Error pushing updates for ${entityType}:`, error);
      throw error;
    }
  }
  
  /**
   * Get sync status and statistics
   */
  async getSyncStatus(): Promise<any> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get(`${API_URL}/sync/status`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting sync status:', error);
      throw error;
    }
  }
  
  /**
   * Perform a full synchronization
   */
  async performSync(options: SyncOptions = {}): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        syncedEntities: {},
        timestamp: Date.now(),
        error: 'Sync already in progress'
      };
    }
    
    this.isSyncing = true;
    
    try {
      const entityTypes = options.entityTypes || ['users', 'collections', 'marketplace', 'transactions'];
      const result: SyncResult = {
        success: true,
        syncedEntities: {},
        timestamp: Date.now()
      };
      
      // Process each entity type
      for (let i = 0; i < entityTypes.length; i++) {
        const entityType = entityTypes[i];
        const progress = Math.round(((i + 1) / entityTypes.length) * 100);
        
        // Initialize entity result
        result.syncedEntities[entityType] = {
          added: 0,
          updated: 0,
          deleted: 0,
          errors: 0
        };
        
        try {
          // Push pending updates first
          const pushResult = await this.pushUpdates(entityType);
          
          // Then get latest data
          const latestData = await this.getLatestData(entityType);
          
          // Update result statistics
          if (pushResult && pushResult.results) {
            pushResult.results.forEach((item: any) => {
              if (item.success) {
                if (item.operation === 'create') result.syncedEntities[entityType].added++;
                else if (item.operation === 'update') result.syncedEntities[entityType].updated++;
                else if (item.operation === 'delete') result.syncedEntities[entityType].deleted++;
              } else {
                result.syncedEntities[entityType].errors++;
              }
            });
          }
          
          // Call progress callback if provided
          if (options.onProgress) {
            options.onProgress(progress, entityType);
          }
        } catch (error) {
          console.error(`Error syncing ${entityType}:`, error);
          result.syncedEntities[entityType].errors++;
          result.success = false;
          result.error = `Error syncing ${entityType}: ${error.message}`;
        }
      }
      
      return result;
    } finally {
      this.isSyncing = false;
    }
  }
  
  /**
   * Check if there are pending updates
   */
  hasPendingUpdates(): boolean {
    return Object.values(this.pendingUpdates).some(updates => updates.length > 0);
  }
  
  /**
   * Get the count of pending updates
   */
  getPendingUpdatesCount(): number {
    return Object.values(this.pendingUpdates).reduce(
      (total, updates) => total + updates.length, 0
    );
  }
  
  /**
   * Clear all sync data (for logout)
   */
  clearSyncData(): void {
    this.lastSyncTimestamps = {};
    this.pendingUpdates = {};
    localStorage.removeItem(LAST_SYNC_KEY);
    localStorage.removeItem(PENDING_UPDATES_KEY);
  }
}

// Create and export a singleton instance
const syncService = new SyncService();
export default syncService;