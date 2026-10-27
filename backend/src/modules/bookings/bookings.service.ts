import { prisma } from '../../config/db';
import { HttpError } from '../../middlewares/errorHandler';
import type { CreateBookingInput } from './bookings.schema';

const MEMBER_DISCOUNT = 0.1;
const RACKET_RENT = 30000;

function makeCode() {
  return 'ĐS-' + String(7000 + Math.floor(Math.random() * 2999));
}

export async function createBooking(input: CreateBookingInput) {
  const court = await prisma.court.findUnique({ where: { id: input.courtId } });
  if (!court) throw new HttpError(404, 'Không tìm thấy sân');

  const clash = await prisma.booking.findUnique({
    where: { courtId_dayIndex_hour: { courtId: input.courtId, dayIndex: input.dayIndex, hour: input.hour } },
  });
  if (clash) throw new HttpError(409, 'Khung giờ này đã có người đặt');

  const discount = Math.round(court.price * MEMBER_DISCOUNT);
  const total = court.price - discount + (input.racket ? RACKET_RENT : 0);

  const booking = await prisma.booking.create({
    data: {
      code: makeCode(),
      courtId: input.courtId,
      dayIndex: input.dayIndex,
      hour: input.hour,
      racket: input.racket,
      method: input.method,
      total,
    },
    select: { code: true, courtId: true, dayIndex: true, hour: true, total: true },
  });

  return booking;
}
