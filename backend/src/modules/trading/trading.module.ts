import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { TradingController } from './trading.controller';
import { TradingService } from './trading.service';
import { BotService } from './bot.service';
import { OrderEntity } from './entities/order.entity';
import { PositionEntity } from './entities/position.entity';
import { BotEntity } from './entities/bot.entity';
import { ExchangeModule } from '../exchange/exchange.module';
import { AiModule } from '../ai/ai.module';
import { RiskModule } from '../risk/risk.module';
import { TradingProcessor } from './trading.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, PositionEntity, BotEntity]),
    BullModule.registerQueue({ name: 'trading' }),
    ExchangeModule,
    AiModule,
    RiskModule,
  ],
  controllers: [TradingController],
  providers: [TradingService, BotService, TradingProcessor],
  exports: [TradingService, BotService],
})
export class TradingModule {}
