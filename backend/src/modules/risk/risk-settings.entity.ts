import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('risk_settings')
export class RiskSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @Column({ name: 'max_daily_loss_percent', type: 'numeric', precision: 5, scale: 2, default: 5 })
  maxDailyLossPercent: number;

  @Column({ name: 'max_position_size_percent', type: 'numeric', precision: 5, scale: 2, default: 10 })
  maxPositionSizePercent: number;

  @Column({ name: 'max_drawdown_percent', type: 'numeric', precision: 5, scale: 2, default: 20 })
  maxDrawdownPercent: number;

  @Column({ name: 'max_open_positions', default: 10 })
  maxOpenPositions: number;

  @Column({ name: 'max_leverage', type: 'numeric', precision: 5, scale: 1, default: 10 })
  maxLeverage: number;

  @Column({ name: 'emergency_stop', default: false })
  emergencyStop: boolean;

  @Column({ name: 'pause_on_volatility', default: true })
  pauseOnVolatility: boolean;

  @Column({ name: 'volatility_threshold', type: 'numeric', precision: 5, scale: 2, default: 15 })
  volatilityThreshold: number;

  @Column({ name: 'daily_pnl', type: 'numeric', precision: 20, scale: 8, default: 0 })
  dailyPnl: number;

  @Column({ name: 'daily_reset_at', nullable: true })
  dailyResetAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
