import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ExchangeService } from './exchange.service';
import { UserEntity } from '../users/user.entity';

class AddConnectionDto {
  @IsString() exchangeId: string;
  @IsString() apiKey: string;
  @IsString() apiSecret: string;
  @IsOptional() @IsString() passphrase?: string;
  @IsOptional() @IsString() label?: string;
}

@ApiTags('Exchange')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exchange')
export class ExchangeController {
  constructor(private exchangeService: ExchangeService) {}

  @Get('connections')
  @ApiOperation({ summary: 'Get user exchange connections' })
  getConnections(@CurrentUser() user: UserEntity) {
    return this.exchangeService.getConnections(user.id);
  }

  @Post('connections')
  @ApiOperation({ summary: 'Add exchange API credentials' })
  addConnection(@CurrentUser() user: UserEntity, @Body() dto: AddConnectionDto) {
    return this.exchangeService.addConnection(user.id, dto);
  }

  @Get('connections/:id/balances')
  @ApiOperation({ summary: 'Get balances for a specific connection' })
  getBalances(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.exchangeService.getBalances(user.id, id);
  }

  @Post('connections/:id/test')
  @ApiOperation({ summary: 'Test an exchange connection' })
  testConnection(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.exchangeService.testConnection(user.id, id);
  }

  @Delete('connections/:id')
  @ApiOperation({ summary: 'Remove an exchange connection' })
  deleteConnection(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.exchangeService.deleteConnection(user.id, id);
  }
}
