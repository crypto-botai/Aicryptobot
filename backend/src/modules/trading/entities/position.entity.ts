import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('positions')
@Index(['userId', 'status'])
@Index(['symbol', 'exchangeId'])
export class PositionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'bot_id', nullable: true })
  botId?: string;

  @Column({ name: 'exchange_id' })
  exchangeId: string;

  @Column({ length: 20 })
  symbol: string;

  @Column({ enum: ['long', 'short', 'both'] })
  side: string;

  @Column({ name: 'market_type', enum: ['spot', 'futures', 'margin'] })
  marketType: string;

  @Column({ type: 'numeric', precision: 20, scale: 8 })
  size: number;

  @Column({ name: 'entry_price', type: 'numeric', precision: 20, scale: 8 })
  entryPrice: number;

  @Column({ name: 'mark_price', type: 'numeric', precision: 20, scale: 8, nullable: true })
  markPrice?: number;

  @Column({ type: 'numeric', precision: 20, scale: 8, default: 0 })
  pnl: number;

  @Column({ name: 'pnl_percent', type: 'numeric', precision: 10, scale: 4, default: 0 })
  pnlPercent: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  leverage?: number;

  @Column({ name: 'liquidation_price', type: 'numeric', precision: 20, scale: 8, nullable: true })
  liquidationPrice?: number;

  @Column({ name: 'stop_loss', type: 'numeric', precision: 20, scale: 8, nullable: true })
  stopLoss?: number;

  @Column({ name: 'take_profit', type: 'numeric', precision: 20, scale: 8, nullable: true })
  takeProfit?: number;

  @Column({ name: 'trailing_stop', type: 'numeric', precision: 10, scale: 4, nullable: true })
  trailingStop?: number;

  @Column({ enum: ['live', 'paper'], default: 'paper' })
  mode: string;

  @Column({ enum: ['open', 'closed'], default: 'open' })
  status: string;

  @Column({ name: 'closed_at', nullable: true })
  closedAt?: Date;

  @Column({ name: 'closed_pnl', type: 'numeric', precision: 20, scale: 8, nullable: true })
  closedPnl?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
