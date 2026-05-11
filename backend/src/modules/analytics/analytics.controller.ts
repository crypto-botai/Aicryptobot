import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';
import { UserEntity } from '../users/user.entity';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}
  @Get('performance') getPerformance(@CurrentUser() user: UserEntity, @Query('period') period?: string) { return this.analyticsService.getPerformance(user.id, period); }
  @Get('equity-curve') getEquityCurve(@CurrentUser() user: UserEntity, @Query('period') period?: string) { return this.analyticsService.getEquityCurve(user.id, period); }
}
