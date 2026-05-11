import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TradeValidationEntity } from './entities/trade-validation.entity';
import { AiInsightEntity } from './entities/ai-insight.entity';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class LearningService {
  private readonly logger = new Logger(LearningService.name);

  constructor(
    @InjectRepository(TradeValidationEntity) private validationRepo: Repository<TradeValidationEntity>,
    @InjectRepository(AiInsightEntity) private insightRepo: Repository<AiInsightEntity>,
    private configService: ConfigService,
  ) {}

  // Run learning cycle every 6 hours
  @Cron('0 */6 * * *')
  async runLearningCycle() {
    this.logger.log('Starting AI learning cycle...');
    try {
      const engineUrl = this.configService.get<string>('AI_ENGINE_URL', 'http://ai-engine:8000');
      const apiKey = this.configService.get<string>('AI_ENGINE_API_KEY');

      // Get recent completed validations with outcomes
      const completedValidations = await this.validationRepo.find({
        where: { tradeOutcome: In(['win', 'loss']) },
        take: 1000,
        order: { createdAt: 'DESC' },
      });

      if (completedValidations.length < 10) {
        this.logger.log('Insufficient data for learning cycle');
        return;
      }

      // Send to AI engine for model improvement
      await axios.post(`${engineUrl}/learning/update`, {
        validations: completedValidations,
        timestamp: new Date().toISOString(),
      }, { headers: { 'X-API-Key': apiKey }, timeout: 60_000 });

      this.logger.log(`Learning cycle complete: ${completedValidations.length} samples processed`);
    } catch (err) {
      this.logger.warn('Learning cycle failed (non-critical)', err);
    }
  }

  async recordTradeOutcome(validationId: string, outcome: 'win' | 'loss' | 'breakeven', pnl: number) {
    await this.validationRepo.update(validationId, {
      tradeOutcome: outcome,
      outcomePnl: pnl,
    });
  }

  async generateInsights(symbol: string, userId?: string): Promise<AiInsightEntity[]> {
    const engineUrl = this.configService.get<string>('AI_ENGINE_URL', 'http://ai-engine:8000');
    const apiKey = this.configService.get<string>('AI_ENGINE_API_KEY');

    try {
      const res = await axios.post<{ insights: Array<{ type: string; content: string; confidence: number }> }>(
        `${engineUrl}/insights/generate`,
        { symbol, userId },
        { headers: { 'X-API-Key': apiKey }, timeout: 15_000 }
      );

      const insights = await this.insightRepo.save(
        res.data.insights.map((i) => this.insightRepo.create({ ...i, symbol, userId }))
      );
      return insights;
    } catch {
      return [];
    }
  }
}
