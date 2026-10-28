// Dữ liệu mẫu cho chế độ quản lý – CHỈ lớp api/ được import file này.
// Số liệu khớp với website quản trị (báo cáo tháng 10 lấy từ cùng bộ dữ liệu mẫu).
import type {
  AdminBooking,
  AdminMember,
  Dashboard,
  MonthReport,
  PlanStat,
  Shift,
  StaffMember,
  Tournament,
} from '../types/admin';

/** "Bây giờ" của dữ liệu mẫu: CN 18/10, 19:00 */
export const NOW_HOUR = 19;
export const OPEN_HOUR = 15;
export const CLOSE_HOUR = 23;

let seq = 0;
const B = (courtId: string, start: number, state: AdminBooking['state'], label: string, sub?: string, span = 1): AdminBooking => ({
  id: 'b' + ++seq,
  courtId,
  start,
  span,
  state,
  label,
  sub,
  checkedIn: state === 'booked' && start < NOW_HOUR ? true : undefined,
});

export const BOOKINGS: AdminBooking[] = [
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

const heat = (seed: number) => Array.from({ length: 28 }, (_, i) => ((i * 7 + seed * 13) % 5 < 3 ? 1 : 0));

export const MEMBERS: AdminMember[] = [
  {
    code: 'AR-00421', name: 'Nguyễn Minh Anh', phone: '0912 345 678', plan: 'Gym 12 tháng + PT', exp: '03/2027', last: 'Đang ở phòng tập',
    group: 'active', status: 'Đang hoạt động', tone: 'success', debt: 0, inside: true, period: '03/2026 – 03/2027', usedPct: 62, remain: '138 ngày',
    pt: { left: 7, total: 24 }, checkins28: [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0],
    payments: [
      { what: 'Gia hạn Gym 12 tháng', when: '05/03/2026', method: 'Chuyển khoản', amount: 6600000 },
      { what: 'Gói PT 24 buổi', when: '05/03/2026', method: 'Thẻ', amount: 9600000 },
      { what: 'Thuê sân cầu lông', when: '11/10/2026', method: 'Ví MoMo', amount: 135000 },
    ],
  },
  { code: 'AR-00388', name: 'Trần Quốc Bảo', phone: '0903 112 457', plan: 'Gym 6 tháng', exp: '21/10/2026', last: 'Hôm qua 18:42', group: 'expiring', status: 'Sắp hết hạn', tone: 'warning', debt: 0, inside: false, period: '04/2026 – 10/2026', usedPct: 98, remain: '3 ngày', checkins28: heat(1), payments: [{ what: 'Gym 6 tháng', when: '21/04/2026', method: 'Chuyển khoản', amount: 3600000 }] },
  { code: 'AR-00512', name: 'Võ Ngọc Trâm', phone: '0938 220 914', plan: 'Yoga 3 tháng', exp: '23/10/2026', last: 'Đang ở phòng tập', group: 'expiring', status: 'Sắp hết hạn', tone: 'warning', debt: 0, inside: true, period: '07/2026 – 10/2026', usedPct: 95, remain: '5 ngày', checkins28: heat(2), payments: [{ what: 'Yoga 3 tháng', when: '23/07/2026', method: 'Ví MoMo', amount: 2400000 }] },
  { code: 'AR-00197', name: 'Lê Thu Hà', phone: '0977 410 002', plan: 'Gym + Bơi 6 tháng', exp: '02/10/2026', last: '29/09', group: 'expired', status: 'Hết hạn', tone: 'danger', debt: 450000, inside: false, period: '04/2026 – 10/2026', usedPct: 100, remain: 'Hết hạn 16 ngày', checkins28: heat(3).map((v, i) => (i > 10 ? 0 : v)), payments: [{ what: 'Gym + Bơi 6 tháng', when: '02/04/2026', method: 'Thẻ', amount: 5400000 }] },
  { code: 'AR-00266', name: 'Phạm Đức Long', phone: '0988 761 335', plan: 'PT 24 buổi', exp: 'Bảo lưu đến 15/11', last: '01/09', group: 'paused', status: 'Bảo lưu', tone: 'neutral', debt: 0, inside: false, period: 'Bảo lưu 01/10 – 15/11', usedPct: 40, remain: 'Bảo lưu', pt: { left: 14, total: 24 }, checkins28: Array(28).fill(0), payments: [{ what: 'Gói PT 24 buổi', when: '10/06/2026', method: 'Chuyển khoản', amount: 9600000 }] },
  { code: 'AR-00604', name: 'Đỗ Gia Huy', phone: '0919 088 213', plan: 'PT 12 buổi', exp: 'Còn 1 buổi', last: 'Hôm nay 07:10', group: 'expiring', status: 'Sắp hết', tone: 'warning', debt: 0, inside: false, period: '08/2026 – 11/2026', usedPct: 92, remain: '1 buổi', pt: { left: 1, total: 12 }, checkins28: heat(4), payments: [{ what: 'Gói PT 12 buổi', when: '15/08/2026', method: 'Thẻ', amount: 5400000 }] },
  { code: 'AR-00633', name: 'Hoàng Khánh Linh', phone: '0362 554 190', plan: 'Gym 12 tháng', exp: '08/2027', last: 'Hôm nay 06:05', group: 'active', status: 'Đang hoạt động', tone: 'success', debt: 0, inside: false, period: '08/2026 – 08/2027', usedPct: 18, remain: '296 ngày', checkins28: heat(5), payments: [{ what: 'Gym 12 tháng', when: '02/08/2026', method: 'Chuyển khoản', amount: 6600000 }] },
  { code: 'AR-00640', name: 'Bùi Tấn Phát', phone: '0707 331 562', plan: 'Gym 1 tháng', exp: '14/11/2026', last: '16/10', group: 'active', status: 'Đang hoạt động', tone: 'success', debt: 200000, inside: false, period: '14/10/2026 – 14/11/2026', usedPct: 13, remain: '27 ngày', checkins28: heat(6).map((v, i) => (i < 22 ? 0 : v)), payments: [{ what: 'Gym 1 tháng (trả trước 50%)', when: '14/10/2026', method: 'Tiền mặt', amount: 200000 }] },
  { code: 'AR-00118', name: 'Ngô Hải Nam', phone: '0945 600 781', plan: 'Gym 12 tháng', exp: '05/09/2026', last: '30/08', group: 'expired', status: 'Hết hạn', tone: 'danger', debt: 0, inside: false, period: '09/2025 – 09/2026', usedPct: 100, remain: 'Hết hạn 43 ngày', checkins28: Array(28).fill(0), payments: [{ what: 'Gym 12 tháng', when: '05/09/2025', method: 'Chuyển khoản', amount: 6000000 }] },
];

export const DASHBOARD: Dashboard = {
  staffName: 'Trần Ngọc Linh',
  staffRole: 'Lễ tân',
  shift: 'Ca tối 17:00–23:00',
  dateLabel: 'Chủ nhật, 18/10',
  kpis: [
    { label: 'Doanh thu hôm nay', value: '16.134.000₫', delta: '▲ 19,3%', up: true, hint: 'so với CN trước' },
    { label: 'Đang có mặt', value: '64', hint: '236 lượt check-in' },
    { label: 'Lấp đầy sân tối', value: '82%', delta: '▼ 6%', up: false, hint: 'so với tuần trước' },
    { label: 'Sắp hết hạn', value: '27', hint: 'trong 14 ngày' },
  ],
  classes: [
    { time: '06:00', name: 'Yoga buổi sáng', coach: 'HLV Mai', room: 'Phòng Yoga', booked: 18, cap: 20 },
    { time: '17:30', name: 'Hatha Yoga', coach: 'HLV Mai', room: 'Phòng Yoga', booked: 14, cap: 20 },
    { time: '18:00', name: 'Tennis cơ bản', coach: 'HLV Dũng', room: 'Sân tennis', booked: 6, cap: 8 },
    { time: '19:00', name: 'Vinyasa Flow', coach: 'HLV Thảo', room: 'Phòng Yoga', booked: 20, cap: 20 },
    { time: '19:30', name: 'HIIT 45 phút', coach: 'HLV Khoa', room: 'Khu functional', booked: 11, cap: 16 },
  ],
  renew: ['AR-00388', 'AR-00512', 'AR-00197', 'AR-00604'],
};

/** Gói để chọn khi gia hạn: [tên, số tháng, giá] */
export const RENEW_PLANS: [string, number, number][] = [
  ['Gym 1 tháng', 1, 650000],
  ['Gym 6 tháng', 6, 3600000],
  ['Gym 12 tháng', 12, 6600000],
  ['Yoga 3 tháng', 3, 2400000],
  ['Gym + Bơi 6 tháng', 6, 5400000],
];

export const TOURNAMENTS: Tournament[] = [
  {
    id: 't-sample-1', name: 'Giải cầu lông Arena mở rộng 2026', sport: 'cl', entry: 'Đôi', format: 'knockout', maxEntrants: 16, groupCount: 4, seeds: 4,
    dates: 'T7 14/11 – CN 15/11/2026', regDeadline: 'T7 07/11/2026', courts: 'Cầu lông 1, Cầu lông 2 · 08:00–20:00', fee: 300000, prize: 'Cúp + 10.000.000₫ cho nhà vô địch',
    entrants: ['Anh Tuấn / Minh Khôi', 'Hoàng Nam / Thành Đạt', 'CLB Phượng Hoàng A', 'Quốc Bảo / Gia Huy', 'Đức Long / Tấn Phát', 'CLB Phượng Hoàng B', 'Hải Nam / Khánh Linh', 'Team Q7', 'Văn Phòng FC', 'Minh Anh / Thu Hà', 'Ngọc Trâm / Bé Na'],
    status: 'open',
  },
  {
    id: 't-sample-2', name: 'Pickleball Cup tháng 12', sport: 'pb', entry: 'Đôi', format: 'groups', maxEntrants: 12, groupCount: 4, seeds: 4,
    dates: 'T7 05/12 – CN 06/12/2026', regDeadline: 'T7 28/11/2026', courts: 'Pickleball A, Pickleball B · 07:00–19:00', fee: 250000, prize: '[GIẢI THƯỞNG]',
    entrants: [], status: 'draft',
  },
];

export const PLANS: PlanStat[] = [
  { id: 'p-gym-1', name: 'Gym 1 tháng', template: 'Gym tiêu chuẩn', months: 1, price: 650000, tags: ['Phòng gym'], sales: [38, 42, 51, 47, 40, 44], active: 52, renewal: 0.41, expiring: 18 },
  { id: 'p-gym-6', name: 'Gym 6 tháng', template: 'Gym tiêu chuẩn', months: 6, price: 3600000, tags: ['Phòng gym', 'Bảo lưu 30 ngày'], sales: [14, 12, 16, 15, 13, 17], active: 96, renewal: 0.62, expiring: 9 },
  { id: 'p-gym-12', name: 'Gym 12 tháng', template: 'Gym tiêu chuẩn', months: 12, price: 6600000, tags: ['Phòng gym', 'Bảo lưu 60 ngày'], sales: [9, 8, 11, 10, 12, 14], active: 188, renewal: 0.74, expiring: 6 },
  { id: 'p-yoga-3', name: 'Yoga 3 tháng', template: 'Yoga & lớp nhóm', months: 3, price: 2400000, tags: ['Lớp nhóm'], sales: [11, 13, 15, 12, 10, 12], active: 64, renewal: 0.58, expiring: 7 },
  { id: 'p-pt-12', name: 'PT 12 buổi', template: 'PT cá nhân', months: 3, price: 5400000, tags: ['PT 12 buổi'], sales: [6, 7, 5, 8, 9, 7], active: 21, renewal: 0.49, expiring: 4 },
  { id: 'p-pt-24', name: 'PT 24 buổi', template: 'PT cá nhân', months: 6, price: 9600000, tags: ['PT 24 buổi'], sales: [3, 4, 4, 5, 4, 6], active: 17, renewal: 0.66, expiring: 2 },
  { id: 'p-combo-6', name: 'Gym + Bơi 6 tháng', template: 'Combo Gym + Bơi', months: 6, price: 5400000, tags: ['Phòng gym', 'Hồ bơi', 'Khăn & nước'], sales: [5, 6, 9, 10, 6, 7], active: 35, renewal: 0.55, expiring: 3 },
  { id: 'p-offpeak-3', name: 'Gym giờ thấp điểm 3 tháng', template: 'Giờ thấp điểm', months: 3, price: 1350000, tags: ['Phòng gym', 'Giờ thấp điểm'], sales: [7, 9, 8, 6, 8, 10], active: 29, renewal: 0.47, expiring: 5 },
  { id: 'p-custom-ma', name: 'Gym 12 tháng + PT 24 buổi (riêng)', template: 'Gói riêng', months: 12, price: 16200000, tags: ['Phòng gym', 'PT 24 buổi', 'Tủ đồ riêng'], custom: 'Nguyễn Minh Anh', sales: [0, 0, 0, 0, 0, 0], active: 1, renewal: null, expiring: 0 },
];

const W = (s: string): Shift[] => s.split(' ').map((x) => (x === '-' ? 'off' : (x as Shift)));

export const STAFF: StaffMember[] = [
  { id: 's01', code: 'NV01', name: 'Phạm Quang Huy', phone: '0908 111 222', role: 'manager', roleLabel: 'Quản lý', status: 'active', week: W('S S C S C - T') },
  { id: 's02', code: 'NV02', name: 'Trần Ngọc Linh', phone: '0912 778 901', role: 'reception', roleLabel: 'Lễ tân', status: 'active', week: W('T T - T T T T') },
  { id: 's03', code: 'NV03', name: 'Lê Hồng Nhung', phone: '0935 402 118', role: 'reception', roleLabel: 'Lễ tân', status: 'active', week: W('S S S - S S S') },
  { id: 's04', code: 'NV04', name: 'Võ Minh Tú', phone: '0976 230 554', role: 'reception', roleLabel: 'Lễ tân', status: 'active', week: W('C C C C - C C') },
  { id: 's05', code: 'NV05', name: 'Đặng Minh Khoa', phone: '0903 665 410', role: 'pt', roleLabel: 'HLV cá nhân (PT)', status: 'active', week: W('S S - S S T T') },
  { id: 's06', code: 'NV06', name: 'Nguyễn Thanh Mai', phone: '0918 304 770', role: 'coach', roleLabel: 'HLV lớp / bộ môn', status: 'active', week: W('S T S T S - S') },
  { id: 's07', code: 'NV07', name: 'Phan Thu Thảo', phone: '0387 220 913', role: 'coach', roleLabel: 'HLV lớp / bộ môn', status: 'active', week: W('- T - T - T T') },
  { id: 's08', code: 'NV08', name: 'Trần Quốc Dũng', phone: '0909 812 336', role: 'coach', roleLabel: 'HLV lớp / bộ môn', status: 'active', week: W('C C C - C C C') },
  { id: 's09', code: 'NV09', name: 'Lý Văn Sơn', phone: '0962 145 008', role: 'tech', roleLabel: 'Kỹ thuật & bảo trì', status: 'active', week: W('C C C C C - -') },
  { id: 's10', code: 'NV10', name: 'Bùi Thị Hoa', phone: '0399 551 274', role: 'cleaner', roleLabel: 'Tạp vụ', status: 'leave', week: W('S S S P P P P'), note: 'Nghỉ phép 15/10 – 20/10' },
];

export const MONTH_REPORT: MonthReport = {
  label: 'Tháng 10/2026 (1–18/10)',
  compare: 'so với cùng kỳ tháng trước',
  booking: 207547000,
  bookingPrev: 196028000,
  products: 45183000,
  productsPrev: 41391000,
  profit: 21478400,
  profitPrev: 20102500,
  fixed: { revenue: 89667000, count: 332, customers: 60 },
  walkin: { revenue: 117880000, count: 398, customers: 385 },
  days: [
    [5562000, 5830000], [5922000, 4990000], [6192000, 9080000], [6129000, 6880000], [4365000, 6200000], [3015000, 4330000],
    [3879000, 4940000], [4482000, 8100000], [5535000, 5030000], [5301000, 7030000], [5463000, 5550000], [4473000, 8810000],
    [4419000, 6840000], [4653000, 5930000], [5427000, 7690000], [4752000, 4050000], [5706000, 7220000], [4392000, 9380000],
  ],
  productRows: [
    { name: 'Nước suối 500ml', unit: 'chai', qty: 1123, revenue: 11230000, profit: 6176500 },
    { name: 'Thuê vợt', unit: 'lượt', qty: 172, revenue: 5160000, profit: 4472000 },
    { name: 'Pocari Sweat', unit: 'chai', qty: 384, revenue: 8448000, profit: 3456000 },
    { name: 'Bóng pickleball (3 quả)', unit: 'hộp', qty: 37, revenue: 6660000, profit: 2405000 },
    { name: 'Ống cầu lông (12 quả)', unit: 'ống', qty: 30, revenue: 7800000, profit: 1860000 },
    { name: 'Sting dâu', unit: 'chai', qty: 199, revenue: 2985000, profit: 1293500 },
    { name: 'Khăn lạnh', unit: 'cái', qty: 377, revenue: 1885000, profit: 1206400 },
    { name: 'Quấn cán vợt', unit: 'cuộn', qty: 29, revenue: 1015000, profit: 609000 },
  ],
  courts: [
    { courtId: 'bd', revenue: 67860000, count: 120 },
    { courtId: 'tn', revenue: 38200000, count: 121 },
    { courtId: 'pba', revenue: 28188000, count: 124 },
    { courtId: 'pbb', revenue: 28134000, count: 127 },
    { courtId: 'cl1', revenue: 22590000, count: 116 },
    { courtId: 'cl2', revenue: 22575000, count: 122 },
  ],
};

/** Mật khẩu thử cho mọi tài khoản nhân viên trong dữ liệu mẫu */
export const DEMO_PASSWORD = 'arena123';
