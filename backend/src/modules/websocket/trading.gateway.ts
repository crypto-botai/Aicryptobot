import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/',
  transports: ['websocket'],
})
export class TradingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(TradingGateway.name);
  private userSocketMap = new Map<string, Set<string>>();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token ?? client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);

      const sockets = this.userSocketMap.get(payload.sub) ?? new Set();
      sockets.add(client.id);
      this.userSocketMap.set(payload.sub, sockets);

      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      const sockets = this.userSocketMap.get(userId);
      sockets?.delete(client.id);
      if (!sockets?.size) this.userSocketMap.delete(userId);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe.tickers')
  handleSubscribeTickers(@ConnectedSocket() client: Socket, @MessageBody() data: { symbols: string[] }) {
    data.symbols.forEach((s) => client.join(`ticker:${s}`));
    return { event: 'subscribed', data: { symbols: data.symbols } };
  }

  @SubscribeMessage('unsubscribe.tickers')
  handleUnsubscribeTickers(@ConnectedSocket() client: Socket, @MessageBody() data: { symbols: string[] }) {
    data.symbols.forEach((s) => client.leave(`ticker:${s}`));
  }

  // ── Emission helpers ────────────────────────────────────────────────────────

  emitTickerUpdate(symbol: string, ticker: Record<string, unknown>) {
    this.server.to(`ticker:${symbol}`).emit('ticker.update', {
      event: 'ticker.update',
      data: ticker,
      timestamp: Date.now(),
    });
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, {
      event,
      data,
      timestamp: Date.now(),
    });
  }

  emitOrderUpdate(userId: string, order: Record<string, unknown>) {
    this.emitToUser(userId, 'order.update', order);
  }

  emitTradeExecuted(userId: string, trade: Record<string, unknown>) {
    this.emitToUser(userId, 'trade.executed', trade);
  }

  emitAlert(userId: string, alert: Record<string, unknown>) {
    this.emitToUser(userId, 'alert.new', alert);
  }

  emitAiSignal(userId: string, signal: Record<string, unknown>) {
    this.emitToUser(userId, 'ai.signal', signal);
  }
}
