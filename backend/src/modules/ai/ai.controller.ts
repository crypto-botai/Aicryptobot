import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AiService, TradeContext } from './ai.service';
import { UserEntity } from '../users/user.entity';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('validate-trade')
  @ApiOperation({ summary: 'Run multi-model AI trade validation' })
  validateTrade(@Body() context: TradeContext) {
    return this.aiService.validateTrade(context);
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get AI insights for current user' })
  getInsights(@CurrentUser() user: UserEntity, @Query('limit') limit?: number) {
    return this.aiService.getInsights(user.id, limit);
  }

  @Get('market-sentiment')
  @ApiOperation({ summary: 'Get current AI market sentiment' })
  getMarketSentiment() {
    return this.aiService.getMarketSentiment();
  }
}
