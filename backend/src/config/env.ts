import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'inka-development-secret',
};

if (!env.databaseUrl && process.env.NODE_ENV !== 'test') {
  console.warn('DATABASE_URL is not set. Prisma commands and API database access will fail until it is configured.');
}
