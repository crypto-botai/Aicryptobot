import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiskSettingsEntity } from './risk-settings.entity';

interface RiskCheckResult {
  allowed: boolean;
  reason?: string;
  riskLevel?: string;
}

@Injectable()
export class RiskService {
  private readonly logger = new Logger(RiskService.name);

  constructor(
    @InjectRepository(RiskSettingsEntity) private settingsRepo: Repository<RiskSettingsEntity>,
  ) {}

  async checkOrder(userId: string, order: {
    side: string;
    quantity: number;
    price?: number;
    leverage?: number;
  }): Promise<RiskCheckResult> {
    const settings = await this.getOrCreateSettings(userId);

    // Emergency stop
    if (settings.emergencyStop) {
      return { allowed: false, reason: 'Emergency stop is active' };
    }

    // Daily loss limit
    if (settings.dailyPnl < 0) {
      const dailyLossPct = Math.abs(settings.dailyPnl);
      if (dailyLossPct >= settings.maxDailyLossPercent) {
        return { allowed: false, reason: `Daily loss limit reached (${settings.maxDailyLossPercent}%)` };
      }
    }

    // Leverage check
    if (order.leverage && order.leverage > settings.maxLeverage) {
      return { allowed: false, reason: `Leverage ${order.leverage}x exceeds max ${settings.maxLeverage}x` };
    }

    return { allowed: true, riskLevel: 'normal' };
  }

  async updateDailyPnl(userId: string, pnlDelta: number): Promise<void> {
    const settings = await this.getOrCreateSettings(userId);
    const newPnl = settings.dailyPnl + pnlDelta;
    await this.settingsRepo.update(settings.id, { dailyPnl: newPnl });

    const lossPercent = Math.abs(Math.min(0, newPnl));
    if (lossPercent >= settings.maxDailyLossPercent) {
      await this.settingsRepo.update(settings.id, { emergencyStop: true });
      this.logger.warn(`Emergency stop triggered for user ${userId}: daily loss ${lossPercent.toFixed(2)}%`);
    }
  }

  async activateEmergencyStop(userId: string): Promise<void> {
    await this.settingsRepo.update({ userId } as Partial<RiskSettingsEntity>, { emergencyStop: true });
    this.logger.warn(`Emergency stop MANUALLY activated for user ${userId}`);
  }

  async deactivateEmergencyStop(userId: string): Promise<void> {
    await this.settingsRepo.update({ userId } as Partial<RiskSettingsEntity>, { emergencyStop: false });
  }

  async getSettings(userId: string): Promise<RiskSettingsEntity> {
    return this.getOrCreateSettings(userId);
  }

  private async getOrCreateSettings(userId: string): Promise<RiskSettingsEntity> {
    let settings = await this.settingsRepo.findOne({ where: { userId } });
    if (!settings) {
      settings = await this.settingsRepo.save(this.settingsRepo.create({ userId }));
    }
    return settings;
  }
}
