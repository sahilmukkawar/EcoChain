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
          <div className="flex items-center text-sm text-green-600">
            <span className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full mr-2 animate-spin"></span>
            <span className="font-medium">Syncing...</span>
          </div>
        ) : pendingUpdatesCount > 0 ? (
          <div className="flex items-center text-sm text-amber-600">
            <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 shadow-sm">
              {pendingUpdatesCount}
            </span>
            <span className="font-medium">Pending</span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 mb-5 shadow-md border border-gray-100 relative">
      {showWebSocketStatus && (
        <div className={`flex items-center absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full transition-all duration-300 ${
          isWebSocketConnected() 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <span className={`w-2 h-2 rounded-full mr-1.5 ${
            isWebSocketConnected() 
              ? 'bg-green-500 shadow-[0_0_5px_rgba(76,175,80,0.7)] animate-pulse' 
              : 'bg-red-500'
          }`}></span>
          <span className="font-medium">
            {isWebSocketConnected() ? 'Real-time' : 'Offline'}
          </span>
        </div>
      )}
      <div className="sync-info">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">Data Synchronization</h4>
          {pendingUpdatesCount > 0 && (
            <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-sm">
              {pendingUpdatesCount}
            </span>
          )}
        </div>
        
        <div className="mb-5 space-y-3">
          <div className="flex items-center">
            <span className="w-32 text-gray-500 text-sm">Status:</span>
            <span className={`font-medium px-2.5 py-1 rounded-full text-sm ${
              isSyncing ? 'bg-green-100 text-green-800 animate-pulse' : 'bg-gray-100 text-gray-700'
            }`}>
              {isSyncing ? 'Syncing...' : 'Idle'}
            </span>
          </div>
          
          <div className="flex items-center">
            <span className="w-32 text-gray-500 text-sm">Last sync:</span>
            <span className="font-medium text-gray-700 text-sm">{formatLastSync()}</span>
          </div>
          
          {pendingUpdatesCount > 0 && (
            <div className="flex items-center">
              <span className="w-32 text-gray-500 text-sm">Pending updates:</span>
              <span className="font-medium text-amber-600 text-sm bg-amber-50 px-2.5 py-1 rounded-full">{pendingUpdatesCount}</span>
            </div>
          )}
        </div>
        
        {isSyncing && (
          <div className="h-2.5 bg-gray-100 rounded-full mb-5 relative overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-teal-400 rounded-full transition-all duration-300"
              style={{ width: `${syncProgress}%` }}
            ></div>
            <span className="absolute right-0 -top-6 text-xs font-medium text-gray-600">{syncProgress}%</span>
          </div>
        )}
        
        {syncError && (
          <div className="bg-red-50 border border-red-200 p-4 mb-5 rounded-lg flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <p className="text-red-700 text-sm font-medium">{syncError}</p>
            </div>
            <button 
              className="text-gray-600 text-xs px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
              onClick={clearSyncError}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
      
      {showControls && (
        <div className="flex justify-end mt-5">
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all shadow-sm ${
              isSyncing 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-500 to-teal-400 hover:from-green-600 hover:to-teal-500 text-white transform hover:-translate-y-0.5'
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