import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { OrderEntity } from './entities/order.entity';
import { PositionEntity } from './entities/position.entity';
import { ExchangeService } from '../exchange/exchange.service';
import { AiService, ValidationResult } from '../ai/ai.service';
import { RiskService } from '../risk/risk.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class TradingService {
  private readonly logger = new Logger(TradingService.name);

  constructor(
    @InjectRepository(OrderEntity) private orderRepo: Repository<OrderEntity>,
    @InjectRepository(PositionEntity) private positionRepo: Repository<PositionEntity>,
    @InjectQueue('trading') private tradingQueue: Queue,
    private exchangeService: ExchangeService,
    private aiService: AiService,
    private riskService: RiskService,
    private alertsService: AlertsService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto): Promise<OrderEntity> {
    // Risk check first
    const riskCheck = await this.riskService.checkOrder(userId, dto);
    if (!riskCheck.allowed) {
      throw new BadRequestException(`Risk limit exceeded: ${riskCheck.reason}`);
    }

    // AI validation (if enabled)
    let aiValidation: ValidationResult | undefined;
    if (dto.useAiValidation !== false) {
      aiValidation = await this.aiService.validateTrade({
        symbol: dto.symbol,
        side: dto.side,
        type: dto.type,
        quantity: dto.quantity,
        price: dto.price,
        stopLoss: dto.stopLoss,
        takeProfit: dto.takeProfit,
      });

      const confidence = aiValidation.overallConfidence ?? 0;
      if (confidence < (dto.aiConfidenceThreshold ?? 0.7) && !dto.overrideAI) {
        throw new BadRequestException(
          `AI confidence too low (${Math.round(confidence * 100)}%). Use overrideAI=true to force.`
        );
      }
    }

    const clientOrderId = `CB-${uuidv4().split('-')[0].toUpperCase()}`;
    const order = this.orderRepo.create({
      clientOrderId,
      userId,
      botId: dto.botId,
      exchangeId: dto.exchangeId,
      symbol: dto.symbol,
      side: dto.side,
      type: dto.type,
      price: dto.price ?? 0,
      quantity: dto.quantity,
      mode: dto.mode ?? 'paper',
      aiValidation: aiValidation as unknown as Record<string, unknown>,
    });
    await this.orderRepo.save(order);

    // Queue for execution
    await this.tradingQueue.add('execute-order', { orderId: order.id, userId, dto }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });

    this.logger.log(`Order queued: ${order.id} ${dto.side} ${dto.quantity} ${dto.symbol}`);
    return order;
  }

  async getOrders(userId: string, filters: {
    status?: string;
    symbol?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<OrderEntity[]> {
    const qb = this.orderRepo.createQueryBuilder('o')
      .where('o.userId = :userId', { userId })
      .orderBy('o.createdAt', 'DESC')
      .take(filters.limit ?? 50)
      .skip(filters.offset ?? 0);

    if (filters.status) qb.andWhere('o.status = :status', { status: filters.status });
    if (filters.symbol) qb.andWhere('o.symbol = :symbol', { symbol: filters.symbol });
    return qb.getMany();
  }

  async getPositions(userId: string, status = 'open'): Promise<PositionEntity[]> {
    return this.positionRepo.find({
      where: { userId, status } as Partial<PositionEntity>,
      order: { createdAt: 'DESC' },
    });
  }

  async closePosition(userId: string, positionId: string): Promise<PositionEntity> {
    const position = await this.positionRepo.findOne({ where: { id: positionId, userId, status: 'open' } });
    if (!position) throw new NotFoundException('Position not found');

    await this.tradingQueue.add('close-position', { positionId, userId }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 500 },
    });
    return position;
  }
}
