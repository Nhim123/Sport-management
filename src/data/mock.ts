// Dữ liệu mẫu lấy từ bản thiết kế Arena – thay bằng API thật khi có backend.

export type Sport = 'cl' | 'pb' | 'tn' | 'bd';
export type SlotState = 'booked' | 'class' | 'pending' | 'blocked';
export type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'class' | 'info';

export interface Court {
  id: string;
  name: string;
  kind: string;
  mobileKind: string;
  sport: Sport;
  price: number; // ₫ / giờ
}

export interface Booking {
  id: string;
  courtId: string;
  start: number; // giờ bắt đầu, 15 = 15:00
  span: number; // số giờ
  state: SlotState;
  label: string;
  sub?: string;
  /** Khách đã có mặt tại sân (lễ tân bấm check-in) */
  checkedIn?: boolean;
}

export const SPORTS: { id: Sport; label: string; short: string }[] = [
  { id: 'cl', label: 'Cầu lông', short: 'Cầu lông' },
  { id: 'pb', label: 'Pickleball', short: 'Pickleball' },
  { id: 'tn', label: 'Tennis', short: 'Tennis' },
  { id: 'bd', label: 'Bóng đá mini', short: 'Bóng đá' },
];

export const COURTS: Court[] = [
  { id: 'cl1', name: 'Cầu lông 1', kind: 'Thảm PVC', mobileKind: 'Thảm PVC · trong nhà', sport: 'cl', price: 150000 },
  { id: 'cl2', name: 'Cầu lông 2', kind: 'Thảm PVC', mobileKind: 'Thảm PVC · trong nhà', sport: 'cl', price: 150000 },
  { id: 'pba', name: 'Pickleball A', kind: 'Ngoài trời', mobileKind: 'Ngoài trời · có mái', sport: 'pb', price: 180000 },
  { id: 'pbb', name: 'Pickleball B', kind: 'Ngoài trời', mobileKind: 'Ngoài trời', sport: 'pb', price: 180000 },
  { id: 'tn', name: 'Tennis', kind: 'Sân cứng', mobileKind: 'Sân cứng · đèn LED', sport: 'tn', price: 250000 },
  { id: 'bd', name: 'Bóng đá mini', kind: 'Cỏ nhân tạo 5v5', mobileKind: 'Cỏ nhân tạo', sport: 'bd', price: 450000 },
];

/** Giờ hoạt động hiển thị trên lịch lễ tân */
export const OPEN_HOUR = 15;
export const CLOSE_HOUR = 23;
/** "Bây giờ" trong dữ liệu mẫu: Chủ nhật 18/10, 19:00 */
export const NOW_HOUR = 19;
export const TODAY_LABEL = 'Chủ nhật, 18/10';
export const MEMBER_DISCOUNT = 0.1;

let seq = 0;
const B = (courtId: string, start: number, state: SlotState, label: string, sub?: string, span = 1): Booking => ({
  id: 'b' + ++seq,
  courtId,
  start,
  span,
  state,
  label,
  sub,
});

export const INITIAL_BOOKINGS: Booking[] = [
  B('cl1', 16, 'booked', 'Bé Na'),
  B('cl1', 17, 'booked', 'Anh Tuấn'),
  B('cl1', 18, 'booked', 'CLB Phượng Hoàng', undefined, 2),
  B('cl1', 21, 'pending', 'Chị Lan', 'Chưa cọc'),
  B('cl2', 18, 'booked', 'Minh Khôi'),
  B('cl2', 21, 'booked', 'Hoàng Nam'),
  B('pba', 15, 'blocked', 'Tưới sân'),
  B('pba', 17, 'booked', 'Nhóm Sáu', undefined, 2),
  B('pba', 20, 'booked', 'Thành Đạt'),
  B('pbb', 18, 'pending', 'Anh Vũ', 'Chưa cọc'),
  B('pbb', 19, 'booked', 'Team Q7', undefined, 2),
  B('tn', 16, 'class', 'Lớp trẻ em', 'HLV Dũng'),
  B('tn', 17, 'class', 'Lớp cơ bản', 'HLV Dũng', 2),
  B('tn', 19, 'booked', 'Ông Phúc'),
  B('tn', 21, 'blocked', 'Bảo trì đèn', undefined, 2),
  B('bd', 18, 'booked', 'FC Văn Phòng', undefined, 2),
  B('bd', 20, 'booked', 'Team Bình', undefined, 2),
];

