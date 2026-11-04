// Kiểu dữ liệu cho chế độ quản lý (nhân viên) – khớp với website quản trị.
import type { Activity, Sport } from './domain';

export type Tone = 'success' | 'warning' | 'danger' | 'class' | 'info' | 'neutral' | 'volt';

export type SlotState = 'booked' | 'class' | 'pending' | 'blocked';

export interface AdminBooking {
  id: string;
  courtId: string;
  start: number; // giờ, 19 = 19:00
  span: number;
  state: SlotState;
  label: string;
  sub?: string;
  checkedIn?: boolean;
  checkedInAt?: string; // "19:05"
}

export type CourtLiveKind = 'inUse' | 'class' | 'pending' | 'blocked' | 'soon' | 'free';

export interface CourtLive {
  courtId: string;
  kind: CourtLiveKind;
  current?: AdminBooking;
  next?: AdminBooking;
  minutesLeft: number;
  progress: number;
}

export interface Payment {
  what: string;
  when: string;
  method: string;
  amount: number;
}

export type MemberGroup = 'active' | 'expiring' | 'expired' | 'paused';

export interface AdminMember {
  code: string;
  name: string;
  phone: string;
  plan: string;
  exp: string;
  last: string;
  group: MemberGroup;
  status: string;
  tone: Tone;
  debt: number;
  inside: boolean;
  period: string;
  usedPct: number;
  remain: string;
  pt?: { left: number; total: number };
  checkins28: number[];
  payments: Payment[];
}

export interface Kpi {
  label: string;
  value: string;
  delta?: string;
  up?: boolean;
  hint: string;
}

export interface ClassToday {
  id: string;
  sport: Activity;
  time: string;
  mins: number; // thời lượng
  name: string;
  coach: string;
  room: string;
  booked: number;
  cap: number;
  present: number; // đã vào lớp
  roster: string[]; // mã hội viên đã đăng ký (có trong dữ liệu mẫu)
  attended: string[]; // mã hội viên đã check-in vào lớp
}

// ---------- Quét QR check-in ----------

/** Kết luận khi kiểm tra một mã: ok = được phép xác nhận */
export interface Verdict {
  ok: boolean;
  tone: 'success' | 'warning' | 'danger';
  title: string;
  notes: string[];
}

export type ScanResult =
  | { kind: 'booking'; code: string; booking: AdminBooking; courtName: string; sport: Sport; verdict: Verdict }
  | { kind: 'class'; code: string; cls: ClassToday; member: AdminMember; enrolled: boolean; verdict: Verdict }
  | { kind: 'member'; code: string; member: AdminMember; options: { cls: ClassToday; enrolled: boolean; verdict: Verdict }[]; verdict: Verdict }
  | { kind: 'invalid'; code: string; verdict: Verdict };

export interface ScanLogEntry {
  id: string;
  at: string;
  kind: 'booking' | 'class';
  sport: Activity;
  title: string; // tên khách / hội viên
  sub: string; // sân · giờ hoặc lớp · giờ
}

export interface Dashboard {
  staffName: string;
  staffRole: string;
  shift: string;
  dateLabel: string;
  kpis: Kpi[];
  classes: ClassToday[];
  renew: string[]; // mã hội viên
}

export type Format = 'knockout' | 'double' | 'roundrobin' | 'groups' | 'swiss';

export interface Tournament {
  id: string;
  name: string;
  sport: Sport;
  entry: string; // Đơn / Đôi / Đồng đội
  format: Format;
  maxEntrants: number;
  groupCount: number;
  seeds: number;
  dates: string;
  regDeadline: string;
  courts: string;
  fee: number;
  prize: string;
  entrants: string[];
  status: 'draft' | 'open';
  // Tuỳ chọn thể thức & luật trận (giải tạo mới có đủ)
  thirdPlace?: boolean;
  legs?: 1 | 2;
  advance?: 1 | 2;
  swissRounds?: number;
  matchRule?: string;
}

/** Một thành phần trong gói: phòng gym, giờ sân theo môn, lớp nhóm, PT, bơi */
export interface PlanPart {
  kind: 'gym' | 'court' | 'class' | 'pt' | 'swim';
  sport?: Sport; // môn của sân
  qty?: number; // giờ sân / buổi lớp mỗi tháng, buổi PT cả gói; trống = không giới hạn
  offPeak?: boolean; // chỉ dùng giờ thấp điểm
}

/** Gói tập do câu lạc bộ tự ghép (không theo khuôn cố định) + số liệu bán */
export interface PlanStat {
  id: string;
  name: string;
  parts: PlanPart[];
  months: number;
  price: number;
  extras: string[]; // quyền lợi thêm: bảo lưu, khăn & nước, tủ đồ…
  custom?: string; // tên khách nếu là gói riêng
  sales: number[]; // T5 → T10
  active: number;
  renewal: number | null;
  expiring: number;
}

export type Shift = 'S' | 'C' | 'T' | 'off' | 'P';

export interface StaffMember {
  id: string;
  code: string;
  name: string;
  phone: string;
  role: 'manager' | 'reception' | 'pt' | 'coach' | 'tech' | 'cleaner';
  roleLabel: string;
  status: 'active' | 'leave';
  week: Shift[]; // T2 → CN
  note?: string;
}

export interface MonthReport {
  label: string;
  compare: string;
  booking: number;
  bookingPrev: number;
  products: number;
  productsPrev: number;
  profit: number;
  profitPrev: number;
  fixed: { revenue: number; count: number; customers: number };
  walkin: { revenue: number; count: number; customers: number };
  /** Doanh thu đặt sân theo ngày: [cố định, vãng lai] */
  days: [number, number][];
  productRows: { name: string; unit: string; qty: number; revenue: number; profit: number }[];
  courts: { courtId: string; revenue: number; count: number }[];
}

// ---------- Thông báo cần xác nhận ----------

export type NoticeKind = 'booking' | 'deposit' | 'renewal' | 'freeze' | 'payment';

export interface Notice {
  id: string;
  kind: NoticeKind;
  sport: Activity;
  who: string; // khách / hội viên
  detail: string; // sân · giờ, gói, thời gian bảo lưu
  at: string; // "18:52"
  amount?: number;
  note?: string; // lời nhắn / nội dung chuyển khoản
  status: 'pending' | 'confirmed' | 'rejected';
  resolvedAt?: string;
  resolvedBy?: string;
  reason?: string;
  // Tham chiếu để xử lý khi xác nhận
  booking?: { sport: Sport; courtId?: string; start: number; span: number }; // courtId = sân khách chọn (nếu có)
  bookingId?: string;
  weekBookingId?: string; // lượt đặt theo ca (chờ chủ sân xác nhận thanh toán)
  memberCode?: string;
  planIndex?: number;
}

// ---------- Đặt sân định kỳ (câu lạc bộ / nhóm cố định) ----------

export interface RecurringBooking {
  id: string;
  club: string; // tên câu lạc bộ / nhóm
  contact: string; // người liên hệ · SĐT
  courtId: string;
  days: number[]; // thứ trong tuần: 0 = T2 … 6 = CN
  start: number; // giờ bắt đầu
  span: number; // số giờ mỗi buổi
  from: string; // ISO "2026-10-18"
  to: string;
  pricePerSession: number;
  discount: number; // đã gồm giảm theo thời hạn (+ trả trước)
  pay: 'month' | 'prepaid';
  status: 'active' | 'paused' | 'ended';
  skips: string[]; // ngày nghỉ (ISO)
  paidSessions: number;
}
