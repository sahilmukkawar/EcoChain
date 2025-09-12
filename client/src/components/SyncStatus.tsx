// client/src/components/SyncStatus.tsx
import React from 'react';
import { useSync } from '../contexts/SyncContext';

interface SyncStatusProps {
  showControls?: boolean;
  compact?: boolean;
  showWebSocketStatus?: boolean;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ 
  showControls = true,
  compact = false,
  showWebSocketStatus = true
}) => {
  const { 
    isSyncing, 
    lastSyncTime, 
    syncProgress, 
    pendingUpdatesCount,
    syncError,
    startSync,
    clearSyncError,
    isWebSocketConnected
  } = useSync();

  const handleSyncClick = async () => {
    try {
      await startSync();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  // Format the last sync time
  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    
    // Less than a minute
    if (diff < 60000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    // Format as date
    return lastSyncTime.toLocaleString();
  };

  if (compact) {
    return (
      <div className="inline-flex items-center">
        {isSyncing ? (
          <div className="flex items-center text-sm text-blue-500">
            <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full mr-2 animate-spin"></span>
            <span className="font-medium">Syncing...</span>
          </div>
        ) : pendingUpdatesCount > 0 ? (
          <div className="flex items-center text-sm text-red-500">
            <span className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold mr-2">
              {pendingUpdatesCount}
            </span>
            <span className="font-medium">Pending</span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-5 shadow-sm relative">
      {showWebSocketStatus && (
        <div className={`flex items-center absolute top-2.5 right-2.5 text-xs px-2 py-1 rounded-full ${
          isWebSocketConnected() 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          <span className={`w-2 h-2 rounded-full mr-1.5 ${
            isWebSocketConnected() 
              ? 'bg-green-500 shadow-[0_0_5px_rgba(76,175,80,0.7)] animate-pulse' 
              : 'bg-red-500'
          }`}></span>
          <span>
            {isWebSocketConnected() ? 'Real-time' : 'Offline'}
          </span>
        </div>
      )}
      <div className="sync-info">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-base font-semibold text-gray-800">Data Synchronization</h4>
          {pendingUpdatesCount > 0 && (
            <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {pendingUpdatesCount}
            </span>
          )}
        </div>
        
        <div className="mb-4">
          <div className="flex mb-2 text-sm">
            <span className="w-32 text-gray-600">Status:</span>
            <span className={`font-medium ${
              isSyncing ? 'text-blue-500 animate-pulse' : 'text-gray-800'
            }`}>
              {isSyncing ? 'Syncing...' : 'Idle'}
            </span>
          </div>
          
          <div className="flex mb-2 text-sm">
            <span className="w-32 text-gray-600">Last sync:</span>
            <span className="font-medium text-gray-800">{formatLastSync()}</span>
          </div>
          
          {pendingUpdatesCount > 0 && (
            <div className="flex text-sm">
              <span className="w-32 text-gray-600">Pending updates:</span>
              <span className="font-medium text-red-500">{pendingUpdatesCount}</span>
            </div>
          )}
        </div>
        
        {isSyncing && (
          <div className="h-2 bg-gray-200 rounded mb-4 relative overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded transition-all duration-300"
              style={{ width: `${syncProgress}%` }}
            ></div>
            <span className="absolute right-2 -top-5 text-xs text-gray-600">{syncProgress}%</span>
          </div>
        )}
        
        {syncError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded flex justify-between items-center">
            <p className="text-red-700 text-sm">{syncError}</p>
            <button 
              className="text-gray-600 text-xs underline hover:text-gray-800"
              onClick={clearSyncError}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
      
      {showControls && (
        <div className="flex justify-end mt-4">
          <button 
            className={`px-4 py-2 text-sm rounded transition-colors ${
              isSyncing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            onClick={handleSyncClick}
            disabled={isSyncing}
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SyncStatus;