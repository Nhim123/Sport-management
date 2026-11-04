import type { ClubSetup, Court } from '../types/domain';
import { client, mockDelay, USE_MOCK } from './client';
import { TODAY_ISO, weekday } from '../lib/recurring';
import { CLUB_SETUP, COURTS, TAKEN_FUTURE, TAKEN_TODAY } from '../mocks/data';

export async function getCourts(): Promise<Court[]> {
  if (USE_MOCK) return mockDelay(COURTS);
  const { data } = await client.get<Court[]>('/courts');
  return data;
}

/** Thiết lập của chủ sân: ngày mở cửa & các ca cố định */
export async function getCourtSetup(): Promise<ClubSetup> {
  if (USE_MOCK) return mockDelay(CLUB_SETUP);
  const { data } = await client.get<ClubSetup>('/courts/setup');
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

const TODAY_WD = weekday(TODAY_ISO); // 6 = CN theo dữ liệu mẫu

export interface WeekSlot {
  day: number; // 0 = T2 … 6 = CN
  start: number; // giờ bắt đầu ca
  span: number; // số giờ của ca
}

/** Giờ đã đặt (paid) và đang chờ thanh toán (pending) của một thứ trong tuần */
export interface WeekTakenDay {
  booked: number[];
  pending: number[];
}
export type WeekTaken = Record<number, WeekTakenDay>;

interface WeekBookingRec {
  id: string;
  courtId: string;
  customer: string;
  phone: string;
  slots: WeekSlot[];
  total: number;
  paid: boolean; // chủ sân đã xác nhận nhận thanh toán?
}

/** Các lượt khách đặt theo ca trong phiên này (mock) */
let WEEK_BOOKINGS: WeekBookingRec[] = [];

const courtPrice = (courtId: string) => COURTS.find((x) => x.id === courtId)?.price ?? 0;

/** Các giờ của một lượt đặt rơi vào thứ `day` */
function hoursOf(slots: WeekSlot[], day: number): number[] {
  const out: number[] = [];
  for (const s of slots) if (s.day === day) for (let h = s.start; h < s.start + s.span; h++) out.push(h);
  return out;
}

/** Lịch kín cả tuần của một sân: đã đặt vs đang chờ thanh toán */
function weekStatus(courtId: string): WeekTaken {
  const mine = WEEK_BOOKINGS.filter((b) => b.courtId === courtId);
  const out: WeekTaken = {};
  for (let d = 0; d < 7; d++) {
    const booked = new Set(d === TODAY_WD ? TAKEN_TODAY[courtId] ?? [] : TAKEN_FUTURE);
    const pending = new Set<number>();
    for (const b of mine) for (const h of hoursOf(b.slots, d)) (b.paid ? booked : pending).add(h);
    out[d] = { booked: [...booked].sort((a, b) => a - b), pending: [...pending].sort((a, b) => a - b) };
  }
  return out;
}

export async function getWeekTaken(courtId: string): Promise<WeekTaken> {
  if (USE_MOCK) return mockDelay(weekStatus(courtId));
  const { data } = await client.get<WeekTaken>(`/courts/${courtId}/week`);
  return data;
}

/** Khách đặt nhiều ca trong tuần – tạo lượt chờ chủ sân xác nhận thanh toán */
export async function bookWeekSlots(courtId: string, customer: string, phone: string, slots: WeekSlot[]): Promise<{ id: string; count: number; total: number }> {
  if (USE_MOCK) {
    const st = weekStatus(courtId);
    for (const s of slots) {
      for (let h = s.start; h < s.start + s.span; h++) {
        const day = st[s.day];
        if (day && (day.booked.includes(h) || day.pending.includes(h))) throw new Error('Một ca vừa chọn đã có người đặt. Hãy tải lại và chọn lại.');
      }
    }
    const total = slots.reduce((sum, s) => sum + courtPrice(courtId) * s.span, 0);
    const rec: WeekBookingRec = { id: 'wb' + Date.now().toString(36), courtId, customer, phone, slots, total, paid: false };
    WEEK_BOOKINGS = [rec, ...WEEK_BOOKINGS];
    return mockDelay({ id: rec.id, count: slots.length, total }, 250);
  }
  const { data } = await client.post<{ id: string; count: number; total: number }>(`/courts/${courtId}/book-week`, { customer, phone, slots });
  return data;
}

/** Chủ sân xác nhận đã nhận thanh toán → lượt đặt chuyển sang đã đặt */
export function markWeekPaid(id: string): { courtId: string } | null {
  const rec = WEEK_BOOKINGS.find((b) => b.id === id);
  if (!rec) return null;
  rec.paid = true;
  return { courtId: rec.courtId };
}
