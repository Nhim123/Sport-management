import type { Booking, CreateBookingInput } from '../types/domain';
import { client, mockDelay, USE_MOCK } from './client';

/** Tạo một lượt đặt sân. Mock trả về mã ĐS ngẫu nhiên; BE thật trả về bản ghi đã lưu. */
export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  if (USE_MOCK) {
    const code = 'ĐS-' + String(7000 + Math.floor(Math.random() * 999));
    return mockDelay<Booking>({ code, courtId: input.courtId, dayIndex: input.dayIndex, hour: input.hour, total: 0 }, 400);
  }
  const { data } = await client.post<Booking>('/bookings', input);
  return data;
}
