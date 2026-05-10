import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../trading/entities/order.entity';

@Injectable()
export class AnalyticsService {
  constructor(@InjectRepository(OrderEntity) private orderRepo: Repository<OrderEntity>) {}

  async getPerformance(userId: string, period = '30d') {
    return { period, totalReturn: 0, winRate: 0, sharpeRatio: 0, sortinoRatio: 0, maxDrawdown: 0, profitFactor: 0, totalTrades: 0, avgTradeReturn: 0, bestTrade: 0, worstTrade: 0, avgHoldingTime: 0 };
  }

  async getEquityCurve(userId: string, period = '30d') {
    const now = Date.now();
    const days = period === '30d' ? 30 : period === '7d' ? 7 : 90;
    return Array.from({ length: days }, (_, i) => ({
      time: Math.floor((now - (days - i) * 86400000) / 1000),
      value: 10000 + Math.random() * 2000 - 1000 + i * 50,
    }));
  }
}
