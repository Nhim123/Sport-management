// API cho chế độ quản lý (nhân viên).
// Backend chưa có endpoint quản lý (/admin/*) nên lớp này chạy bằng dữ liệu mẫu trong bộ nhớ,
// giữ nguyên chữ ký hàm để khi có API chỉ cần thay thân hàm bằng client.get/post.
import { vnd } from '../lib/format';
import type { AdminBooking, AdminMember, ClassToday, CourtLive, ScanLogEntry, ScanResult, Tournament, Verdict } from '../types/admin';
import { mockDelay } from './client';
import { COURTS } from '../mocks/data';
import {
  BOOKINGS,
  CLOSE_HOUR,
  DASHBOARD,
  MEMBERS,
  MONTH_REPORT,
  NOW_HOUR,
  PLANS,
  RENEW_PLANS,
  STAFF,
  TOURNAMENTS,
} from '../mocks/admin';

export { CLOSE_HOUR, NOW_HOUR, OPEN_HOUR } from '../mocks/admin';

let bookings: AdminBooking[] = BOOKINGS.map((b) => ({ ...b }));
let members: AdminMember[] = MEMBERS.map((m) => ({ ...m, payments: [...m.payments] }));
let tournaments: Tournament[] = TOURNAMENTS.map((t) => ({ ...t }));
let classes: ClassToday[] = DASHBOARD.classes.map((k) => ({ ...k, roster: [...k.roster], attended: [...k.attended] }));
let scanLog: ScanLogEntry[] = [];

// ---------- Tổng quan ----------
export const getDashboard = () => mockDelay({ ...DASHBOARD, classes: classes.map((k) => ({ ...k })) });

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

// ---------- Quét QR check-in ----------
// Mã khách nhận khi đặt sân / ghi danh lớp:
//   ARENA:BK:<mã đặt sân>              vé sân
//   ARENA:CL:<mã lớp>:<mã hội viên>     vé lớp
//   ARENA:MB:<mã hội viên>              thẻ hội viên (chọn lớp khi quét)
// Nhập tay chấp nhận cả mã trần: "AR-00421", "b12".

type Parsed = { type: 'booking'; id: string } | { type: 'class'; classId: string; member: string } | { type: 'member'; member: string };

const normMember = (s: string) => {
  const d = s.replace(/\D/g, '');
  return d ? 'AR-' + d.padStart(5, '0') : '';
};

export function parseQr(raw: string): Parsed | null {
  const s = raw.trim();
  const parts = s.split(':').map((x) => x.trim());
  if (parts[0]?.toUpperCase() === 'ARENA') {
    const [, kind = '', a, b] = parts;
    if (kind.toUpperCase() === 'BK' && a) return { type: 'booking', id: a.toLowerCase() };
    if (kind.toUpperCase() === 'CL' && a && b) return { type: 'class', classId: a.toLowerCase(), member: normMember(b) };
    if (kind.toUpperCase() === 'MB' && a) return { type: 'member', member: normMember(a) };
    return null;
  }
  if (/^ar-?\d{3,5}$/i.test(s)) return { type: 'member', member: normMember(s) };
  if (/^b\d+$/i.test(s)) return { type: 'booking', id: s.toLowerCase() };
  return null;
}