/** KPI vận hành; "Doanh thu hôm nay" tính từ dữ liệu báo cáo trong Dashboard */
export const KPIS = [
  { label: 'Đang có mặt', value: '64', delta: '', hint: '236 lượt check-in hôm nay', up: true },
  { label: 'Lấp đầy sân tối', value: '82%', delta: '▼ 6%', hint: 'so với tuần trước', up: false },
  { label: 'Sắp hết hạn', value: '27', delta: '', hint: 'hội viên trong 14 ngày', up: true },
];

export const CLASSES_TODAY = [
  { time: '06:00', name: 'Yoga buổi sáng', coach: 'HLV Mai', room: 'Phòng Yoga', booked: 18, cap: 20 },
  { time: '17:30', name: 'Hatha Yoga', coach: 'HLV Mai', room: 'Phòng Yoga', booked: 14, cap: 20 },
  { time: '18:00', name: 'Tennis cơ bản', coach: 'HLV Dũng', room: 'Sân tennis', booked: 6, cap: 8 },
  { time: '19:00', name: 'Vinyasa Flow', coach: 'HLV Thảo', room: 'Phòng Yoga', booked: 20, cap: 20 },
  { time: '19:30', name: 'HIIT 45 phút', coach: 'HLV Khoa', room: 'Khu functional', booked: 11, cap: 16 },
];

export type MemberGroup = 'active' | 'expiring' | 'expired' | 'paused';

export interface Payment {
  what: string;
  when: string;
  method: string;
  amount: number;
}

export interface Member {
  code: string;
  ini: string;
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
  hasPT: boolean;
  period: string;
  usedPct: number;
  remain: string;
  pt?: { left: number; total: number };
  checkins28: number[]; // 1 = có tập, theo thứ tự T2→CN, 4 tuần
  payments: Payment[];
}

const heat = (seed: number): number[] =>
  Array.from({ length: 28 }, (_, i) => ((i * 7 + seed * 13) % 5 < 3 ? 1 : 0));

