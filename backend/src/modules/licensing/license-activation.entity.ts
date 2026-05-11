import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('license_activations')
@Index(['licenseId', 'deviceFingerprint'])
export class LicenseActivationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'license_id' })
  licenseId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'device_fingerprint', length: 64 })
  deviceFingerprint: string;

  @Column({ name: 'device_name', nullable: true })
  deviceName?: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', nullable: true, length: 500 })
  userAgent?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_seen_at', nullable: true })
  lastSeenAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
