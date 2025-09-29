// client/src/services/sseService.ts
import { getAuthToken } from '../utils/auth';

export interface SSEMessage {
  type: string;
  [key: string]: any;
}

export interface SyncMessage extends SSEMessage {
  type: 'sync';
  entityType: string;
  changeType: 'create' | 'update' | 'delete';
  timestamp: number;
  changes: any[];
}

export interface NotificationMessage extends SSEMessage {
  type: 'notification';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: number;
}

export type MessageHandler = (message: SSEMessage) => void;

class SSEService {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private entitySubscriptions: string[] = [];
  private isConnected = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private baseUrl: string;

  constructor() {
    // Determine base URL for SSE connection
    this.baseUrl = process.env.REACT_APP_API_BASE_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://ecochain-j1nj.onrender.com/api' 
        : '/api');
  }

  /**
   * Connect to the SSE endpoint
   * @returns Promise that resolves when connected or rejects on failure
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = getAuthToken();
      if (!token) {
        reject(new Error('Authentication required'));
        return;
      }

      // Clear any existing reconnect timeout
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      try {
        // Close existing connection if any
        if (this.eventSource) {
          this.eventSource.close();
        }

        // Construct URL with query parameters
        const url = new URL(`${this.baseUrl}/sse`);
        url.searchParams.append('token', token);
        
        // Add subscriptions if any
        if (this.entitySubscriptions.length > 0) {
          url.searchParams.append('entities', this.entitySubscriptions.join(','));
        }

        this.eventSource = new EventSource(url.toString());

        this.eventSource.onopen = () => {
          console.log('SSE connection established');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.eventSource.onerror = (error) => {
          console.error('SSE error:', error);
          this.isConnected = false;
          
          // Attempt to reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          } else {
            console.error('Max reconnect attempts reached for SSE');
            reject(new Error('Failed to establish SSE connection'));
          }
        };

        // Handle messages
        this.eventSource.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as SSEMessage;
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing SSE message:', error);
          }
        };
      } catch (error) {
        console.error('Error creating SSE connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the SSE endpoint
   */
  public disconnect(): void {
    // Clear reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to specific entity types for real-time updates
   * @param entityTypes Array of entity types to subscribe to
   */
  public subscribe(entityTypes: string[]): void {
    this.entitySubscriptions = [...this.entitySubscriptions, ...entityTypes];
    
    // If already connected, reconnect to update subscriptions
    if (this.isConnected) {
      this.disconnect();
      this.connect().catch(error => {
        console.error('Failed to reconnect after subscription change:', error);
      });
    }
  }

  /**
   * Register a handler for specific message types
   * @param messageType Type of message to handle
   * @param handler Function to call when message is received
   */
  public on(messageType: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set());
    }

    this.messageHandlers.get(messageType)?.add(handler);
  }

  /**
   * Remove a handler for a specific message type
   * @param messageType Type of message
   * @param handler Handler to remove
   */
  public off(messageType: string, handler: MessageHandler): void {
    if (this.messageHandlers.has(messageType)) {
      this.messageHandlers.get(messageType)?.delete(handler);
    }
  }

  /**
   * Check if the SSE is connected
   */
  public isConnectedToServer(): boolean {
    return this.isConnected && this.eventSource?.readyState === EventSource.OPEN;
  }

  /**
   * Handle incoming SSE messages
   * @param message The parsed message
   */
  private handleMessage(message: SSEMessage): void {
    // Call all handlers for this message type
    if (this.messageHandlers.has(message.type)) {
      this.messageHandlers.get(message.type)?.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in ${message.type} handler:`, error);
        }
      });
    }

    // Call all handlers for 'all' message type
    if (this.messageHandlers.has('all')) {
      this.messageHandlers.get('all')?.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in global message handler:', error);
        }
      });
    }
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    // Exponential backoff with max delay
    const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), this.maxReconnectDelay);

    console.log(`Scheduling SSE reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      console.log(`Attempting to reconnect SSE (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect().catch(error => {
        console.error('SSE reconnect failed:', error);

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          console.error('Max reconnect attempts reached for SSE, giving up');
        }
      });
    }, delay);
  }
}

// Create a singleton instance
const sseService = new SSEService();
export default sseService;