import { Injectable } from '@nestjs/common'; import { ExchangeService } from '../exchange/exchange.service';
@Injectable()
export class MarketService {
  constructor(private exchangeService: ExchangeService) {}
  async getCandles(symbol: string, interval: string, limit = 500) {
    return Array.from({ length: limit }, (_, i) => {
      const t = Math.floor(Date.now() / 1000) - (limit - i) * 60;
      const base = 50000 + Math.random() * 5000;
      return { time: t, open: base, high: base * 1.01, low: base * 0.99, close: base + (Math.random() - 0.5) * 500, volume: Math.random() * 100 };
    });
  }
  async getTickers(symbols: string[]) { return symbols.map(s => ({ symbol: s, price: 50000 + Math.random() * 1000, change24h: (Math.random() - 0.5) * 200, changePercent24h: (Math.random() - 0.5) * 4, high24h: 52000, low24h: 48000, volume24h: 1000000 })); }
}
