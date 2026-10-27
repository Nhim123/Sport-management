import { prisma } from '../../config/db';

export function getPayMethods() {
  return prisma.payMethod.findMany({
    orderBy: { sort: 'asc' },
    select: { id: true, logo: true, title: true, sub: true, tone: true, warn: true },
  });
}
