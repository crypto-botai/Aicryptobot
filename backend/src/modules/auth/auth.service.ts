import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { UserEntity } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const hash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      email: dto.email,
      username: dto.username,
      passwordHash: hash,
      role: 'user',
    });
    await this.userRepo.save(user);
    return { message: 'Registration successful. Await admin activation.' };
  }

  async validateUser(email: string, password: string): Promise<UserEntity | null> {
    const user = await this.userRepo.findOne({ where: { email }, select: ['id', 'email', 'passwordHash', 'isActive', 'twoFactorEnabled', 'twoFactorSecret', 'role'] });
    if (!user || !user.isActive) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: Omit<UserEntity, 'passwordHash'>; requires2FA?: boolean }> {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode) return { requires2FA: true } as never;
      const valid = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token: dto.twoFactorCode,
        window: 1,
      });
      if (!valid) throw new UnauthorizedException('Invalid 2FA code');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });

    const { passwordHash, twoFactorSecret, ...safeUser } = user;
    return { accessToken, user: safeUser as Omit<UserEntity, 'passwordHash'> };
  }

  async enable2FA(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    const secret = speakeasy.generateSecret({ name: 'AICryptoBot', length: 20 });
    await this.userRepo.update(userId, { twoFactorSecret: secret.base32 });
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);
    return { secret: secret.base32, qrCodeUrl };
  }

  async confirm2FA(userId: string, token: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId }, select: ['twoFactorSecret'] });
    if (!user?.twoFactorSecret) throw new BadRequestException('2FA setup not initiated');

    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!valid) throw new BadRequestException('Invalid token');

    await this.userRepo.update(userId, { twoFactorEnabled: true });
    return { message: '2FA enabled successfully' };
  }

  async refreshToken(userId: string): Promise<{ accessToken: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const payload = { sub: user.id, email: user.email, role: user.role };
    return { accessToken: this.jwtService.sign(payload) };
  }
}
