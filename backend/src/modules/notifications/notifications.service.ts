import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;
  constructor(private cfg: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: cfg.get('SMTP_HOST'), port: cfg.get<number>('SMTP_PORT', 587),
      auth: { user: cfg.get('SMTP_USER'), pass: cfg.get('SMTP_PASS') },
    });
  }
  async sendEmail(to: string, subject: string, html: string) {
    try { await this.transporter.sendMail({ from: this.cfg.get('SMTP_FROM'), to, subject, html }); }
    catch (e) { this.logger.warn('Email failed: ' + e); }
  }
}
