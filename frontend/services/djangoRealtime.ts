// Real-time WebSocket service for Django Channels
import { djangoAuthService } from './djangoAuth';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

class DjangoRealtimeService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private userId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isIntentiallyClosed = false;
  private isConnecting = false;

  connect = async () => {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;

    try {
      const user = await djangoAuthService.getCurrentUser();
      if (!user) {
        console.warn('Cannot connect: User not authenticated');
        return;
      }

      this.userId = user.id;
      const wsUrl = `${WS_BASE_URL}/ws/${this.userId}/`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ Connected to Django WebSocket');
        this.reconnectAttempts = 0;
        this.isIntentiallyClosed = false;
        this.isConnecting = false;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.emit(message.event, message.data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('❌ Disconnected from Django WebSocket');
        this.isConnecting = false;
        // Only attempt reconnect if this wasn't an intentional disconnect
        if (!this.isIntentiallyClosed) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.isConnecting = false;
    }
  };

  private attemptReconnect = () => {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  };

  disconnect = () => {
    this.isIntentiallyClosed = true;
    this.isConnecting = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    // Don't clear listeners on disconnect - let the component handle cleanup
    this.userId = null;
  };

  private emit = (event: string, data: any) => {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(data));
    }
  };

  on = (event: string, callback: Function) => {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  };

  off = (event: string, callback?: Function) => {
    if (!callback) {
      // Remove all listeners for this event if no callback provided
      this.listeners.delete(event);
      return;
    }
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  };

  isConnected = () => {
    return this.ws?.readyState === WebSocket.OPEN;
  };
}

export const djangoRealtimeService = new DjangoRealtimeService();
