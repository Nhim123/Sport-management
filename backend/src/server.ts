import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/db';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`Arena API đang chạy tại http://localhost:${env.port}/api/v1`);
});

async function shutdown() {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
