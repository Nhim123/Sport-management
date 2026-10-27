import { prisma } from '../../config/db';
import { HttpError } from '../../middlewares/errorHandler';

/** Hồ sơ hội viên hiện tại (bản demo: lấy member đầu tiên). */
export async function getMe() {
  const me = await prisma.member.findFirst({
    select: { firstName: true, plan: true, daysLeft: true, until: true, ptLeft: true, usedPct: true },
  });
  if (!me) throw new HttpError(404, 'Chưa có hội viên');
  return me;
}

export async function getMySchedule() {
  const me = await prisma.member.findFirst({ select: { id: true } });
  if (!me) return [];
  return prisma.scheduleItem.findMany({
    where: { memberId: me.id },
    orderBy: { sort: 'asc' },
    select: { id: true, tag: true, time: true, title: true, sub: true, tone: true, upcoming: true },
  });
}
