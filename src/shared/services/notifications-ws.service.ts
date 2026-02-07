import { io, Socket } from 'socket.io-client';

/**
 * WebSocket Service for real-time notifications.
 * Manages connection, authentication, and event handling.
 */
class NotificationsWebSocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Set<(data: any) => void>> = new Map();

    /**
     * Connect to the WebSocket server.
     * Automatically uses JWT token from localStorage.
     */
    connect(): void {
        if (this.socket?.connected) {
            console.warn('[WebSocket] Already connected');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            console.error('[WebSocket] No token found. Cannot connect.');
            return;
        }

        const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

        this.socket = io(`${wsUrl}/notifications`, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
            console.log('[WebSocket] Connected:', this.socket?.id);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[WebSocket] Disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('[WebSocket] Connection error:', error.message);
        });

        // Re-attach all registered listeners
        this.listeners.forEach((callbacks, event) => {
            callbacks.forEach(callback => {
                this.socket?.on(event, callback);
            });
        });
    }

    /**
     * Disconnect from the WebSocket server.
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            console.log('[WebSocket] Disconnected manually');
        }
    }

    /**
     * Subscribe to a WebSocket event.
     * @param event - Event name (e.g., 'new_notification', 'ticket_overdue')
     * @param callback - Function to call when event is received
     */
    on(event: string, callback: (data: any) => void): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);

        if (this.socket?.connected) {
            this.socket.on(event, callback);
        }
    }

    /**
     * Unsubscribe from a WebSocket event.
     * @param event - Event name
     * @param callback - The same function reference used in `on()`
     */
    off(event: string, callback: (data: any) => void): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                this.listeners.delete(event);
            }
        }

        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    /**
     * Check if the socket is currently connected.
     */
    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

export const notificationsWs = new NotificationsWebSocketService();