/** 19.5 -> "19:30" */
export const hm = (t: number) => {
  const m = Math.round(t * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
const classStart = (k: ClassToday) => {
  const [h, m] = k.time.split(':').map(Number);
  return h + m / 60;
};
const courtName = (id: string) => COURTS.find((x) => x.id === id)?.name ?? id;
const courtSport = (id: string) => COURTS.find((x) => x.id === id)?.sport ?? 'cl';
const nowLabel = () => hm(NOW_HOUR);

/** Mở check-in trước giờ bắt đầu / cho vào trễ tối đa (giờ) */
const COURT_EARLY = 0.25;
const CLASS_EARLY = 0.5;
const CLASS_LATE = 0.5;

const deny = (title: string, ...notes: string[]): Verdict => ({ ok: false, tone: 'danger', title, notes });
const pass = (title: string, notes: string[]): Verdict => ({ ok: true, tone: notes.length ? 'warning' : 'success', title, notes });

export const bookingPrice = (b: AdminBooking) => (COURTS.find((x) => x.id === b.courtId)?.price ?? 0) * b.span;

function bookingVerdict(b: AdminBooking): Verdict {
  const t = NOW_HOUR;
  const end = b.start + b.span;
  if (b.state === 'blocked' || b.state === 'class') return deny('Không phải vé đặt sân', `${b.label} là lịch ${b.state === 'class' ? 'lớp học' : 'khóa sân'}.`);
  if (b.checkedIn) return { ok: false, tone: 'warning', title: 'Vé đã được dùng', notes: [`${b.label} đã check-in${b.checkedInAt ? ' lúc ' + b.checkedInAt : ''}.`] };
  if (t < b.start - COURT_EARLY) return deny('Chưa tới giờ vào sân', `Giờ đặt ${hm(b.start)} – ${hm(end)}, mở check-in lúc ${hm(b.start - COURT_EARLY)}.`);
  if (t >= end) return deny('Đã hết giờ đặt sân', `Giờ đặt ${hm(b.start)} – ${hm(end)}.`);
  const notes: string[] = [];
  if (b.state === 'pending') notes.push(`Chưa cọc – thu ${vnd(bookingPrice(b))} trước khi cho vào sân.`);
  if (t > b.start + COURT_EARLY) notes.push(`Đến trễ ${Math.round((t - b.start) * 60)} phút – vẫn kết thúc lúc ${hm(end)}.`);
  return pass('Hợp lệ – mời vào sân', notes);
}

/** Điều kiện gói tập của hội viên: lý do chặn (nếu có) và các lưu ý */
function memberChecks(m: AdminMember): { block?: Verdict; notes: string[] } {
  if (m.group === 'expired') return { block: deny('Gói tập đã hết hạn', `${m.plan} hết hạn ${m.exp} – cần gia hạn trước khi vào.`), notes: [] };
  if (m.group === 'paused') return { block: deny('Hội viên đang bảo lưu', `${m.period}.`), notes: [] };
  const notes: string[] = [];
  if (m.group === 'expiring') notes.push(`Gói sắp hết: còn ${m.remain}.`);
  if (m.debt > 0) notes.push(`Còn nợ ${vnd(m.debt)}.`);
  return { notes };
}

function classVerdict(k: ClassToday, m: AdminMember, enrolled: boolean, ticket: boolean): Verdict {
  const t = NOW_HOUR;
  const start = classStart(k);
  const { block, notes } = memberChecks(m);
  if (block) return block;
  if (k.attended.includes(m.code)) return { ok: false, tone: 'warning', title: 'Đã vào lớp rồi', notes: [`${m.name} đã check-in lớp ${k.name}.`] };
  if (ticket && !enrolled) return deny('Vé không thuộc lớp này', `${m.name} chưa đăng ký ${k.name} ${k.time}.`);
  if (t < start - CLASS_EARLY) return deny('Chưa mở check-in', `${k.name} bắt đầu ${k.time}, mở check-in lúc ${hm(start - CLASS_EARLY)}.`);
  if (t > start + CLASS_LATE || t >= start + k.mins / 60) return deny('Đã quá giờ vào lớp', `${k.name} bắt đầu ${k.time}; chỉ nhận vào trễ tối đa ${CLASS_LATE * 60} phút.`);
  if (!enrolled) {
    if (k.booked >= k.cap) return deny('Lớp đã đủ chỗ', `${k.name} đã kín ${k.booked}/${k.cap}.`);
    notes.unshift(`Chưa đăng ký – sẽ ghi danh vào lớp (còn ${k.cap - k.booked} chỗ).`);
  }
  if (t > start + 10 / 60) notes.push(`Vào trễ ${Math.round((t - start) * 60)} phút.`);
  return pass('Hợp lệ – mời vào lớp', notes);
}

/** Đọc mã QR (hoặc mã nhập tay) và kiểm tra điều kiện vào sân / vào lớp */
export async function resolveQr(raw: string): Promise<ScanResult> {
  const code = raw.trim();
  const p = parseQr(code);
  await mockDelay(null, 250);
  if (!p) return { kind: 'invalid', code, verdict: deny('Mã không hợp lệ', 'Đây không phải mã vé hoặc thẻ hội viên của Arena.') };

  if (p.type === 'booking') {
    const b = bookings.find((x) => x.id === p.id);
    if (!b) return { kind: 'invalid', code, verdict: deny('Không tìm thấy lượt đặt sân', 'Lượt đặt có thể đã bị hủy hoặc không thuộc hôm nay.') };
    return { kind: 'booking', code, booking: { ...b }, courtName: courtName(b.courtId), sport: courtSport(b.courtId), verdict: bookingVerdict(b) };
  }

  const m = members.find((x) => x.code === p.member);
  if (!m) return { kind: 'invalid', code, verdict: deny('Không tìm thấy hội viên', `Mã ${p.member || code} không có trong danh sách hội viên.`) };

  if (p.type === 'class') {
    const k = classes.find((x) => x.id === p.classId);
    if (!k) return { kind: 'invalid', code, verdict: deny('Không tìm thấy lớp', 'Lớp không có trong lịch hôm nay.') };
    const enrolled = k.roster.includes(m.code);
    return { kind: 'class', code, cls: { ...k }, member: { ...m }, enrolled, verdict: classVerdict(k, m, enrolled, true) };
  }

  // Thẻ hội viên: các lớp đang mở check-in + lớp đã đăng ký chưa quá giờ (thẻ bị chặn thì không liệt kê)
  const t = NOW_HOUR;
  const { block, notes } = memberChecks(m);
  const options = block ? [] : classes
    .filter((k) => {
      const start = classStart(k);
      const open = t >= start - CLASS_EARLY && t <= start + CLASS_LATE;
      return open || (k.roster.includes(m.code) && t <= start + CLASS_LATE);
    })
    .map((k) => {
      const enrolled = k.roster.includes(m.code);
      return { cls: { ...k }, enrolled, verdict: classVerdict(k, m, enrolled, false) };
    });
  const verdict: Verdict = block ?? (options.length ? pass('Chọn lớp để check-in', notes) : { ok: false, tone: 'warning', title: 'Không có lớp đang mở check-in', notes });
  return { kind: 'member', code, member: { ...m }, options, verdict };
}

function log(entry: Omit<ScanLogEntry, 'id' | 'at'>) {
  scanLog = [{ ...entry, id: 's' + Date.now().toString(36), at: nowLabel() }, ...scanLog];
}

/** Xác nhận vào sân; vé chưa cọc phải xác nhận đã thu tiền */
export async function confirmCourtEntry(id: string, collected = false) {
  const b = bookings.find((x) => x.id === id);
  if (!b) throw new Error('Không tìm thấy lượt đặt sân.');
  const v = bookingVerdict(b);
  if (!v.ok) throw new Error(v.title);
  if (b.state === 'pending' && !collected) throw new Error('Cần thu cọc trước khi cho vào sân.');
  bookings = bookings.map((x) => (x.id === id ? { ...x, state: 'booked', sub: undefined, checkedIn: true, checkedInAt: nowLabel() } : x));
  log({ kind: 'booking', sport: courtSport(b.courtId), title: b.label, sub: `${courtName(b.courtId)} · ${hm(b.start)} – ${hm(b.start + b.span)}` });
  return mockDelay(true, 250);
}

/** Xác nhận vào lớp; hội viên chưa đăng ký được ghi danh nếu lớp còn chỗ */
export async function confirmClassEntry(classId: string, memberCode: string) {
  const k = classes.find((x) => x.id === classId);
  const m = members.find((x) => x.code === memberCode);
  if (!k || !m) throw new Error('Không tìm thấy lớp hoặc hội viên.');
  const enrolled = k.roster.includes(m.code);
  const v = classVerdict(k, m, enrolled, false);
  if (!v.ok) throw new Error(v.title);
  classes = classes.map((x) =>
    x.id === classId
      ? { ...x, roster: enrolled ? x.roster : [...x.roster, m.code], booked: enrolled ? x.booked : x.booked + 1, attended: [...x.attended, m.code], present: x.present + 1 }
      : x,
  );
  members = members.map((x) => (x.code === memberCode ? { ...x, inside: true, last: 'Đang ở phòng tập' } : x));
  log({ kind: 'class', sport: k.sport, title: m.name, sub: `${k.name} · ${k.time} · ${k.room}` });
  return mockDelay(true, 250);
}

export const getScanLog = () => mockDelay(scanLog.map((e) => ({ ...e })), 100);

/** Mã mẫu để thử khi không có camera (chỉ hiện ở bản phát triển) */
export const SAMPLE_CODES: { label: string; code: string }[] = [
  { label: 'Vé sân · Team Q7', code: 'ARENA:BK:b11' },
  { label: 'Vé sân chưa cọc', code: 'ARENA:BK:b18' },
  { label: 'Vé lớp · Vinyasa', code: 'ARENA:CL:c1900:AR-00512' },
  { label: 'Thẻ · Minh Anh', code: 'ARENA:MB:AR-00421' },
  { label: 'Thẻ hết hạn', code: 'ARENA:MB:AR-00197' },
  { label: 'Vé đã dùng', code: 'ARENA:BK:b3' },
];
