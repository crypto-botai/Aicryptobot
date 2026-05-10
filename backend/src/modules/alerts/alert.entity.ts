import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
@Entity('alerts')
@Index(['userId', 'isRead'])
export class AlertEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'user_id' }) userId: string;
  @Column({ enum: ['price','indicator','trade','risk','system','ai'] }) type: string;
  @Column({ enum: ['info','warning','critical'], default: 'info' }) severity: string;
  @Column({ length: 200 }) title: string;
  @Column({ type: 'text' }) message: string;
  @Column({ nullable: true, length: 20 }) symbol?: string;
  @Column({ name: 'is_read', default: false }) isRead: boolean;
  @Column({ type: 'jsonb', nullable: true }) channels?: string[];
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
