// API cho chế độ quản lý (nhân viên).
// Backend chưa có endpoint quản lý (/admin/*) nên lớp này chạy bằng dữ liệu mẫu trong bộ nhớ,
// giữ nguyên chữ ký hàm để khi có API chỉ cần thay thân hàm bằng client.get/post.
import type { AdminBooking, AdminMember, CourtLive, Tournament } from '../types/admin';
import { mockDelay } from './client';
import {
  BOOKINGS,
  CLOSE_HOUR,
  DASHBOARD,
  MEMBERS,
  MONTH_REPORT,
  PLANS,
  RENEW_PLANS,
  STAFF,
  TOURNAMENTS,
} from '../mocks/admin';

export { CLOSE_HOUR, NOW_HOUR, OPEN_HOUR } from '../mocks/admin';

let bookings: AdminBooking[] = BOOKINGS.map((b) => ({ ...b }));
let members: AdminMember[] = MEMBERS.map((m) => ({ ...m, payments: [...m.payments] }));
let tournaments: Tournament[] = TOURNAMENTS.map((t) => ({ ...t }));

// ---------- Tổng quan ----------
export const getDashboard = () => mockDelay(DASHBOARD);

// ---------- Lịch sân ----------
export const getDayBookings = () => mockDelay(bookings.map((b) => ({ ...b })));

export function isFree(list: AdminBooking[], courtId: string, start: number, span: number) {
  return !list.some((b) => b.courtId === courtId && b.start < start + span && start < b.start + b.span);
}

export async function createDayBooking(input: Omit<AdminBooking, 'id'>): Promise<AdminBooking> {
  if (!isFree(bookings, input.courtId, input.start, input.span) || input.start + input.span > CLOSE_HOUR) {
    throw new Error('Khung giờ này đã có người đặt hoặc quá giờ đóng cửa.');
  }
  const created = { ...input, id: 'n' + Date.now().toString(36) };
  bookings = [...bookings, created];
  return mockDelay(created, 250);
}

export async function updateBooking(id: string, patch: Partial<Omit<AdminBooking, 'id'>>) {
  bookings = bookings.map((b) => (b.id === id ? { ...b, ...patch } : b));
  return mockDelay(true, 200);
}

export async function removeBooking(id: string) {
  bookings = bookings.filter((b) => b.id !== id);
  return mockDelay(true, 200);
}

/** Trạng thái một sân tại thời điểm t (giờ thập phân) – cùng quy tắc với website */
export function courtLive(courtId: string, list: AdminBooking[], t: number): CourtLive {
  const mine = list.filter((b) => b.courtId === courtId).sort((a, b) => a.start - b.start);
  const current = mine.find((b) => b.start <= t && t < b.start + b.span);
  const next = mine.find((b) => b.start > t);
  if (current) {
    const kind = current.state === 'booked' ? 'inUse' : current.state;
    return { courtId, kind, current, next, minutesLeft: Math.round((current.start + current.span - t) * 60), progress: (t - current.start) / current.span };
  }
  const minutesLeft = Math.round(((next ? next.start : CLOSE_HOUR) - t) * 60);
  return { courtId, kind: next && minutesLeft <= 30 ? 'soon' : 'free', next, minutesLeft, progress: 0 };
}

// ---------- Hội viên ----------
export const getMembers = () => mockDelay(members.map((m) => ({ ...m })));

export async function getMember(code: string) {
  const m = members.find((x) => x.code === code);
  if (!m) throw new Error('Không tìm thấy hội viên.');
  return mockDelay({ ...m });
}

export async function checkInMember(code: string) {
  members = members.map((m) => (m.code === code ? { ...m, inside: !m.inside, last: m.inside ? 'Hôm nay 19:00' : 'Đang ở phòng tập' } : m));
  return mockDelay(true, 200);
}

/** Gia hạn theo gói (chỉ số trong RENEW_PLANS); hạn mới tính từ hôm nay 18/10/2026 */
export async function renewMember(code: string, planIndex: number, method: string) {
  const [plan, months, price] = RENEW_PLANS[planIndex];
  const end = new Date(2026, 9 + months, 18);
  const exp = `${String(end.getDate()).padStart(2, '0')}/${String(end.getMonth() + 1).padStart(2, '0')}/${end.getFullYear()}`;
  members = members.map((m) =>
    m.code === code
      ? {
          ...m,
          plan,
          exp,
          group: 'active',
          status: 'Đang hoạt động',
          tone: 'success',
          period: `18/10/2026 – ${exp}`,
          usedPct: 0,
          remain: `${months * 30} ngày`,
          payments: [{ what: `Gia hạn ${plan}`, when: '18/10/2026', method, amount: price }, ...m.payments],
        }
      : m,
  );
  return mockDelay({ plan, exp, price }, 300);
}

export const getRenewPlans = () => RENEW_PLANS;

// ---------- Giải đấu ----------
export const getTournaments = () => mockDelay(tournaments.map((t) => ({ ...t })));

export async function getTournament(id: string) {
  const t = tournaments.find((x) => x.id === id);
  if (!t) throw new Error('Không tìm thấy giải đấu.');
  return mockDelay({ ...t });
}

export async function setTournamentStatus(id: string, status: Tournament['status']) {
  tournaments = tournaments.map((t) => (t.id === id ? { ...t, status } : t));
  return mockDelay(true, 200);
}

// ---------- Gói tập, nhân viên, báo cáo ----------
export const getPlans = () => mockDelay(PLANS);
export const getStaff = () => mockDelay(STAFF);
export const getMonthReport = () => mockDelay(MONTH_REPORT);
