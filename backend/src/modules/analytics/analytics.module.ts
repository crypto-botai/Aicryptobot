import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { OrderEntity } from '../trading/entities/order.entity';
import { PositionEntity } from '../trading/entities/position.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity, PositionEntity])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
