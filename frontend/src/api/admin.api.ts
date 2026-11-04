// API cho chế độ quản lý (nhân viên).
// Backend chưa có endpoint quản lý (/admin/*) nên lớp này chạy bằng dữ liệu mẫu trong bộ nhớ,
// giữ nguyên chữ ký hàm để khi có API chỉ cần thay thân hàm bằng client.get/post.
import { vnd } from '../lib/format';
import type { AdminBooking, AdminMember, ClassToday, CourtLive, Notice, PlanStat, RecurringBooking, ScanLogEntry, ScanResult, Shift, StaffMember, Tournament, Verdict } from '../types/admin';
import { mockDelay } from './client';
import { markWeekPaid } from './courts.api';
import { addDays, conflicts, occurrences, TODAY_ISO } from '../lib/recurring';
import { COURTS } from '../mocks/data';
import {
  BOOKINGS,
  CLOSE_HOUR,
  DASHBOARD,
  MEMBERS,
  MONTH_REPORT,
  NOTICES,
  RECURRING,
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
let notices: Notice[] = NOTICES.map((n) => ({ ...n }));
let recurring: RecurringBooking[] = RECURRING.map((r) => ({ ...r, days: [...r.days], skips: [...r.skips] }));
let plans: PlanStat[] = PLANS.map((p) => ({ ...p, parts: p.parts.map((x) => ({ ...x })) }));
let staff: StaffMember[] = STAFF.map((s) => ({ ...s, week: [...s.week] }));

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

/** Tạo giải mới (chưa có người đăng ký) – trả về giải vừa tạo */
export async function createTournament(input: Omit<Tournament, 'id' | 'entrants'>): Promise<Tournament> {
  if (input.name.trim().length < 5) throw new Error('Tên giải cần ít nhất 5 ký tự.');
  if (tournaments.some((t) => t.name.trim().toLowerCase() === input.name.trim().toLowerCase())) throw new Error('Đã có giải trùng tên.');
  const created: Tournament = { ...input, name: input.name.trim(), id: 't-' + Date.now().toString(36), entrants: [] };
  tournaments = [created, ...tournaments];
  return mockDelay({ ...created }, 300);
}

export async function setTournamentStatus(id: string, status: Tournament['status']) {
  tournaments = tournaments.map((t) => (t.id === id ? { ...t, status } : t));
  return mockDelay(true, 200);
}

// ---------- Gói tập, nhân viên, báo cáo ----------
export const getPlans = () => mockDelay(plans.map((p) => ({ ...p })));

export type NewPlan = Omit<PlanStat, 'id' | 'sales' | 'active' | 'renewal' | 'expiring'>;

/** Câu lạc bộ tự ghép gói: gym, giờ sân, lớp, PT, bơi tuỳ ý; gói riêng gắn tên khách */
export async function createPlan(input: NewPlan): Promise<PlanStat> {
  if (!input.parts.length) throw new Error('Chọn ít nhất một thành phần cho gói.');
  if (!input.name.trim()) throw new Error('Nhập tên gói.');
  if (input.price <= 0) throw new Error('Nhập giá bán.');
  if (plans.some((p) => p.name.trim().toLowerCase() === input.name.trim().toLowerCase())) throw new Error('Đã có gói trùng tên.');
  const created: PlanStat = { ...input, name: input.name.trim(), id: 'p-' + Date.now().toString(36), sales: [0, 0, 0, 0, 0, 0], active: 0, renewal: null, expiring: 0 };
  plans = [created, ...plans];
  return mockDelay({ ...created }, 300);
}
export const getStaff = () => mockDelay(staff.map((s) => ({ ...s, week: [...s.week] })));

/** Xếp lịch ca: đặt ca của một nhân viên trong một ngày (0 = T2 … 6 = CN). Chỉ để nắm lịch, không chấm công. */
export async function setShift(staffId: string, day: number, shift: Shift) {
  const s = staff.find((x) => x.id === staffId);
  if (!s) throw new Error('Không tìm thấy nhân viên.');
  if (s.week[day] === 'P' && shift !== 'P') throw new Error(`${s.name} đang nghỉ phép ngày này.`);
  staff = staff.map((x) => (x.id === staffId ? { ...x, week: x.week.map((v, i) => (i === day ? shift : v)) } : x));
  return mockDelay(true, 150);
}
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

// ---------- Thông báo cần xác nhận ----------

export const getNotices = () => mockDelay(notices.map((n) => ({ ...n })), 150);

export type NewNotice = Omit<Notice, 'id' | 'at' | 'status' | 'resolvedAt' | 'resolvedBy'>;

/** Tạo thông báo mới cho chủ sân (VD: khách đặt sân xong, xin xác nhận thanh toán) */
export async function createNotice(input: NewNotice): Promise<Notice> {
  const created: Notice = { ...input, id: 'nt' + Date.now().toString(36), at: nowLabel(), status: 'pending' };
  notices = [created, ...notices];
  return mockDelay({ ...created }, 200);
}

function resolveNotice(id: string, status: Notice['status'], by: string, patch: Partial<Notice> = {}) {
  notices = notices.map((n) => (n.id === id ? { ...n, ...patch, status, resolvedAt: nowLabel(), resolvedBy: by } : n));
}

function pendingNotice(id: string) {
  const n = notices.find((x) => x.id === id);
  if (!n) throw new Error('Không tìm thấy thông báo.');
  if (n.status !== 'pending') throw new Error('Việc này đã được xử lý.');
  return n;
}

/**
 * Xác nhận: đặt sân online → xếp vào sân & giờ nhân viên chọn (mặc định theo yêu cầu của khách);
 * tiền cọc → chuyển lượt đặt sang đã cọc; gia hạn → gia hạn gói; bảo lưu → tạm dừng gói
 */
export async function confirmNotice(id: string, by: string, placement?: { courtId: string; start: number }) {
  const n = pendingNotice(id);
  let patch: Partial<Notice> = {};
  if (n.kind === 'booking' && n.booking) {
    const courtId = placement?.courtId ?? n.booking.courtId;
    const start = placement?.start ?? n.booking.start;
    if (!courtId) throw new Error('Chưa chọn sân để xếp.');
    if (start < NOW_HOUR) throw new Error('Không xếp được vào giờ đã qua.');
    await createDayBooking({ courtId, start, span: n.booking.span, state: 'booked', label: n.who.split(' · ')[0], sub: 'Đặt online' });
    patch = { detail: `${courtName(courtId)} · ${hm(start)} – ${hm(start + n.booking.span)}`, booking: { ...n.booking, courtId, start } };
  } else if (n.kind === 'deposit' && n.bookingId) {
    if (!bookings.some((b) => b.id === n.bookingId)) throw new Error('Lượt đặt sân này đã bị hủy.');
    await updateBooking(n.bookingId, { state: 'booked', sub: undefined });
  } else if (n.kind === 'renewal' && n.memberCode && n.planIndex !== undefined) {
    await renewMember(n.memberCode, n.planIndex, 'Chuyển khoản');
  } else if (n.kind === 'payment' && n.weekBookingId) {
    markWeekPaid(n.weekBookingId); // chuyển lượt đặt theo ca sang đã thanh toán
  } else if (n.kind === 'freeze' && n.memberCode) {
    members = members.map((m) =>
      m.code === n.memberCode
        ? { ...m, group: 'paused', status: 'Bảo lưu', tone: 'neutral', exp: 'Bảo lưu đến 17/11', period: 'Bảo lưu 19/10 – 17/11', remain: 'Bảo lưu', inside: false }
        : m,
    );
  }
  resolveNotice(id, 'confirmed', by, patch);
  return mockDelay(true, 200);
}

export async function rejectNotice(id: string, by: string, reason: string) {
  pendingNotice(id);
  resolveNotice(id, 'rejected', by, { reason });
  return mockDelay(true, 200);
}

// ---------- Đặt sân định kỳ ----------

export const getRecurring = () => mockDelay(recurring.map((r) => ({ ...r, days: [...r.days], skips: [...r.skips] })));

export type NewRecurring = Omit<RecurringBooking, 'id' | 'status' | 'paidSessions'>;

/** Tạo hợp đồng định kỳ; buổi trùng lịch thì báo lỗi, hoặc ghi thành ngày nghỉ nếu chọn bỏ qua */
export async function createRecurring(input: NewRecurring, skipConflicts = false): Promise<RecurringBooking> {
  if (!input.club.trim()) throw new Error('Nhập tên câu lạc bộ / nhóm.');
  if (!input.days.length) throw new Error('Chọn ít nhất một thứ trong tuần.');
  if (input.start + input.span > 23) throw new Error('Khung giờ vượt quá giờ đóng cửa (23:00).');
  const clash = conflicts(input, recurring, bookings);
  if (clash.length && !skipConflicts) throw new Error(`Trùng lịch ${clash.length} buổi – chọn “Bỏ qua buổi trùng” hoặc đổi sân / giờ.`);
  const skips = [...input.skips, ...clash.map((x) => x.date)];
  const created: RecurringBooking = {
    ...input,
    club: input.club.trim(),
    skips,
    id: 'r' + Date.now().toString(36),
    status: 'active',
    paidSessions: input.pay === 'prepaid' ? occurrences({ ...input, skips }).length : 0,
  };
  if (!occurrences(created).length) throw new Error('Không còn buổi nào sau khi bỏ các buổi trùng.');
  recurring = [created, ...recurring];
  // Buổi rơi vào hôm nay thì đưa thẳng lên lịch sân
  if (occurrences(created, TODAY_ISO, 1)[0] === TODAY_ISO) {
    await createDayBooking({ courtId: created.courtId, start: created.start, span: created.span, state: 'booked', label: created.club, sub: 'Định kỳ' });
  }
  return mockDelay({ ...created }, 300);
}

export async function setRecurringStatus(id: string, status: RecurringBooking['status']) {
  recurring = recurring.map((r) => (r.id === id ? { ...r, status } : r));
  return mockDelay(true, 200);
}

/** Gia hạn thêm n tuần; buổi mới bị trùng lịch sẽ tự ghi thành ngày nghỉ */
export async function extendRecurring(id: string, weeks: number) {
  const r = recurring.find((x) => x.id === id);
  if (!r) throw new Error('Không tìm thấy hợp đồng.');
  const from = addDays(r.to, 1);
  const to = addDays(r.to, weeks * 7);
  const clash = conflicts({ ...r, from, to }, recurring, bookings, r.id).map((x) => x.date);
  const added = occurrences({ ...r, from, to, skips: [...r.skips, ...clash] }).length;
  recurring = recurring.map((x) => (x.id === id ? { ...x, to, status: x.status === 'ended' ? 'active' : x.status, skips: [...x.skips, ...clash] } : x));
  return mockDelay({ added, skipped: clash.length, to }, 250);
}

/** Cho nghỉ / mở lại một buổi */
export async function toggleSkip(id: string, date: string) {
  recurring = recurring.map((r) => (r.id === id ? { ...r, skips: r.skips.includes(date) ? r.skips.filter((d) => d !== date) : [...r.skips, date] } : r));
  return mockDelay(true, 150);
}
