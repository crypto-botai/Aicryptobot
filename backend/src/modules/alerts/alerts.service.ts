import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { AlertEntity } from './alert.entity';

@Injectable()
export class AlertsService {
  constructor(@InjectRepository(AlertEntity) private alertRepo: Repository<AlertEntity>) {}

  async createAlert(userId: string, data: Partial<AlertEntity>): Promise<AlertEntity> {
    return this.alertRepo.save(this.alertRepo.create({ userId, ...data }));
  }

  async getAlerts(userId: string, unreadOnly = false): Promise<AlertEntity[]> {
    const where: FindOptionsWhere<AlertEntity> = { userId };
    if (unreadOnly) where.isRead = false;
    return this.alertRepo.find({ where, order: { createdAt: 'DESC' }, take: 100 });
  }

  async markRead(userId: string, id: string): Promise<void> {
    await this.alertRepo.update({ id, userId }, { isRead: true });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.alertRepo.update({ userId, isRead: false }, { isRead: true });
  }
}
