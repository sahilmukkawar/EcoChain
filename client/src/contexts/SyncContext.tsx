// client/src/contexts/SyncContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import syncService from '../services/syncService';
import { isAuthenticated } from '../utils/auth';
import websocketService, { SyncMessage, NotificationMessage } from '../services/websocketService';

// Define the context shape
interface SyncContextType {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncProgress: number;
  pendingUpdatesCount: number;
  syncError: string | null;
  startSync: (options?: any) => Promise<any>;
  queueUpdate: (entityType: string, update: any) => void;
  clearSyncError: () => void;
  isWebSocketConnected: () => boolean;
}

// Create the context with default values
const SyncContext = createContext<SyncContextType>({
  isSyncing: false,
  lastSyncTime: null,
  syncProgress: 0,
  pendingUpdatesCount: 0,
  syncError: null,
  startSync: async () => ({}),
  queueUpdate: () => {},
  clearSyncError: () => {},
  isWebSocketConnected: () => false
});

// Custom hook to use the sync context
export const useSync = () => useContext(SyncContext);

// Provider component
export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [pendingUpdatesCount, setPendingUpdatesCount] = useState<number>(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Update pending updates count
  useEffect(() => {
    const updatePendingCount = () => {
      setPendingUpdatesCount(syncService.getPendingUpdatesCount());
    };
    
    // Initial count
    updatePendingCount();
    
    // Set up interval to check for pending updates
    const interval = setInterval(updatePendingCount, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Auto-sync when user is authenticated and there are pending updates
useEffect(() => {
  const autoSync = async () => {
    if (isAuthenticated() && syncService.hasPendingUpdates() && !isSyncing) {
      try {
        await startSync({ silent: true });
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }
  };
  
  // Run auto-sync on mount and when pendingUpdatesCount changes
  autoSync();
  
  // Connect to WebSocket for real-time updates
  if (isAuthenticated()) {
    connectWebSocket();
  }
}, [pendingUpdatesCount, isSyncing]);

// Connect to WebSocket and set up handlers
const connectWebSocket = async () => {
  try {
    await websocketService.connect();
    
    // Subscribe to entity types
    websocketService.subscribe(['users', 'collections', 'marketplace', 'transactions']);
    
    // Set up handler for sync messages
    websocketService.on('sync', (message: any) => {
      console.log('Received sync update:', message);
      
      // Update last sync time to reflect we have the latest data
      setLastSyncTime(new Date());
      
      // Trigger sync to refresh data
      setPendingUpdatesCount(syncService.getPendingUpdatesCount());
    });
    
    // Set up handler for notifications
    websocketService.on('notification', (message: any) => {
      // Handle notifications (could be expanded)
      console.log('Received notification:', message);
    });
    
    // Set up ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      if (websocketService.isConnectedToServer()) {
        websocketService.ping();
      }
    }, 30000); // 30 seconds
    
    // Clean up on unmount
    return () => {
      clearInterval(pingInterval);
      websocketService.disconnect();
    };
  } catch (error) {
    console.error('Failed to connect to WebSocket:', error);
  }
};
  
  // Start synchronization
  const startSync = async (options: any = {}) => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setSyncProgress(0);
    if (!options.silent) setSyncError(null);
    
    try {
      const result = await syncService.performSync({
        ...options,
        onProgress: (progress, entityType) => {
          setSyncProgress(progress);
        }
      });
      
      setLastSyncTime(new Date());
      setPendingUpdatesCount(syncService.getPendingUpdatesCount());
      
      if (!result.success) {
        setSyncError(result.error || 'Sync failed');
      }
      
      return result;
    } catch (error: any) {
      setSyncError(error.message || 'Sync failed');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Queue an update
  const queueUpdate = (entityType: string, update: any) => {
    syncService.queueUpdate(entityType, update);
    setPendingUpdatesCount(syncService.getPendingUpdatesCount());
  };
  
  // Clear sync error
  const clearSyncError = () => {
    setSyncError(null);
  };
  
  const value = {
    isSyncing,
    lastSyncTime,
    syncProgress,
    pendingUpdatesCount,
    syncError,
    startSync,
    queueUpdate,
    clearSyncError,
    isWebSocketConnected: websocketService.isConnectedToServer
  };
  
  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};