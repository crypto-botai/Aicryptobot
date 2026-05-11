import { io, type Socket } from 'socket.io-client';
import type { WSMessage, WSEventType } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001';

class WebSocketClient {
  private socket: Socket | null = null;
  private listeners = new Map<string, Set<(data: unknown) => void>>();
  private reconnectAttempts = 0;
  private maxReconnects = 10;

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: this.maxReconnects,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10_000,
    });

    this.socket.on('connect', () => {
      console.info('[WS] Connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[WS] Disconnected:', reason);
    });

    this.socket.onAny((event: string, message: WSMessage) => {
      const handlers = this.listeners.get(event);
      if (handlers) handlers.forEach((h) => h(message.data));
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  subscribe(event: WSEventType, handler: (data: unknown) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
    return () => this.listeners.get(event)?.delete(handler);
  }

  emit(event: string, data: unknown) {
    this.socket?.emit(event, data);
  }

  isConnected() {
    return this.socket?.connected ?? false;
  }

  subscribeTicker(symbols: string[]) {
    this.emit('subscribe.tickers', { symbols });
  }

  unsubscribeTicker(symbols: string[]) {
    this.emit('unsubscribe.tickers', { symbols });
  }
}

export const wsClient = new WebSocketClient();
