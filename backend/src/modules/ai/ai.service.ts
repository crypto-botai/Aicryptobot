import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TradeValidationEntity } from './entities/trade-validation.entity';
import { AiInsightEntity } from './entities/ai-insight.entity';

interface TradeContext {
  symbol: string;
  side: string;
  type: string;
  quantity: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  marketData?: Record<string, unknown>;
}

interface ValidationResult {
  approved: boolean;
  overallConfidence: number;
  validations: ModelValidation[];
  reasoning: string;
  riskScore: number;
  sentimentScore: number;
  recommendation: string;
  timestamp: string;
}

interface ModelValidation {
  model: string;
  provider: string;
  confidence: number;
  signal: string;
  reasoning: string;
  latencyMs: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private anthropic: Anthropic;
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    @InjectRepository(TradeValidationEntity) private validationRepo: Repository<TradeValidationEntity>,
    @InjectRepository(AiInsightEntity) private insightRepo: Repository<AiInsightEntity>,
  ) {
    this.anthropic = new Anthropic({ apiKey: configService.get<string>('ANTHROPIC_API_KEY') });
    this.openai = new OpenAI({ apiKey: configService.get<string>('OPENAI_API_KEY') });
  }

  async validateTrade(context: TradeContext): Promise<ValidationResult> {
    const start = Date.now();
    const validations: ModelValidation[] = [];

    // Run all validators in parallel
    const [claudeResult, gptResult, technicalResult, riskResult, newsResult] = await Promise.allSettled([
      this.validateWithClaude(context),
      this.validateWithGPT(context),
      this.validateWithAIEngine('technical', context),
      this.validateWithAIEngine('risk', context),
      this.validateWithAIEngine('news', context),
    ]);

    const processResult = (result: PromiseSettledResult<ModelValidation>, fallback: ModelValidation) =>
      result.status === 'fulfilled' ? result.value : { ...fallback, reasoning: 'Model unavailable' };

    validations.push(
      processResult(claudeResult, { model: 'claude', provider: 'claude', confidence: 0.5, signal: 'neutral', reasoning: '', latencyMs: 0 }),
      processResult(gptResult, { model: 'gpt-4', provider: 'gpt', confidence: 0.5, signal: 'neutral', reasoning: '', latencyMs: 0 }),
      processResult(technicalResult, { model: 'technical-ai', provider: 'technical', confidence: 0.5, signal: 'neutral', reasoning: '', latencyMs: 0 }),
      processResult(riskResult, { model: 'risk-ai', provider: 'risk', confidence: 0.5, signal: 'neutral', reasoning: '', latencyMs: 0 }),
      processResult(newsResult, { model: 'news-ai', provider: 'news', confidence: 0.5, signal: 'neutral', reasoning: '', latencyMs: 0 }),
    );

    // Calculate weighted confidence
    const weights = [0.3, 0.25, 0.2, 0.15, 0.1];
    const overallConfidence = validations.reduce((acc, v, i) => acc + v.confidence * weights[i], 0);
    const bullishCount = validations.filter((v) => v.signal === 'bullish').length;
    const approved = overallConfidence >= 0.65 && bullishCount >= 3;

    const recommendation = overallConfidence >= 0.85 ? (context.side === 'buy' ? 'strong_buy' : 'strong_sell')
      : overallConfidence >= 0.65 ? (context.side === 'buy' ? 'buy' : 'sell')
      : 'neutral';

    const result: ValidationResult = {
      approved,
      overallConfidence,
      validations,
      reasoning: validations[0]?.reasoning ?? 'Multi-model analysis complete',
      riskScore: 1 - (validations[3]?.confidence ?? 0.5),
      sentimentScore: validations[1]?.confidence ?? 0.5,
      recommendation,
      timestamp: new Date().toISOString(),
    };

    // Persist validation for learning
    await this.validationRepo.save(this.validationRepo.create({
      symbol: context.symbol,
      side: context.side,
      result: result as unknown as Record<string, unknown>,
      approved,
      overallConfidence,
    }));

    return result;
  }

  private async validateWithClaude(context: TradeContext): Promise<ModelValidation> {
    const start = Date.now();
    const prompt = `You are an expert crypto trading analyst. Analyze this trade setup and provide a JSON assessment.

Trade Setup:
- Symbol: ${context.symbol}
- Side: ${context.side}
- Type: ${context.type}
- Quantity: ${context.quantity}
- Price: ${context.price ?? 'market'}
- Stop Loss: ${context.stopLoss ?? 'not set'}
- Take Profit: ${context.takeProfit ?? 'not set'}

Respond with ONLY valid JSON (no markdown):
{
  "confidence": <0.0-1.0>,
  "signal": "<bullish|bearish|neutral>",
  "reasoning": "<2 sentence analysis>",
  "riskRewardRatio": <number>,
  "concerns": ["<concern1>"]
}`;

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (message.content[0] as { text: string }).text;
    const parsed = JSON.parse(text);
    return {
      model: 'claude-sonnet-4-6',
      provider: 'claude',
      confidence: Math.max(0, Math.min(1, parsed.confidence)),
      signal: parsed.signal,
      reasoning: parsed.reasoning,
      latencyMs: Date.now() - start,
    };
  }

  private async validateWithGPT(context: TradeContext): Promise<ModelValidation> {
    const start = Date.now();
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 512,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: `Analyze crypto trade. Symbol: ${context.symbol}, Side: ${context.side}, Price: ${context.price ?? 'market'}. Return JSON: {"confidence":0.0-1.0,"signal":"bullish|bearish|neutral","reasoning":"2 sentences","marketPsychology":"brief note"}`,
      }],
    });

    const parsed = JSON.parse(completion.choices[0].message.content ?? '{}');
    return {
      model: 'gpt-4o-mini',
      provider: 'gpt',
      confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0.5)),
      signal: parsed.signal ?? 'neutral',
      reasoning: parsed.reasoning ?? '',
      latencyMs: Date.now() - start,
    };
  }

  private async validateWithAIEngine(type: string, context: TradeContext): Promise<ModelValidation> {
    const start = Date.now();
    const engineUrl = this.configService.get<string>('AI_ENGINE_URL', 'http://ai-engine:8000');
    const apiKey = this.configService.get<string>('AI_ENGINE_API_KEY');

    const res = await axios.post<ModelValidation>(
      `${engineUrl}/validate/${type}`,
      context,
      { headers: { 'X-API-Key': apiKey }, timeout: 10_000 }
    );
    return { ...res.data, latencyMs: Date.now() - start };
  }

  async getInsights(userId: string, limit = 10): Promise<AiInsightEntity[]> {
    return this.insightRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getMarketSentiment(): Promise<Record<string, unknown>> {
    try {
      const engineUrl = this.configService.get<string>('AI_ENGINE_URL', 'http://ai-engine:8000');
      const apiKey = this.configService.get<string>('AI_ENGINE_API_KEY');
      const res = await axios.get(`${engineUrl}/market-sentiment`, {
        headers: { 'X-API-Key': apiKey },
        timeout: 10_000,
      });
      return res.data;
    } catch {
      return { overallConfidence: 0.5, validations: [], recommendation: 'neutral' };
    }
  }
}
