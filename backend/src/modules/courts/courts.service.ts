import { prisma } from '../../config/db';

const courtSelect = { id: true, name: true, kind: true, sport: true, price: true } as const;

export function getCourts() {
  return prisma.court.findMany({ orderBy: { id: 'asc' }, select: courtSelect });
}

/** Trả về danh sách giờ đã kín của một sân trong ngày (dayIndex: 0 = hôm nay). */
export async function getTakenSlots(courtId: string, dayIndex: number): Promise<number[]> {
  const rows = await prisma.booking.findMany({
    where: { courtId, dayIndex },
    select: { hour: true },
    orderBy: { hour: 'asc' },
  });
  return rows.map((r) => r.hour);
}
