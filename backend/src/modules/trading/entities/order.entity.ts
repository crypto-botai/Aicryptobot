import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  Index, ManyToOne, JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../users/user.entity';

@Entity('orders')
@Index(['userId', 'createdAt'])
@Index(['symbol', 'status'])
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_order_id', unique: true })
  clientOrderId: string;

  @Column({ name: 'exchange_order_id', nullable: true })
  exchangeOrderId?: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'bot_id', nullable: true })
  botId?: string;

  @Column({ name: 'exchange_id' })
  exchangeId: string;

  @Column({ length: 20 })
  symbol: string;

  @Column({ enum: ['buy', 'sell'] })
  side: string;

  @Column({ enum: ['market', 'limit', 'stop_market', 'stop_limit'] })
  type: string;

  @Column({ enum: ['open', 'filled', 'partially_filled', 'cancelled', 'rejected'], default: 'open' })
  status: string;

  @Column({ type: 'numeric', precision: 20, scale: 8 })
  price: number;

  @Column({ type: 'numeric', precision: 20, scale: 8 })
  quantity: number;

  @Column({ name: 'filled_quantity', type: 'numeric', precision: 20, scale: 8, default: 0 })
  filledQuantity: number;

  @Column({ name: 'avg_fill_price', type: 'numeric', precision: 20, scale: 8, nullable: true })
  avgFillPrice?: number;

  @Column({ type: 'numeric', precision: 20, scale: 8, default: 0 })
  fee: number;

  @Column({ name: 'fee_currency', nullable: true })
  feeCurrency?: string;

  @Column({ enum: ['live', 'paper'], default: 'paper' })
  mode: string;

  @Column({ name: 'ai_validation', type: 'jsonb', nullable: true })
  aiValidation?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
