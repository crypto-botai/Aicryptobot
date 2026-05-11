import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('bots')
@Index(['userId', 'isRunning'])
export class BotEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'exchange_id' })
  exchangeId: string;

  @Column({ length: 20 })
  symbol: string;

  @Column({ name: 'market_type', enum: ['spot', 'futures', 'margin'] })
  marketType: string;

  @Column({ enum: ['scalping', 'swing', 'dca', 'grid', 'sniper', 'arbitrage'] })
  strategy: string;

  @Column({ enum: ['live', 'paper'], default: 'paper' })
  mode: string;

  @Column({ name: 'is_running', default: false })
  isRunning: boolean;

  @Column({ type: 'jsonb' })
  config: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  stats?: Record<string, unknown>;

  @Column({ name: 'started_at', nullable: true })
  startedAt?: Date;

  @Column({ name: 'stopped_at', nullable: true })
  stoppedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