export const MEMBERS: Member[] = [
  {
    code: 'AR-00421', ini: 'MA', name: 'Nguyễn Minh Anh', phone: '0912 345 678', plan: 'Gym 12 tháng + PT', exp: '03/2027',
    last: 'Đang ở phòng tập', group: 'active', status: 'Đang hoạt động', tone: 'success', debt: 0, inside: true, hasPT: true,
    period: '03/2026 – 03/2027', usedPct: 62, remain: '138 ngày', pt: { left: 7, total: 24 },
    checkins28: [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0],
    payments: [
      { what: 'Gia hạn Gym 12 tháng', when: '05/03/2026', method: 'Chuyển khoản', amount: 6600000 },
      { what: 'Gói PT 24 buổi', when: '05/03/2026', method: 'Thẻ', amount: 9600000 },
      { what: 'Thuê sân cầu lông', when: '11/10/2026', method: 'Ví MoMo', amount: 135000 },
    ],
  },
  {
    code: 'AR-00388', ini: 'QB', name: 'Trần Quốc Bảo', phone: '0903 112 457', plan: 'Gym 6 tháng', exp: '21/10/2026',
    last: 'Hôm qua 18:42', group: 'expiring', status: 'Sắp hết hạn', tone: 'warning', debt: 0, inside: false, hasPT: false,
    period: '04/2026 – 10/2026', usedPct: 98, remain: '3 ngày', checkins28: heat(1),
    payments: [{ what: 'Gym 6 tháng', when: '21/04/2026', method: 'Chuyển khoản', amount: 3600000 }],
  },
  {
    code: 'AR-00512', ini: 'NT', name: 'Võ Ngọc Trâm', phone: '0938 220 914', plan: 'Yoga 3 tháng', exp: '23/10/2026',
    last: 'Đang ở phòng tập', group: 'expiring', status: 'Sắp hết hạn', tone: 'warning', debt: 0, inside: true, hasPT: false,
    period: '07/2026 – 10/2026', usedPct: 95, remain: '5 ngày', checkins28: heat(2),
    payments: [{ what: 'Yoga 3 tháng', when: '23/07/2026', method: 'Ví MoMo', amount: 2400000 }],
  },
  {
    code: 'AR-00197', ini: 'TH', name: 'Lê Thu Hà', phone: '0977 410 002', plan: 'Gym + Bơi 6 tháng', exp: '02/10/2026',
    last: '29/09', group: 'expired', status: 'Hết hạn', tone: 'danger', debt: 450000, inside: false, hasPT: false,
    period: '04/2026 – 10/2026', usedPct: 100, remain: 'Hết hạn 16 ngày', checkins28: heat(3).map((v, i) => (i > 10 ? 0 : v)),
    payments: [{ what: 'Gym + Bơi 6 tháng', when: '02/04/2026', method: 'Thẻ', amount: 5400000 }],
  },
  {
    code: 'AR-00266', ini: 'DL', name: 'Phạm Đức Long', phone: '0988 761 335', plan: 'PT 24 buổi', exp: 'Bảo lưu đến 15/11',
    last: '01/09', group: 'paused', status: 'Bảo lưu', tone: 'neutral', debt: 0, inside: false, hasPT: true,
    period: 'Bảo lưu 01/10 – 15/11', usedPct: 40, remain: 'Bảo lưu', pt: { left: 14, total: 24 }, checkins28: Array(28).fill(0),
    payments: [{ what: 'Gói PT 24 buổi', when: '10/06/2026', method: 'Chuyển khoản', amount: 9600000 }],
  },
  {
    code: 'AR-00604', ini: 'GH', name: 'Đỗ Gia Huy', phone: '0919 088 213', plan: 'PT 12 buổi', exp: 'Còn 1 buổi',
    last: 'Hôm nay 07:10', group: 'expiring', status: 'Sắp hết', tone: 'warning', debt: 0, inside: false, hasPT: true,
    period: '08/2026 – 11/2026', usedPct: 92, remain: '1 buổi', pt: { left: 1, total: 12 }, checkins28: heat(4),
    payments: [{ what: 'Gói PT 12 buổi', when: '15/08/2026', method: 'Thẻ', amount: 5400000 }],
  },
  {
    code: 'AR-00633', ini: 'KL', name: 'Hoàng Khánh Linh', phone: '0362 554 190', plan: 'Gym 12 tháng', exp: '08/2027',
    last: 'Hôm nay 06:05', group: 'active', status: 'Đang hoạt động', tone: 'success', debt: 0, inside: false, hasPT: false,
    period: '08/2026 – 08/2027', usedPct: 18, remain: '296 ngày', checkins28: heat(5),
    payments: [{ what: 'Gym 12 tháng', when: '02/08/2026', method: 'Chuyển khoản', amount: 6600000 }],
  },
  {
    code: 'AR-00640', ini: 'TP', name: 'Bùi Tấn Phát', phone: '0707 331 562', plan: 'Gym 1 tháng', exp: '14/11/2026',
    last: '16/10', group: 'active', status: 'Đang hoạt động', tone: 'success', debt: 200000, inside: false, hasPT: false,
    period: '14/10/2026 – 14/11/2026', usedPct: 13, remain: '27 ngày', checkins28: heat(6).map((v, i) => (i < 22 ? 0 : v)),
    payments: [{ what: 'Gym 1 tháng (trả trước 50%)', when: '14/10/2026', method: 'Tiền mặt', amount: 200000 }],
  },
  {
    code: 'AR-00118', ini: 'HN', name: 'Ngô Hải Nam', phone: '0945 600 781', plan: 'Gym 12 tháng', exp: '05/09/2026',
    last: '30/08', group: 'expired', status: 'Hết hạn', tone: 'danger', debt: 0, inside: false, hasPT: false,
    period: '09/2025 – 09/2026', usedPct: 100, remain: 'Hết hạn 43 ngày', checkins28: Array(28).fill(0),
    payments: [{ what: 'Gym 12 tháng', when: '05/09/2025', method: 'Chuyển khoản', amount: 6000000 }],
  },
];

export const RENEW_SOON = ['AR-00388', 'AR-00512', 'AR-00197', 'AR-00604'];

export const CURRENT_STAFF = { ini: 'NL', name: 'Ngọc Linh', role: 'Lễ tân · Ca tối' };
export const CURRENT_MEMBER_CODE = 'AR-00421';

export function findMemberByPhone(phone: string): Member | undefined {
  const d = phone.replace(/\D/g, '');
  if (d.length < 9) return undefined;
  return MEMBERS.find((m) => m.phone.replace(/\D/g, '') === d);
}

/** Thêm vào đơn ở app hội viên */
export const RACKET_RENT = 30000;
