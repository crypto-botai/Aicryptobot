import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MarketService } from './market.service';

@ApiTags('Market') @Controller('market')
export class MarketController {
  constructor(private marketService: MarketService) {}
  @Get('candles') getCandles(@Query('symbol') symbol: string, @Query('interval') interval = '1h', @Query('limit') limit = 500) { return this.marketService.getCandles(symbol, interval, +limit); }
  @Get('tickers') getTickers(@Query('symbols') symbols: string) { return this.marketService.getTickers(symbols?.split(',') ?? []); }
}
