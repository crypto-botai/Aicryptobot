import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BacktestingService } from './backtesting.service';
import { UserEntity } from '../users/user.entity';

@ApiTags('Backtesting') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('backtesting')
export class BacktestingController {
  constructor(private svc: BacktestingService) {}
  @Get() getAll(@CurrentUser() user: UserEntity) { return this.svc.getBacktests(user.id); }
  @Post() create(@CurrentUser() user: UserEntity, @Body() body: Record<string,unknown>) { return this.svc.createBacktest(user.id, body); }
  @Get(':id') getOne(@CurrentUser() user: UserEntity, @Param('id') id: string) { return this.svc.getBacktest(user.id, id); }
}
