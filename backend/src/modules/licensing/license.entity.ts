import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('licenses')
@Index(['key'], { unique: true })
@Index(['userId'])
export class LicenseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  key: string;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column({ name: 'assigned_email', nullable: true })
  assignedEmail?: string;

  @Column({ enum: ['monthly', 'quarterly', 'biannual', 'annual', 'enterprise'] })
  plan: string;

  @Column({ enum: ['active', 'expired', 'suspended', 'trial', 'unused'], default: 'unused' })
  status: string;

  @Column({ name: 'activated_at', nullable: true })
  activatedAt?: Date;

  @Column({ name: 'expires_at', nullable: true })
  expiresAt?: Date;

  @Column({ name: 'max_devices', default: 1 })
  maxDevices: number;

  @Column({ name: 'active_devices', default: 0 })
  activeDevices: number;

  @Column({ type: 'jsonb', nullable: true })
  features?: Record<string, unknown>;

  @Column({ nullable: true, length: 500 })
  notes?: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
