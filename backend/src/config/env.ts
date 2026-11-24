import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://arena:arena@localhost:5432/arena',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
};
