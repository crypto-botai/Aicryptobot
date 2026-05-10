import {
  Injectable, BadRequestException, NotFoundException,
  ForbiddenException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { LicenseEntity } from './license.entity';
import { LicenseActivationEntity } from './license-activation.entity';

const PLAN_DURATIONS: Record<string, number> = {
  monthly: 30,
  quarterly: 90,
  biannual: 180,
  annual: 365,
  enterprise: 36500,
};

const PLAN_FEATURES: Record<string, Record<string, unknown>> = {
  monthly: {
    liveTrading: true,
    aiModels: ['claude', 'gpt'],
    maxExchanges: 2,
    maxBots: 3,
    backtesting: false,
    advancedAnalytics: false,
    copyTrading: false,
    apiAccess: false,
  },
  quarterly: {
    liveTrading: true,
    aiModels: ['claude', 'gpt', 'gemini'],
    maxExchanges: 5,
    maxBots: 10,
    backtesting: true,
    advancedAnalytics: true,
    copyTrading: false,
    apiAccess: false,
  },
  biannual: {
    liveTrading: true,
    aiModels: ['claude', 'gpt', 'gemini', 'deepseek'],
    maxExchanges: 9,
    maxBots: 25,
    backtesting: true,
    advancedAnalytics: true,
    copyTrading: true,
    apiAccess: true,
  },
  annual: {
    liveTrading: true,
    aiModels: ['claude', 'gpt', 'gemini', 'deepseek', 'local'],
    maxExchanges: 9,
    maxBots: 50,
    backtesting: true,
    advancedAnalytics: true,
    copyTrading: true,
    apiAccess: true,
  },
  enterprise: {
    liveTrading: true,
    aiModels: ['claude', 'gpt', 'gemini', 'deepseek', 'local'],
    maxExchanges: 9,
    maxBots: -1,
    backtesting: true,
    advancedAnalytics: true,
    copyTrading: true,
    apiAccess: true,
  },
};

@Injectable()
export class LicensingService {
  private readonly logger = new Logger(LicensingService.name);

  constructor(
    @InjectRepository(LicenseEntity) private licenseRepo: Repository<LicenseEntity>,
    @InjectRepository(LicenseActivationEntity) private activationRepo: Repository<LicenseActivationEntity>,
    private configService: ConfigService,
  ) {}

  async generateKey(adminId: string, plan: string, options: {
    userEmail?: string;
    maxDevices?: number;
    notes?: string;
  } = {}): Promise<LicenseEntity> {
    const key = this.createLicenseKey(plan);
    const features = PLAN_FEATURES[plan] ?? PLAN_FEATURES.monthly;

    const license = this.licenseRepo.create({
      key,
      plan,
      status: 'unused',
      assignedEmail: options.userEmail,
      maxDevices: options.maxDevices ?? 1,
      features,
      notes: options.notes,
      createdBy: adminId,
    });
    await this.licenseRepo.save(license);
    this.logger.log(`License key generated: ${key} (${plan})`);
    return license;
  }

  async activateLicense(userId: string, key: string, deviceFingerprint: string, deviceInfo: {
    deviceName?: string;
    ipAddress?: string;
    userAgent?: string;
  } = {}): Promise<LicenseEntity> {
    const license = await this.licenseRepo.findOne({ where: { key } });
    if (!license) throw new NotFoundException('Invalid license key');
    if (license.status === 'suspended') throw new ForbiddenException('License suspended');
    if (license.status === 'expired') throw new BadRequestException('License expired');
    if (license.assignedEmail && license.userId && license.userId !== userId) {
      throw new ForbiddenException('License assigned to another account');
    }

    // Check device limit
    const existingActivations = await this.activationRepo.count({
      where: { licenseId: license.id, isActive: true } as Partial<LicenseActivationEntity>,
    });

    const existingDevice = await this.activationRepo.findOne({
      where: { licenseId: license.id, deviceFingerprint, isActive: true } as Partial<LicenseActivationEntity>,
    });

    if (!existingDevice && existingActivations >= license.maxDevices) {
      throw new BadRequestException(`Device limit reached (max ${license.maxDevices})`);
    }

    if (!existingDevice) {
      await this.activationRepo.save(this.activationRepo.create({
        licenseId: license.id,
        userId,
        deviceFingerprint,
        ...deviceInfo,
      }));
    } else {
      await this.activationRepo.update(existingDevice.id, { lastSeenAt: new Date() });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (PLAN_DURATIONS[license.plan] ?? 30));

    await this.licenseRepo.update(license.id, {
      userId,
      status: 'active',
      activatedAt: license.activatedAt ?? new Date(),
      expiresAt: license.expiresAt ?? expiresAt,
      activeDevices: existingActivations + (existingDevice ? 0 : 1),
    });

    return this.licenseRepo.findOne({ where: { id: license.id } }) as Promise<LicenseEntity>;
  }

  async validateLicense(userId: string, deviceFingerprint: string): Promise<{
    valid: boolean;
    license?: LicenseEntity;
    reason?: string;
  }> {
    const license = await this.licenseRepo.findOne({
      where: { userId, status: 'active' } as Partial<LicenseEntity>,
    });

    if (!license) return { valid: false, reason: 'No active license' };
    if (license.expiresAt && new Date() > license.expiresAt) {
      await this.licenseRepo.update(license.id, { status: 'expired' });
      return { valid: false, reason: 'License expired' };
    }

    const activation = await this.activationRepo.findOne({
      where: { licenseId: license.id, deviceFingerprint, isActive: true } as Partial<LicenseActivationEntity>,
    });
    if (!activation) return { valid: false, reason: 'Device not authorized' };

    await this.activationRepo.update(activation.id, { lastSeenAt: new Date() });
    return { valid: true, license };
  }

  async revokeLicense(id: string): Promise<void> {
    await this.licenseRepo.update(id, { status: 'suspended' });
    await this.activationRepo.update({ licenseId: id } as Partial<LicenseActivationEntity>, { isActive: false });
  }

  async getLicenses(adminOnly = false): Promise<LicenseEntity[]> {
    return this.licenseRepo.find({ order: { createdAt: 'DESC' } });
  }

  private createLicenseKey(plan: string): string {
    const prefix = plan.slice(0, 3).toUpperCase();
    const secret = this.configService.get<string>('LICENSE_MASTER_KEY', 'default-key');
    const random = crypto.randomBytes(12).toString('hex').toUpperCase();
    const checksum = crypto
      .createHmac('sha256', secret)
      .update(random)
      .digest('hex')
      .slice(0, 8)
      .toUpperCase();
    return `${prefix}-${random.slice(0, 4)}-${random.slice(4, 8)}-${random.slice(8, 12)}-${checksum}`;
  }
}
