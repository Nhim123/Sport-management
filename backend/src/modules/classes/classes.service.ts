import { prisma } from '../../config/db';

export function getTonightClasses() {
  return prisma.classSession.findMany({
    orderBy: { time: 'desc' },
    select: { id: true, time: true, name: true, sub: true, full: true },
  });
}
