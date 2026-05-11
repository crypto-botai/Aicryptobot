import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiskService } from './risk.service';
import { RiskSettingsEntity } from './risk-settings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RiskSettingsEntity])],
  providers: [RiskService],
  exports: [RiskService],
})
export class RiskModule {}
