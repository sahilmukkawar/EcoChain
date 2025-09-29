// client/src/hooks/useWebSocketStatus.ts
import { useState, useEffect } from 'react';
import { useSync } from '../contexts/SyncContext';

/**
 * Custom hook to monitor and manage WebSocket connection status
 */
const useWebSocketStatus = () => {
  const { isWebSocketConnected, reconnectWebSocket } = useSync();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Check connection status periodically
    const interval = setInterval(() => {
      const connected = isWebSocketConnected();
      setIsConnected(connected);
      setConnectionStatus(connected ? 'connected' : 'disconnected');
    }, 5000); // Check every 5 seconds

    // Initial check
    const connected = isWebSocketConnected();
    setIsConnected(connected);
    setConnectionStatus(connected ? 'connected' : 'disconnected');

    return () => clearInterval(interval);
  }, [isWebSocketConnected]);

  const handleReconnect = async () => {
    setConnectionStatus('connecting');
    setRetryCount(prev => prev + 1);
    
    try {
      await reconnectWebSocket();
      const connected = isWebSocketConnected();
      setIsConnected(connected);
      setConnectionStatus(connected ? 'connected' : 'error');
    } catch (error) {
      console.error('Reconnection failed:', error);
      setConnectionStatus('error');
    }
  };

  return {
    isConnected,
    connectionStatus,
    retryCount,
    reconnect: handleReconnect
  };
};

export default useWebSocketStatus;