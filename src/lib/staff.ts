// Nhân viên: vai trò, ca làm, quyền truy cập, chỉ số và cách tính lương tạm tính.

export type Role = 'manager' | 'reception' | 'pt' | 'coach' | 'tech' | 'cleaner';
export type Shift = 'S' | 'C' | 'T' | 'off' | 'P';
export type Module = 'dashboard' | 'bookings' | 'courts' | 'members' | 'tournaments' | 'plans' | 'payments' | 'reports' | 'staff' | 'settings';
export type StatKey = 'checkins' | 'bookings' | 'salesRevenue' | 'ptSessions' | 'classes' | 'clients' | 'tickets';

export interface StaffStats {
  /** Số ca đã làm trong tháng 10 */
  monthShifts: number;
  checkins?: number;
  bookings?: number;
  salesRevenue?: number;
  ptSessions?: number;
  classes?: number;
  clients?: number;
  tickets?: number;
}

export interface Staff {
  id: string;
  code: string;
  name: string;
  phone: string;
  email?: string;
  role: Role;
  type: 'full' | 'part';
  status: 'active' | 'leave' | 'quit';
  startDate: string; // yyyy-mm-dd
  /** Lương cứng / tháng (toàn thời gian) */
  baseSalary: number;
  /** Lương / giờ (bán thời gian) */
  hourlyRate: number;
  /** Tiền mỗi buổi PT */
  ptRate: number;
  /** Hoa hồng trên doanh thu gói tự bán (0–1) */
  commission: number;
  perms: Module[];
  /** Lịch tuần T2 → CN */
  week: Shift[];
  note?: string;
  stats: StaffStats;
}

export const MODULES: { id: Module; label: string }[] = [
  { id: 'dashboard', label: 'Tổng quan' },
  { id: 'bookings', label: 'Lịch đặt sân' },
  { id: 'courts', label: 'Trạng thái sân' },
  { id: 'members', label: 'Hội viên' },
  { id: 'tournaments', label: 'Giải đấu' },
  { id: 'plans', label: 'Gói tập' },
  { id: 'payments', label: 'Thanh toán' },
  { id: 'reports', label: 'Báo cáo doanh thu' },
  { id: 'staff', label: 'Nhân viên & lương' },
  { id: 'settings', label: 'Cài đặt' },
];

const ALL: Module[] = MODULES.map((m) => m.id);

export const ROLES: Record<Role, { label: string; badge: string; perms: Module[]; stats: [StatKey, string][] }> = {
  manager: { label: 'Quản lý', badge: 'b-info', perms: ALL, stats: [['salesRevenue', 'Doanh thu gói tự bán']] },
  reception: {
    label: 'Lễ tân',
    badge: 'b-success',
    perms: ['dashboard', 'bookings', 'courts', 'members', 'tournaments', 'payments'],
    stats: [['checkins', 'Lượt check-in xử lý'], ['bookings', 'Đơn đặt sân tạo'], ['salesRevenue', 'Doanh thu bán gói']],
  },
  pt: {
    label: 'HLV cá nhân (PT)',
    badge: 'b-class',
    perms: ['dashboard', 'members'],
    stats: [['ptSessions', 'Buổi PT'], ['clients', 'Hội viên phụ trách'], ['salesRevenue', 'Doanh thu gói PT bán']],
  },
  coach: {
    label: 'HLV lớp / bộ môn',
    badge: 'b-class',
    perms: ['dashboard', 'members', 'tournaments'],
    stats: [['classes', 'Buổi lớp đã dạy'], ['ptSessions', 'Buổi PT'], ['clients', 'Học viên']],
  },
  tech: { label: 'Kỹ thuật & bảo trì', badge: 'b-warning', perms: ['courts'], stats: [['tickets', 'Yêu cầu bảo trì đã xử lý']] },
  cleaner: { label: 'Tạp vụ', badge: 'b-neutral', perms: [], stats: [] },
};

