import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('exchange_connections')
@Index(['userId', 'exchangeId'])
export class ExchangeConnectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'exchange_id' })
  exchangeId: string;

  @Column({ length: 100, nullable: true })
  label?: string;

  @Column({ name: 'api_key_encrypted', type: 'text' })
  apiKeyEncrypted: string;

  @Column({ name: 'api_secret_encrypted', type: 'text' })
  apiSecretEncrypted: string;

  @Column({ name: 'passphrase_encrypted', type: 'text', nullable: true })
  passphraseEncrypted?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ type: 'jsonb', nullable: true })
  permissions?: string[];

  @Column({ name: 'last_verified_at', nullable: true })
  lastVerifiedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
