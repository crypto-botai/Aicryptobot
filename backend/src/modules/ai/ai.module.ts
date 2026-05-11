import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { TradeValidationEntity } from './entities/trade-validation.entity';
import { AiInsightEntity } from './entities/ai-insight.entity';
import { SentimentService } from './sentiment.service';
import { LearningService } from './learning.service';

@Module({
  imports: [TypeOrmModule.forFeature([TradeValidationEntity, AiInsightEntity])],
  controllers: [AiController],
  providers: [AiService, SentimentService, LearningService],
  exports: [AiService, SentimentService],
})
export class AiModule {}
