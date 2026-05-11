import { Module } from '@nestjs/common';
import { TradingGateway } from './trading.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [TradingGateway],
  exports: [TradingGateway],
})
export class WebSocketModule {}
