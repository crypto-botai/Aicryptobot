import { Injectable } from '@nestjs/common'; import { InjectRepository } from '@nestjs/typeorm'; import { Repository } from 'typeorm'; import { BacktestEntity } from './backtest.entity';
@Injectable()
export class BacktestingService {
  constructor(@InjectRepository(BacktestEntity) private repo: Repository<BacktestEntity>) {}
  async createBacktest(userId: string, config: Record<string,unknown>): Promise<BacktestEntity> { return this.repo.save(this.repo.create({ userId, config })); }
  async getBacktests(userId: string): Promise<BacktestEntity[]> { return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } }); }
  async getBacktest(userId: string, id: string): Promise<BacktestEntity | null> { return this.repo.findOne({ where: { id, userId } }); }
}
