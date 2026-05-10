import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('trade_validations')
@Index(['symbol', 'createdAt'])
export class TradeValidationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column({ name: 'bot_id', nullable: true })
  botId?: string;

  @Column({ length: 20 })
  symbol: string;

  @Column({ length: 10 })
  side: string;

  @Column({ type: 'jsonb' })
  result: Record<string, unknown>;

  @Column({ default: false })
  approved: boolean;

  @Column({ name: 'overall_confidence', type: 'numeric', precision: 5, scale: 4 })
  overallConfidence: number;

  @Column({ name: 'trade_outcome', nullable: true })
  tradeOutcome?: string;

  @Column({ name: 'outcome_pnl', type: 'numeric', precision: 20, scale: 8, nullable: true })
  outcomePnl?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
