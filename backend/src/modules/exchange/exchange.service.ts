import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as ccxt from 'ccxt';
import * as crypto from 'crypto';
import { ExchangeConnectionEntity } from './exchange-connection.entity';

interface PlaceOrderParams {
  symbol: string;
  side: string;
  type: string;
  quantity: number;
  price?: number;
}

@Injectable()
export class ExchangeService {
  private readonly logger = new Logger(ExchangeService.name);
  private exchangeInstances = new Map<string, ccxt.Exchange>();

  constructor(
    @InjectRepository(ExchangeConnectionEntity) private connRepo: Repository<ExchangeConnectionEntity>,
    private configService: ConfigService,
  ) {}

  async addConnection(userId: string, dto: {
    exchangeId: string;
    apiKey: string;
    apiSecret: string;
    passphrase?: string;
    label?: string;
  }): Promise<ExchangeConnectionEntity> {
    const key = this.configService.get<string>('ENCRYPTION_KEY', '');
    const iv = this.configService.get<string>('ENCRYPTION_IV', '');

    const conn = this.connRepo.create({
      userId,
      exchangeId: dto.exchangeId,
      label: dto.label ?? dto.exchangeId,
      apiKeyEncrypted: this.encrypt(dto.apiKey, key, iv),
      apiSecretEncrypted: this.encrypt(dto.apiSecret, key, iv),
      passphraseEncrypted: dto.passphrase ? this.encrypt(dto.passphrase, key, iv) : undefined,
    });
    await this.connRepo.save(conn);

    // Verify credentials
    try {
      const exchange = await this.getExchange(conn.id, userId);
      await exchange.fetchBalance();
      await this.connRepo.update(conn.id, { isVerified: true, lastVerifiedAt: new Date() });
      conn.isVerified = true;
    } catch (err) {
      this.logger.warn(`Exchange verification failed for ${dto.exchangeId}: ${err}`);
    }

    return conn;
  }

  async getConnections(userId: string): Promise<Omit<ExchangeConnectionEntity, 'apiKeyEncrypted' | 'apiSecretEncrypted' | 'passphraseEncrypted'>[]> {
    const conns = await this.connRepo.find({ where: { userId, isActive: true } });
    return conns.map(({ apiKeyEncrypted, apiSecretEncrypted, passphraseEncrypted, ...safe }) => safe);
  }

  async getBalances(userId: string, connectionId: string): Promise<Record<string, unknown>> {
    const exchange = await this.getExchange(connectionId, userId);
    const balance = await exchange.fetchBalance();
    const nonZero: Record<string, unknown> = {};
    for (const [asset, info] of Object.entries(balance.total ?? {})) {
      if (info && (info as number) > 0) {
        nonZero[asset] = {
          free: balance.free?.[asset] ?? 0,
          locked: balance.used?.[asset] ?? 0,
          total: info,
        };
      }
    }
    return nonZero;
  }

  async deleteConnection(userId: string, connectionId: string): Promise<void> {
    const conn = await this.connRepo.findOne({ where: { id: connectionId, userId } });
    if (!conn) throw new NotFoundException('Exchange connection not found');
    await this.connRepo.update(connectionId, { isActive: false });
    this.exchangeInstances.delete(`${connectionId}:${userId}`);
  }

  async testConnection(userId: string, connectionId: string): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const start = Date.now();
    try {
      const exchange = await this.getExchange(connectionId, userId);
      await exchange.fetchBalance();
      const latencyMs = Date.now() - start;
      await this.connRepo.update(connectionId, { isVerified: true, lastVerifiedAt: new Date() });
      return { success: true, latencyMs, message: 'Connection verified successfully' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection test failed';
      return { success: false, latencyMs: Date.now() - start, message };
    }
  }

  async getCurrentPrice(exchangeId: string, symbol: string): Promise<number> {
    try {
      // Use public API (no auth needed)
      const ExchangeClass = ccxt[exchangeId as keyof typeof ccxt] as new () => ccxt.Exchange;
      if (!ExchangeClass) return 0;
      const exchange = new ExchangeClass();
      const ticker = await exchange.fetchTicker(symbol);
      return ticker.last ?? ticker.close ?? 0;
    } catch {
      return 0;
    }
  }

  async placeOrder(exchangeId: string, userId: string, params: PlaceOrderParams): Promise<ccxt.Order> {
    const conn = await this.connRepo.findOne({ where: { userId, exchangeId, isActive: true } });
    if (!conn) throw new NotFoundException(`No active connection for ${exchangeId}`);

    const exchange = await this.getExchange(conn.id, userId);
    return exchange.createOrder(params.symbol, params.type as ccxt.OrderType, params.side as ccxt.OrderSide, params.quantity, params.price);
  }

  private async getExchange(connectionId: string, userId: string): Promise<ccxt.Exchange> {
    const cacheKey = `${connectionId}:${userId}`;
    if (this.exchangeInstances.has(cacheKey)) return this.exchangeInstances.get(cacheKey)!;

    const conn = await this.connRepo.findOne({ where: { id: connectionId, userId } });
    if (!conn) throw new NotFoundException('Exchange connection not found');

    const key = this.configService.get<string>('ENCRYPTION_KEY', '');
    const iv = this.configService.get<string>('ENCRYPTION_IV', '');

    const ExchangeClass = ccxt[conn.exchangeId as keyof typeof ccxt] as new (config: Record<string, string>) => ccxt.Exchange;
    if (!ExchangeClass) throw new BadRequestException(`Exchange ${conn.exchangeId} not supported`);

    const exchange = new ExchangeClass({
      apiKey: this.decrypt(conn.apiKeyEncrypted, key, iv),
      secret: this.decrypt(conn.apiSecretEncrypted, key, iv),
      ...(conn.passphraseEncrypted ? { password: this.decrypt(conn.passphraseEncrypted, key, iv) } : {}),
    });
    exchange.enableRateLimit = true;
    this.exchangeInstances.set(cacheKey, exchange);
    return exchange;
  }

  private encrypt(text: string, key: string, iv: string): string {
    const paddedKey = Buffer.from(key.padEnd(32, '0').slice(0, 32));
    const paddedIv = Buffer.from(iv.padEnd(16, '0').slice(0, 16));
    const cipher = crypto.createCipheriv('aes-256-cbc', paddedKey, paddedIv);
    return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
  }

  private decrypt(ciphertext: string, key: string, iv: string): string {
    const paddedKey = Buffer.from(key.padEnd(32, '0').slice(0, 32));
    const paddedIv = Buffer.from(iv.padEnd(16, '0').slice(0, 16));
    const decipher = crypto.createDecipheriv('aes-256-cbc', paddedKey, paddedIv);
    return decipher.update(ciphertext, 'hex', 'utf8') + decipher.final('utf8');
  }
}
