import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AlertsService } from './alerts.service';
import { UserEntity } from '../users/user.entity';

@ApiTags('Alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private alertsService: AlertsService) {}
  @Get() getAlerts(@CurrentUser() user: UserEntity, @Query('unread') unread?: boolean) { return this.alertsService.getAlerts(user.id, unread); }
  @Patch(':id/read') markRead(@CurrentUser() user: UserEntity, @Param('id') id: string) { return this.alertsService.markRead(user.id, id); }
  @Patch('read-all') markAllRead(@CurrentUser() user: UserEntity) { return this.alertsService.markAllRead(user.id); }
}
