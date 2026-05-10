import { Injectable } from '@nestjs/common';
import { ExchangeService } from '../exchange/exchange.service';

@Injectable()
export class PortfolioService {
  constructor(private exchangeService: ExchangeService) {}

  async getSnapshot(userId: string) {
    return {
      totalValue: 0,
      totalPnL: 0,
      totalPnLPercent: 0,
      dayPnL: 0,
      dayPnLPercent: 0,
      breakdown: [],
      timestamp: new Date().toISOString(),
    };
  }
}
