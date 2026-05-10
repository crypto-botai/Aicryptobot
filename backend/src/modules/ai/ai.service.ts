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
  weight: number;
}

// ─── Model weights (must sum to 1.0) ───────────────────────────────────────
const MODEL_WEIGHTS: Record<string, number> = {
  claude:      0.18,
  gpt:         0.15,
  gemini:      0.12,
  deepseek:    0.10,
  groq:        0.08,
  openrouter:  0.07,
  nvidia:      0.05,
  technical:   0.12,
  risk:        0.08,
  news:        0.05,
};

const TRADE_PROMPT = (ctx: TradeContext) =>
  `You are an expert crypto trading analyst. Analyze this trade and return ONLY valid JSON (no markdown).

Trade:
- Symbol: ${ctx.symbol}
- Side: ${ctx.side.toUpperCase()}
- Type: ${ctx.type}
- Quantity: ${ctx.quantity}
- Price: ${ctx.price ?? 'market'}
- Stop Loss: ${ctx.stopLoss ?? 'not set'}
- Take Profit: ${ctx.takeProfit ?? 'not set'}

JSON format:
{"confidence":0.0-1.0,"signal":"bullish|bearish|neutral","reasoning":"2 sentence analysis","riskRewardRatio":number}`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  // LLM clients
  private anthropic: Anthropic;
  private openai: OpenAI;
  private deepseek: OpenAI;
  private groq: OpenAI;
  private openrouter: OpenAI;
  private nvidia: OpenAI;

  constructor(
    private configService: ConfigService,
    @InjectRepository(TradeValidationEntity) private validationRepo: Repository<TradeValidationEntity>,
    @InjectRepository(AiInsightEntity) private insightRepo: Repository<AiInsightEntity>,
  ) {
    this.anthropic = new Anthropic({
      apiKey: configService.get<string>('ANTHROPIC_API_KEY'),
    });

    this.openai = new OpenAI({
      apiKey: configService.get<string>('OPENAI_API_KEY'),
    });

    // OpenAI-compatible clients for alternative providers
    this.deepseek = new OpenAI({
      apiKey: configService.get<string>('DEEPSEEK_API_KEY'),
      baseURL: 'https://api.deepseek.com',
    });

    this.groq = new OpenAI({
      apiKey: configService.get<string>('GROQ_API_KEY'),
      baseURL: 'https://api.groq.com/openai/v1',
    });

    this.openrouter = new OpenAI({
      apiKey: configService.get<string>('OPENROUTER_API_KEY'),
      baseURL: 'https://openrouter.ai/api/v1',
    });

    this.nvidia = new OpenAI({
      apiKey: configService.get<string>('NVIDIA_API_KEY'),
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });
  }

  async validateTrade(context: TradeContext): Promise<ValidationResult> {
    // Run all 10 validators in parallel — failures fall back to neutral 0.5
    const results = await Promise.allSettled([
      this.validateWithClaude(context),
      this.validateWithGPT(context),
      this.validateWithGemini(context),
      this.validateWithDeepSeek(context),
      this.validateWithGroq(context),
      this.validateWithOpenRouter(context),
      this.validateWithNvidia(context),
      this.validateWithAIEngine('technical', context),
      this.validateWithAIEngine('risk', context),
      this.validateWithAIEngine('news', context),
    ]);

    const providerKeys = ['claude','gpt','gemini','deepseek','groq','openrouter','nvidia','technical','risk','news'];

    const validations: ModelValidation[] = results.map((result, i) => {
      const provider = providerKeys[i];
      const weight = MODEL_WEIGHTS[provider] ?? 0.05;
      if (result.status === 'fulfilled') {
        return { ...result.value, weight };
      }
      this.logger.warn(`${provider} validator failed: ${(result.reason as Error)?.message}`);
      return { model: provider, provider, confidence: 0.5, signal: 'neutral', reasoning: 'Model unavailable', latencyMs: 0, weight };
    });

    // Weighted confidence
    const overallConfidence = validations.reduce((acc, v) => acc + v.confidence * v.weight, 0);
    const bullishCount = validations.filter(v => v.signal === 'bullish').length;
    const approved = overallConfidence >= 0.65 && bullishCount >= 5;

    const recommendation =
      overallConfidence >= 0.85 ? (context.side === 'buy' ? 'strong_buy' : 'strong_sell') :
      overallConfidence >= 0.65 ? (context.side === 'buy' ? 'buy' : 'sell') : 'neutral';

    const result: ValidationResult = {
      approved,
      overallConfidence,
      validations,
      reasoning: validations[0]?.reasoning ?? 'Multi-model analysis complete',
      riskScore: 1 - (validations.find(v => v.provider === 'risk')?.confidence ?? 0.5),
      sentimentScore: overallConfidence,
      recommendation,
      timestamp: new Date().toISOString(),
    };

    await this.validationRepo.save(this.validationRepo.create({
      symbol: context.symbol,
      side: context.side,
      result: result as unknown as Record<string, unknown>,
      approved,
      overallConfidence,
    }));

    return result;
  }

  // ─── Claude ──────────────────────────────────────────────────────────────
  private async validateWithClaude(ctx: TradeContext): Promise<ModelValidation> {
    const start = Date.now();
    const msg = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: TRADE_PROMPT(ctx) }],
    });
    const parsed = JSON.parse((msg.content[0] as { text: string }).text);
    return { model: 'claude-sonnet-4-6', provider: 'claude', weight: MODEL_WEIGHTS.claude,
      confidence: clamp(parsed.confidence), signal: parsed.signal, reasoning: parsed.reasoning, latencyMs: Date.now() - start };
  }

  // ─── GPT-4o ──────────────────────────────────────────────────────────────
  private async validateWithGPT(ctx: TradeContext): Promise<ModelValidation> {
    const start = Date.now();
    const res = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 512,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: TRADE_PROMPT(ctx) }],
    });
    const parsed = JSON.parse(res.choices[0].message.content ?? '{}');
    return { model: 'gpt-4o-mini', provider: 'gpt', weight: MODEL_WEIGHTS.gpt,
      confidence: clamp(parsed.confidence), signal: parsed.signal ?? 'neutral', reasoning: parsed.reasoning ?? '', latencyMs: Date.now() - start };
  }

  // ─── Gemini ──────────────────────────────────────────────────────────────
  private async validateWithGemini(ctx: TradeContext): Promise<ModelValidation> {
    const start = Date.now();
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const res = await axios.post(url, {
      contents: [{ parts: [{ text: TRADE_PROMPT(ctx) }] }],
      generationConfig: { maxOutputTokens: 512, temperature: 0.3 },
    }, { timeout: 15_000 });

    const text: string = res.data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return { model: 'gemini-1.5-flash', provider: 'gemini', weight: MODEL_WEIGHTS.gemini,
      confidence: clamp(parsed.confidence), signal: parsed.signal ?? 'neutral', reasoning: parsed.reasoning ?? '', latencyMs: Date.now() - start };
  }

  // ─── DeepSeek ─────────────────────────────────────────────────────────────
  private async validateWithDeepSeek(ctx: TradeContext): Promise<ModelValidation> {
    const start = Date.now();
    const res = await this.deepseek.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 512,
      messages: [
        { role: 'system', content: 'You are a crypto trading analyst. Always respond with valid JSON only.' },
        { role: 'user', content: TRADE_PROMPT(ctx) },
      ],
    });
    const text = res.choices[0].message.content ?? '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return { model: 'deepseek-chat', provider: 'deepseek', weight: MODEL_WEIGHTS.deepseek,
      confidence: clamp(parsed.confidence), signal: parsed.signal ?? 'neutral', reasoning: parsed.reasoning ?? '', latencyMs: Date.now() - start };
  }

  // ─── Groq (Llama 3.1 70B — ultra fast) ───────────────────────────────────
  private async validateWithGroq(ctx: TradeContext): Promise<ModelValidation> {
    const start = Date.now();
    const res = await this.groq.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      max_tokens: 512,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: TRADE_PROMPT(ctx) }],
    });
    const parsed = JSON.parse(res.choices[0].message.content ?? '{}');
    return { model: 'llama-3.1-70b (groq)', provider: 'groq', weight: MODEL_WEIGHTS.groq,
      confidence: clamp(parsed.confidence), signal: parsed.signal ?? 'neutral', reasoning: parsed.reasoning ?? '', latencyMs: Date.now() - start };
  }

  // ─── OpenRouter (Mistral Large) ───────────────────────────────────────────
  private async validateWithOpenRouter(ctx: TradeContext): Promise<ModelValidation> {
    const start = Date.now();
    const res = await this.openrouter.chat.completions.create({
      model: 'mistralai/mistral-large',
      max_tokens: 512,
      messages: [
        { role: 'system', content: 'You are a crypto trading analyst. Respond with valid JSON only.' },
        { role: 'user', content: TRADE_PROMPT(ctx) },
      ],
    } as Parameters<typeof this.openrouter.chat.completions.create>[0]);
    const text = res.choices[0].message.content ?? '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return { model: 'mistral-large (openrouter)', provider: 'openrouter', weight: MODEL_WEIGHTS.openrouter,
      confidence: clamp(parsed.confidence), signal: parsed.signal ?? 'neutral', reasoning: parsed.reasoning ?? '', latencyMs: Date.now() - start };
  }

  // ─── NVIDIA NIM (Llama 3.1 70B) ──────────────────────────────────────────
  private async validateWithNvidia(ctx: TradeContext): Promise<ModelValidation> {
    const start = Date.now();
    const res = await this.nvidia.chat.completions.create({
      model: 'meta/llama-3.1-70b-instruct',
      max_tokens: 512,
      messages: [
        { role: 'system', content: 'You are a crypto trading analyst. Respond with valid JSON only.' },
        { role: 'user', content: TRADE_PROMPT(ctx) },
      ],
    });
    const text = res.choices[0].message.content ?? '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return { model: 'llama-3.1-70b (nvidia)', provider: 'nvidia', weight: MODEL_WEIGHTS.nvidia,
      confidence: clamp(parsed.confidence), signal: parsed.signal ?? 'neutral', reasoning: parsed.reasoning ?? '', latencyMs: Date.now() - start };
  }

  // ─── Python AI Engine (technical / risk / news) ──────────────────────────
  private async validateWithAIEngine(type: string, ctx: TradeContext): Promise<ModelValidation> {
    const start = Date.now();
    const engineUrl = this.configService.get<string>('AI_ENGINE_URL', 'http://ai-engine:8000');
    const apiKey = this.configService.get<string>('AI_ENGINE_API_KEY');
    const res = await axios.post<ModelValidation>(`${engineUrl}/validate/${type}`, ctx,
      { headers: { 'X-API-Key': apiKey }, timeout: 10_000 });
    return { ...res.data, weight: MODEL_WEIGHTS[type] ?? 0.05, latencyMs: Date.now() - start };
  }

  async getInsights(userId: string, limit = 10): Promise<AiInsightEntity[]> {
    return this.insightRepo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: limit });
  }

  async getMarketSentiment(): Promise<Record<string, unknown>> {
    try {
      const engineUrl = this.configService.get<string>('AI_ENGINE_URL', 'http://ai-engine:8000');
      const apiKey = this.configService.get<string>('AI_ENGINE_API_KEY');
      const res = await axios.get(`${engineUrl}/market-sentiment`, {
        headers: { 'X-API-Key': apiKey }, timeout: 10_000,
      });
      return res.data;
    } catch {
      return { overallConfidence: 0.5, validations: [], recommendation: 'neutral' };
    }
  }
}

function clamp(v: unknown, min = 0, max = 1): number {
  const n = Number(v);
  return isNaN(n) ? 0.5 : Math.max(min, Math.min(max, n));
}
