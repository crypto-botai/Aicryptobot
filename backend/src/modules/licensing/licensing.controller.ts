import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LicensingService } from './licensing.service';
import { UserEntity } from '../users/user.entity';
import { IsString, IsOptional, IsNumber, IsEmail, Min, Max } from 'class-validator';

class GenerateLicenseDto {
  @IsString() plan: string;
  @IsOptional() @IsEmail() userEmail?: string;
  @IsOptional() @IsNumber() @Min(1) @Max(10) maxDevices?: number;
  @IsOptional() @IsString() notes?: string;
}

class ActivateLicenseDto {
  @IsString() key: string;
  @IsString() deviceFingerprint: string;
  @IsOptional() @IsString() deviceName?: string;
}

@ApiTags('Licensing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('licensing')
export class LicensingController {
  constructor(private licensingService: LicensingService) {}

  @Post('activate')
  @ApiOperation({ summary: 'Activate a license key on this device' })
  activate(@CurrentUser() user: UserEntity, @Body() dto: ActivateLicenseDto, @Req() req: Request) {
    return this.licensingService.activateLicense(user.id, dto.key, dto.deviceFingerprint, {
      deviceName: dto.deviceName,
      ipAddress: (req as unknown as { ip: string }).ip,
      userAgent: (req as unknown as { headers: Record<string, string> }).headers['user-agent'],
    });
  }

  @Get('validate')
  @ApiOperation({ summary: 'Check license validity for current session' })
  validate(@CurrentUser() user: UserEntity, @Req() req: Request) {
    const fp = (req as unknown as { headers: Record<string, string> }).headers['x-device-fingerprint'] ?? 'unknown';
    return this.licensingService.validateLicense(user.id, fp);
  }
}

@ApiTags('Admin - Licensing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
@Controller('admin/licenses')
export class AdminLicensingController {
  constructor(private licensingService: LicensingService) {}

  @Get()
  getAll() { return this.licensingService.getLicenses(); }

  @Post()
  @ApiOperation({ summary: 'Generate a new license key' })
  generate(@CurrentUser() user: UserEntity, @Body() dto: GenerateLicenseDto) {
    return this.licensingService.generateKey(user.id, dto.plan, dto);
  }

  @Patch(':id/revoke')
  @ApiOperation({ summary: 'Revoke/suspend a license' })
  revoke(@Param('id') id: string) {
    return this.licensingService.revokeLicense(id);
  }
}
