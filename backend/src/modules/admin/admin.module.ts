import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UserEntity } from '../users/user.entity';
import { LicensingModule } from '../licensing/licensing.module';
import { AdminLicensingController } from '../licensing/licensing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), LicensingModule],
  controllers: [AdminController, AdminLicensingController],
  providers: [AdminService],
})
export class AdminModule {}
