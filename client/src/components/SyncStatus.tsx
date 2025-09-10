// client/src/components/SyncStatus.tsx
import React from 'react';
import { useSync } from '../contexts/SyncContext.tsx';
import './SyncStatus.css';

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
      <div className="sync-status-compact">
        {isSyncing ? (
          <div className="sync-indicator">
            <span className="sync-spinner"></span>
            <span className="sync-text">Syncing...</span>
          </div>
        ) : pendingUpdatesCount > 0 ? (
          <div className="sync-indicator pending">
            <span className="sync-badge">{pendingUpdatesCount}</span>
            <span className="sync-text">Pending</span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="sync-status">
      {showWebSocketStatus && (
        <div className={`websocket-status ${isWebSocketConnected() ? 'connected' : 'disconnected'}`}>
          <span className="websocket-indicator"></span>
          <span className="websocket-text">
            {isWebSocketConnected() ? 'Real-time' : 'Offline'}
          </span>
        </div>
      )}
      <div className="sync-info">
        <div className="sync-header">
          <h4>Data Synchronization</h4>
          {pendingUpdatesCount > 0 && (
            <span className="pending-badge">{pendingUpdatesCount}</span>
          )}
        </div>
        
        <div className="sync-details">
          <div className="sync-item">
            <span className="sync-label">Status:</span>
            <span className={`sync-value ${isSyncing ? 'syncing' : ''}`}>
              {isSyncing ? 'Syncing...' : 'Idle'}
            </span>
          </div>
          
          <div className="sync-item">
            <span className="sync-label">Last sync:</span>
            <span className="sync-value">{formatLastSync()}</span>
          </div>
          
          {pendingUpdatesCount > 0 && (
            <div className="sync-item">
              <span className="sync-label">Pending updates:</span>
              <span className="sync-value pending">{pendingUpdatesCount}</span>
            </div>
          )}
        </div>
        
        {isSyncing && (
          <div className="sync-progress">
            <div 
              className="sync-progress-bar" 
              style={{ width: `${syncProgress}%` }}
            ></div>
            <span className="sync-progress-text">{syncProgress}%</span>
          </div>
        )}
        
        {syncError && (
          <div className="sync-error">
            <p>{syncError}</p>
            <button 
              className="sync-error-dismiss" 
              onClick={clearSyncError}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
      
      {showControls && (
        <div className="sync-controls">
          <button 
            className="sync-button" 
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