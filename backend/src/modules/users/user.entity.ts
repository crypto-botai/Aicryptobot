import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToMany, OneToOne,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ name: 'password_hash' })
  @Exclude()
  passwordHash: string;

  @Column({ default: 'user', enum: ['user', 'admin', 'superadmin'] })
  role: string;

  @Column({ name: 'is_active', default: false })
  isActive: boolean;

  @Column({ name: 'two_factor_enabled', default: false })
  twoFactorEnabled: boolean;

  @Column({ name: 'two_factor_secret', nullable: true })
  @Exclude()
  twoFactorSecret?: string;

  @Column({ nullable: true, length: 500 })
  avatar?: string;

  @Column({ name: 'telegram_chat_id', nullable: true })
  telegramChatId?: string;

  @Column({ name: 'telegram_username', nullable: true })
  telegramUsername?: string;

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt?: Date;

  @Column({ name: 'preferences', type: 'jsonb', nullable: true })
  preferences?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
