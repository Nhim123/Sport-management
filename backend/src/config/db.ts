import { PrismaClient } from '@prisma/client';

// Một instance Prisma dùng chung cho toàn app.
export const prisma = new PrismaClient();
