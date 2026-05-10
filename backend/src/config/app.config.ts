import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.APP_PORT ?? '3001', 10),
  secret: process.env.API_SECRET,
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY,
    iv: process.env.ENCRYPTION_IV,
  },
  ai: {
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    openaiKey: process.env.OPENAI_API_KEY,
    geminiKey: process.env.GEMINI_API_KEY,
    deepseekKey: process.env.DEEPSEEK_API_KEY,
    engineUrl: process.env.AI_ENGINE_URL ?? 'http://ai-engine:8000',
    engineKey: process.env.AI_ENGINE_API_KEY,
  },
  notifications: {
    telegramToken: process.env.TELEGRAM_BOT_TOKEN,
    discordWebhook: process.env.DISCORD_WEBHOOK_URL,
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? '587', 10),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM ?? 'noreply@aicryptobot.com',
    },
  },
  licensing: {
    masterKey: process.env.LICENSE_MASTER_KEY,
    encryptionSecret: process.env.LICENSE_ENCRYPTION_SECRET,
  },
}));
