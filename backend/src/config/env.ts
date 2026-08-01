import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'inka-development-secret',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  appPublicUrl: process.env.APP_PUBLIC_URL ?? 'http://localhost:4000',
  resendApiKey: process.env.RESEND_API_KEY?.trim() || '',
  mailFrom: process.env.MAIL_FROM?.trim() || 'Inka <onboarding@resend.dev>',
  /** When true (default outside production), forgot-password response includes the raw token for local testing. */
  exposeDevResetToken:
    process.env.EXPOSE_DEV_RESET_TOKEN === 'true' ||
    (process.env.EXPOSE_DEV_RESET_TOKEN !== 'false' && (process.env.NODE_ENV ?? 'development') !== 'production'),
};

if (!env.databaseUrl && process.env.NODE_ENV !== 'test') {
  console.warn('DATABASE_URL is not set. Prisma commands and API database access will fail until it is configured.');
}
