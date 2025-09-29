// client/src/components/WebSocketStatusIndicator.tsx
import React from 'react';
import useWebSocketStatus from '../hooks/useWebSocketStatus';

interface WebSocketStatusIndicatorProps {
  showLabel?: boolean;
  showRetryButton?: boolean;
  className?: string;
}

const WebSocketStatusIndicator: React.FC<WebSocketStatusIndicatorProps> = ({
  showLabel = true,
  showRetryButton = true,
  className = ''
}) => {
  const { connectionStatus, retryCount, reconnect } = useWebSocketStatus();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'error':
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`w-3 h-3 rounded-full ${getStatusColor()} mr-2`}></div>
      {showLabel && (
        <span className="text-sm mr-2">
          {getStatusText()}
          {retryCount > 0 && ` (Retry: ${retryCount})`}
        </span>
      )}
      {showRetryButton && connectionStatus !== 'connected' && (
        <button
          onClick={reconnect}
          className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
        >
          Reconnect
        </button>
      )}
    </div>
  );
};

export default WebSocketStatusIndicator;