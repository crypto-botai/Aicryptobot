import { Module } from '@nestjs/common'; import { MarketController } from './market.controller'; import { MarketService } from './market.service'; import { ExchangeModule } from '../exchange/exchange.module';
@Module({ imports: [ExchangeModule], controllers: [MarketController], providers: [MarketService], exports: [MarketService] })
export class MarketModule {}
