import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TradingModule } from './modules/trading/trading.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { ExchangeModule } from './modules/exchange/exchange.module';
import { AiModule } from './modules/ai/ai.module';
import { LicensingModule } from './modules/licensing/licensing.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { AdminModule } from './modules/admin/admin.module';
import { RiskModule } from './modules/risk/risk.module';
import { BacktestingModule } from './modules/backtesting/backtesting.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MarketModule } from './modules/market/market.module';
import appConfig from './config/app.config';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      cache: true,
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        url: cfg.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: cfg.get<string>('NODE_ENV') === 'development',
        logging: cfg.get<string>('NODE_ENV') === 'development',
        ssl: cfg.get<string>('NODE_ENV') === 'production'
          ? { rejectUnauthorized: false }
          : false,
        extra: { max: 20, idleTimeoutMillis: 30000 },
      }),
    }),

    // Cache (Redis)
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (cfg: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: cfg.get<string>('REDIS_HOST', 'localhost'),
            port: cfg.get<number>('REDIS_PORT', 6379),
          },
          password: cfg.get<string>('REDIS_PASSWORD'),
        }),
        ttl: 60 * 1000,
      }),
    }),

    // Bull queues
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        redis: {
          host: cfg.get<string>('REDIS_HOST', 'localhost'),
          port: cfg.get<number>('REDIS_PORT', 6379),
          password: cfg.get<string>('REDIS_PASSWORD'),
        },
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    // Scheduler
    ScheduleModule.forRoot(),

    // Feature modules
    AuthModule,
    UsersModule,
    TradingModule,
    PortfolioModule,
    ExchangeModule,
    AiModule,
    LicensingModule,
    AnalyticsModule,
    AlertsModule,
    AdminModule,
    RiskModule,
    BacktestingModule,
    WebSocketModule,
    NotificationsModule,
    MarketModule,
  ],
})
export class AppModule {}
