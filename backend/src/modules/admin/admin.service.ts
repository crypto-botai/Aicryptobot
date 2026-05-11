import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import * as os from 'os';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
  ) {}

  async getStats() {
    const [totalUsers, activeUsers] = await Promise.all([
      this.userRepo.count(),
      this.userRepo.count({ where: { isActive: true } }),
    ]);

    const cpuUsage = process.cpuUsage();
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    return {
      totalUsers,
      activeUsers,
      totalRevenue: 0,
      monthlyRevenue: 0,
      activeLicenses: 0,
      expiredLicenses: 0,
      totalTrades: 0,
      activeBots: 0,
      serverHealth: {
        cpu: Math.round((cpuUsage.system / 1e6) % 100),
        memory: Math.round(((totalMem - freeMem) / totalMem) * 100),
        latency: Math.round(Math.random() * 20 + 5),
      },
    };
  }

  async getUsers(search?: string, limit = 20): Promise<UserEntity[]> {
    const qb = this.userRepo.createQueryBuilder('u')
      .select(['u.id', 'u.email', 'u.username', 'u.role', 'u.isActive', 'u.createdAt'])
      .orderBy('u.createdAt', 'DESC')
      .take(limit);

    if (search) {
      qb.where('u.email ILIKE :q OR u.username ILIKE :q', { q: `%${search}%` });
    }
    return qb.getMany();
  }

  async updateUser(id: string, data: Partial<UserEntity>): Promise<void> {
    await this.userRepo.update(id, data);
  }

  async toggleUserStatus(id: string, active: boolean): Promise<void> {
    await this.userRepo.update(id, { isActive: active });
  }
}
