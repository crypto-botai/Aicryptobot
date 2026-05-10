import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicensingController } from './licensing.controller';
import { LicensingService } from './licensing.service';
import { LicenseEntity } from './license.entity';
import { LicenseActivationEntity } from './license-activation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LicenseEntity, LicenseActivationEntity])],
  controllers: [LicensingController],
  providers: [LicensingService],
  exports: [LicensingService],
})
export class LicensingModule {}
