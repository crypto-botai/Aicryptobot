import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('ai_insights')
@Index(['userId', 'createdAt'])
export class AiInsightEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column({ enum: ['market_analysis', 'trade_suggestion', 'risk_alert', 'learning_update'] })
  type: string;

  @Column({ nullable: true, length: 20 })
  symbol?: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'numeric', precision: 5, scale: 4, default: 0.5 })
  confidence: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
