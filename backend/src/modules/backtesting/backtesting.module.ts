import { Module } from '@nestjs/common'; import { TypeOrmModule } from '@nestjs/typeorm'; import { BacktestingController } from './backtesting.controller'; import { BacktestingService } from './backtesting.service'; import { BacktestEntity } from './backtest.entity';
@Module({ imports: [TypeOrmModule.forFeature([BacktestEntity])], controllers: [BacktestingController], providers: [BacktestingService] })
export class BacktestingModule {}
