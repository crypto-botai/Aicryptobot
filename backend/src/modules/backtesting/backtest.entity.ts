import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('backtests')
export class BacktestEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'user_id' }) userId: string;
  @Column({ type: 'jsonb' }) config: Record<string,unknown>;
  @Column({ enum: ['pending','running','completed','failed'], default: 'pending' }) status: string;
  @Column({ type: 'numeric', nullable: true }) progress?: number;
  @Column({ type: 'jsonb', nullable: true }) metrics?: Record<string,unknown>;
  @Column({ type: 'jsonb', nullable: true }) trades?: Record<string,unknown>[];
  @Column({ type: 'jsonb', nullable: true }) equityCurve?: Record<string,unknown>[];
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