export const STATUS: Record<Staff['status'], { label: string; badge: string }> = {
  active: { label: 'Đang làm', badge: 'b-success' },
  leave: { label: 'Nghỉ phép', badge: 'b-warning' },
  quit: { label: 'Đã nghỉ việc', badge: 'b-neutral' },
};

export const SHIFTS: Record<Shift, { label: string; short: string; time: string; hours: number }> = {
  S: { label: 'Ca sáng', short: 'Sáng', time: '06:00–12:00', hours: 6 },
  C: { label: 'Ca chiều', short: 'Chiều', time: '12:00–17:00', hours: 5 },
  T: { label: 'Ca tối', short: 'Tối', time: '17:00–23:00', hours: 6 },
  off: { label: 'Nghỉ', short: 'Nghỉ', time: '', hours: 0 },
  P: { label: 'Nghỉ phép', short: 'Phép', time: '', hours: 0 },
};
export const WORK_SHIFTS: Shift[] = ['S', 'C', 'T'];

/** Tuần đang xem: T2 12/10 → CN 18/10/2026; "bây giờ" là CN 19:00 (ca tối) */
export const WEEK_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((dow, i) => ({ dow, date: `${12 + i}/10` }));
export const TODAY_INDEX = 6;
export const NOW_SHIFT: Shift = 'T';
export const WEEK_LABEL = 'Tuần 12/10 – 18/10/2026';
export const MONTH_LABEL = 'tháng 10/2026';

export const EVENING_ALLOWANCE = 30000; // mỗi ca tối
const AVG_SHIFT_HOURS = 6;

export const weekHours = (s: Staff) => s.week.reduce((h, x) => h + SHIFTS[x].hours, 0);
export const weekShiftCount = (s: Staff) => s.week.filter((x) => WORK_SHIFTS.includes(x)).length;
export const initials = (name: string) => {
  const p = name.trim().split(/\s+/);
  return ((p.length > 1 ? p[p.length - 2][0] : '') + (p[p.length - 1]?.[0] ?? '')).toUpperCase();
};

export interface PayLine {
  base: number;
  baseNote: string;
  pt: number;
  commission: number;
  allowance: number;
  total: number;
}

/** Lương tạm tính tháng 10 – chưa trừ bảo hiểm, thuế */
export function payroll(s: Staff): PayLine {
  const hours = s.stats.monthShifts * AVG_SHIFT_HOURS;
  const base = s.type === 'full' ? s.baseSalary : hours * s.hourlyRate;
  const baseNote = s.type === 'full' ? 'Lương cứng' : `${s.stats.monthShifts} ca × ~${AVG_SHIFT_HOURS} giờ × ${s.hourlyRate.toLocaleString('vi-VN')}₫`;
  const pt = (s.stats.ptSessions ?? 0) * s.ptRate;
  const commission = Math.round((s.stats.salesRevenue ?? 0) * s.commission);
  // Ước tính số ca tối trong tháng theo lịch tuần hiện tại
  const allowance = s.week.filter((x) => x === 'T').length * 4 * EVENING_ALLOWANCE;
  return { base, baseNote, pt, commission, allowance, total: base + pt + commission + allowance };
}

export interface Coverage {
  shift: Shift;
  total: number;
  reception: number;
  names: string[];
}

/** Ai làm ca nào trong ngày i; mỗi ca cần ít nhất 1 lễ tân */
export function coverage(staff: Staff[], day: number): Coverage[] {
  const working = staff.filter((s) => s.status !== 'quit');
  return WORK_SHIFTS.map((shift) => {
    const on = working.filter((s) => s.week[day] === shift);
    return { shift, total: on.length, reception: on.filter((s) => s.role === 'reception').length, names: on.map((s) => s.name) };
  });
}

export function coverageGaps(staff: Staff[]): { day: number; shift: Shift }[] {
  const gaps: { day: number; shift: Shift }[] = [];
  for (let d = 0; d < 7; d++) for (const c of coverage(staff, d)) if (c.reception === 0) gaps.push({ day: d, shift: c.shift });
  return gaps;
}
