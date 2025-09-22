// client/src/services/websocketService.ts
import { getAuthToken } from '../utils/auth';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface SyncMessage extends WebSocketMessage {
  type: 'sync';
  entityType: string;
  changeType: 'create' | 'update' | 'delete';
  timestamp: number;
  changes: any[];
}

export interface NotificationMessage extends WebSocketMessage {
  type: 'notification';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: number;
}

export type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private entitySubscriptions: string[] = [];
  private isConnected = false;
  private url: string;
  
  constructor() {
    // Use environment variable or default to localhost in development
    const baseUrl = process.env.REACT_APP_WS_URL || 
      (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + 
      window.location.host;
    
    this.url = `${baseUrl}/ws`;
  }
  
  /**
   * Connect to the WebSocket server
   * @returns Promise that resolves when connected or rejects on failure
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
        resolve();
        return;
      }
      
      const token = getAuthToken();
      if (!token) {
        reject(new Error('Authentication required'));
        return;
      }
      
      try {
        // Append token as query parameter
        const wsUrl = `${this.url}?token=${token}`;
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
          console.log('WebSocket connection established');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Resubscribe to entity types if reconnecting
          if (this.entitySubscriptions.length > 0) {
            this.subscribe(this.entitySubscriptions);
          }
          
          resolve();
        };
        
        this.socket.onclose = (event) => {
          this.isConnected = false;
          console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
          
          // Attempt to reconnect unless it was a authentication failure or manual close
          if (event.code !== 1008 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };
        
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (!this.isConnected) {
            reject(new Error('Failed to connect to sync service'));
          }
        };
        
        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage;
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.socket) {
      this.socket.close(1000, 'Client disconnecting');
      this.socket = null;
    }
    
    this.isConnected = false;
  }
  
  /**
   * Subscribe to specific entity types for real-time updates
   * @param entityTypes Array of entity types to subscribe to
   */
  public subscribe(entityTypes: string[]): void {
    if (!this.isConnected || !this.socket) {
      const combined = [...this.entitySubscriptions, ...entityTypes];
      this.entitySubscriptions = Array.from(new Set(combined));
      return;
    }
    
    const combined = [...this.entitySubscriptions, ...entityTypes];
    this.entitySubscriptions = Array.from(new Set(combined));
    
    this.socket.send(JSON.stringify({
      type: 'subscribe',
      entityTypes: this.entitySubscriptions
    }));
  }
  
  /**
   * Send a ping to keep the connection alive
   */
  public ping(): void {
    if (this.isConnected && this.socket) {
      this.socket.send(JSON.stringify({
        type: 'ping',
        timestamp: Date.now()
      }));
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
   * Check if the WebSocket is connected
   */
  public isConnectedToServer(): boolean {
    return this.isConnected && this.socket?.readyState === WebSocket.OPEN;
  }
  
  /**
   * Handle incoming WebSocket messages
   * @param message The parsed message
   */
  private handleMessage(message: WebSocketMessage): void {
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
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect().catch(error => {
        console.error('Reconnect failed:', error);
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          console.error('Max reconnect attempts reached, giving up');
        }
      });
    }, delay);
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();
export default websocketService;