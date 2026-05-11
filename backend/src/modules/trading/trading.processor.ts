import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from './entities/order.entity';
import { PositionEntity } from './entities/position.entity';
import { ExchangeService } from '../exchange/exchange.service';

@Processor('trading')
export class TradingProcessor {
  private readonly logger = new Logger(TradingProcessor.name);

  constructor(
    @InjectRepository(OrderEntity) private orderRepo: Repository<OrderEntity>,
    @InjectRepository(PositionEntity) private positionRepo: Repository<PositionEntity>,
    private exchangeService: ExchangeService,
  ) {}

  @Process('execute-order')
  async handleExecuteOrder(job: Job<{ orderId: string; userId: string; dto: Record<string, unknown> }>) {
    const { orderId, dto } = job.data;
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) return;

    try {
      if (order.mode === 'paper') {
        // Paper trading — simulate fill
        const fillPrice = await this.exchangeService.getCurrentPrice(order.exchangeId, order.symbol);
        await this.orderRepo.update(orderId, {
          status: 'filled',
          exchangeOrderId: `PAPER-${Date.now()}`,
          filledQuantity: order.quantity,
          avgFillPrice: fillPrice,
          feeCurrency: 'USDT',
          fee: order.quantity * fillPrice * 0.001,
        });
        this.logger.log(`Paper order filled: ${orderId} at ${fillPrice}`);
      } else {
        // Live trading via ccxt
        const result = await this.exchangeService.placeOrder(order.exchangeId, order.userId, {
          symbol: order.symbol,
          side: order.side,
          type: order.type,
          quantity: order.quantity,
          price: order.price,
        });
        await this.orderRepo.update(orderId, {
          status: result.filled > 0 ? 'filled' : 'open',
          exchangeOrderId: result.id,
          filledQuantity: result.filled,
          avgFillPrice: result.average,
          fee: result.fee?.cost ?? 0,
          feeCurrency: result.fee?.currency,
        });
      }
    } catch (err) {
      this.logger.error(`Order execution failed: ${orderId}`, err);
      await this.orderRepo.update(orderId, { status: 'rejected' });
      throw err;
    }
  }

  @Process('close-position')
  async handleClosePosition(job: Job<{ positionId: string; userId: string }>) {
    const { positionId } = job.data;
    const position = await this.positionRepo.findOne({ where: { id: positionId } });
    if (!position) return;

    const currentPrice = await this.exchangeService.getCurrentPrice(position.exchangeId, position.symbol);
    const pnl = position.side === 'long'
      ? (currentPrice - position.entryPrice) * position.size
      : (position.entryPrice - currentPrice) * position.size;

    await this.positionRepo.update(positionId, {
      status: 'closed',
      closedAt: new Date(),
      closedPnl: pnl,
      markPrice: currentPrice,
    });
    this.logger.log(`Position closed: ${positionId} PnL: ${pnl.toFixed(2)}`);
  }
}
