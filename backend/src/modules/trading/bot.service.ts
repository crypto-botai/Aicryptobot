import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BotEntity } from './entities/bot.entity';
import { CreateBotDto } from './dto/create-bot.dto';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);
  private runningBots = new Map<string, NodeJS.Timeout>();

  constructor(
    @InjectRepository(BotEntity) private botRepo: Repository<BotEntity>,
  ) {}

  async getBots(userId: string, status?: string): Promise<BotEntity[]> {
    const where: Partial<BotEntity> = { userId };
    if (status === 'running') where.isRunning = true;
    return this.botRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async createBot(userId: string, dto: CreateBotDto): Promise<BotEntity> {
    const bot = this.botRepo.create({
      userId,
      name: dto.name,
      exchangeId: dto.exchangeId,
      symbol: dto.symbol,
      marketType: dto.marketType,
      strategy: dto.strategy,
      mode: dto.mode,
      config: {
        positionSize: dto.positionSize,
        positionSizeType: dto.positionSizeType,
        stopLoss: dto.stopLoss,
        takeProfit: dto.takeProfit,
        aiConfidenceThreshold: dto.aiConfidenceThreshold / 100,
        maxDailyLoss: dto.maxDailyLoss,
        leverage: dto.leverage,
      },
      stats: {
        totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0,
        totalPnL: 0, totalPnLPercent: 0, sharpeRatio: 0, maxDrawdown: 0,
        avgWin: 0, avgLoss: 0, profitFactor: 0, runningDays: 0,
      },
    });
    return this.botRepo.save(bot);
  }

  async startBot(userId: string, botId: string): Promise<BotEntity> {
    const bot = await this.findOwned(userId, botId);
    if (bot.isRunning) return bot;

    await this.botRepo.update(bot.id, { isRunning: true, startedAt: new Date() });
    this.scheduleBot(bot.id);
    this.logger.log(`Bot started: ${bot.id} (${bot.name})`);
    return { ...bot, isRunning: true };
  }

  async stopBot(userId: string, botId: string): Promise<BotEntity> {
    const bot = await this.findOwned(userId, botId);
    if (!bot.isRunning) return bot;

    const timer = this.runningBots.get(bot.id);
    if (timer) { clearInterval(timer); this.runningBots.delete(bot.id); }

    await this.botRepo.update(bot.id, { isRunning: false, stoppedAt: new Date() });
    this.logger.log(`Bot stopped: ${bot.id} (${bot.name})`);
    return { ...bot, isRunning: false };
  }

  async deleteBot(userId: string, botId: string): Promise<void> {
    const bot = await this.findOwned(userId, botId);
    if (bot.isRunning) await this.stopBot(userId, botId);
    await this.botRepo.delete(bot.id);
  }

  private async findOwned(userId: string, botId: string): Promise<BotEntity> {
    const bot = await this.botRepo.findOne({ where: { id: botId } });
    if (!bot) throw new NotFoundException('Bot not found');
    if (bot.userId !== userId) throw new ForbiddenException('Access denied');
    return bot;
  }

  private scheduleBot(botId: string) {
    // Tick the bot every 30 seconds — actual analysis logic runs in AI engine
    const timer = setInterval(async () => {
      const bot = await this.botRepo.findOne({ where: { id: botId } });
      if (!bot || !bot.isRunning) {
        clearInterval(timer);
        this.runningBots.delete(botId);
        return;
      }
      // Bot tick logic dispatched to queue (handled in trading.processor.ts)
    }, 30_000);
    this.runningBots.set(botId, timer);
  }

  // Re-attach scheduled bots on app restart
  @Cron(CronExpression.EVERY_MINUTE)
  async reattachRunningBots() {
    const running = await this.botRepo.find({ where: { isRunning: true } });
    for (const bot of running) {
      if (!this.runningBots.has(bot.id)) this.scheduleBot(bot.id);
    }
  }
}
