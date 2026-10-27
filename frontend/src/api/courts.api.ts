import type { Court } from '../types/domain';
import { client, mockDelay, USE_MOCK } from './client';
import { COURTS, TAKEN_FUTURE, TAKEN_TODAY } from '../mocks/data';

export async function getCourts(): Promise<Court[]> {
  if (USE_MOCK) return mockDelay(COURTS);
  const { data } = await client.get<Court[]>('/courts');
  return data;
}

/** Danh sách giờ đã kín của một sân trong ngày (dayIndex: 0 = hôm nay) */
export async function getTakenSlots(courtId: string, dayIndex: number): Promise<number[]> {
  if (USE_MOCK) {
    const taken = dayIndex === 0 ? TAKEN_TODAY[courtId] ?? [] : TAKEN_FUTURE;
    return mockDelay(taken);
  }
  const { data } = await client.get<number[]>(`/courts/${courtId}/taken`, { params: { day: dayIndex } });
  return data;
}
