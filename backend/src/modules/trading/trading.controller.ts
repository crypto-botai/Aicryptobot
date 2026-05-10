import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TradingService } from './trading.service';
import { BotService } from './bot.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateBotDto } from './dto/create-bot.dto';
import { UserEntity } from '../users/user.entity';

@ApiTags('Trading')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trading')
export class TradingController {
  constructor(
    private tradingService: TradingService,
    private botService: BotService,
  ) {}

  // ── Orders ──────────────────────────────────────────────────────────────────

  @Post('orders')
  @ApiOperation({ summary: 'Place a new order (with AI validation)' })
  createOrder(@CurrentUser() user: UserEntity, @Body() dto: CreateOrderDto) {
    return this.tradingService.createOrder(user.id, dto);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get user orders' })
  getOrders(
    @CurrentUser() user: UserEntity,
    @Query('status') status?: string,
    @Query('symbol') symbol?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.tradingService.getOrders(user.id, { status, symbol, limit, offset });
  }

  // ── Positions ────────────────────────────────────────────────────────────────

  @Get('positions')
  @ApiOperation({ summary: 'Get open positions' })
  getPositions(@CurrentUser() user: UserEntity, @Query('status') status?: string) {
    return this.tradingService.getPositions(user.id, status);
  }

  @Post('positions/:id/close')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Close an open position' })
  closePosition(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.tradingService.closePosition(user.id, id);
  }

  // ── Bots ─────────────────────────────────────────────────────────────────────

  @Get('bots')
  @ApiOperation({ summary: 'Get user bots' })
  getBots(@CurrentUser() user: UserEntity, @Query('status') status?: string) {
    return this.botService.getBots(user.id, status);
  }

  @Post('bots')
  @ApiOperation({ summary: 'Create new trading bot' })
  createBot(@CurrentUser() user: UserEntity, @Body() dto: CreateBotDto) {
    return this.botService.createBot(user.id, dto);
  }

  @Patch('bots/:id/start')
  @ApiOperation({ summary: 'Start a bot' })
  startBot(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.botService.startBot(user.id, id);
  }

  @Patch('bots/:id/stop')
  @ApiOperation({ summary: 'Stop a bot' })
  stopBot(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.botService.stopBot(user.id, id);
  }

  @Delete('bots/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a bot' })
  deleteBot(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.botService.deleteBot(user.id, id);
  }
}
