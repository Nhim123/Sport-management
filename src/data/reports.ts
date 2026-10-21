// Dữ liệu mẫu cho báo cáo doanh thu & lợi nhuận.
// Sinh bằng PRNG có seed cố định nên mỗi lần tải đều ra cùng số liệu – thay bằng API khi có backend.
import { COURTS, MEMBERS, type Sport } from './mock';

export interface Ymd {
  y: number;
  m: number; // 0–11
  d: number;
}

export type CustomerType = 'walkin' | 'fixed';

export interface BookingRec {
  k: number; // yyyymmdd (tháng 0–11) để so sánh nhanh
  y: number;
  m: number;
  d: number;
  hour: number;
  span: number;
  courtId: string;
  sport: Sport;
  amount: number;
  type: CustomerType;
  customer: string;
}

export interface SaleRec {
  k: number;
  m: number;
  d: number;
  hour: number;
  productId: string;
  qty: number;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  group: 'Đồ uống' | 'Dụng cụ' | 'Dịch vụ';
  price: number; // giá bán
  cost: number; // giá vốn / đơn vị
}

export const REPORT_START: Ymd = { y: 2025, m: 0, d: 1 };
/** "Hôm nay" của dữ liệu mẫu – khớp NOW trong mock.ts (CN 18/10/2026) */
export const REPORT_TODAY: Ymd = { y: 2026, m: 9, d: 18 };

export const PRODUCTS: Product[] = [
  { id: 'water', name: 'Nước suối 500ml', unit: 'chai', group: 'Đồ uống', price: 10000, cost: 4500 },
  { id: 'pocari', name: 'Pocari Sweat', unit: 'chai', group: 'Đồ uống', price: 22000, cost: 13000 },
  { id: 'sting', name: 'Sting dâu', unit: 'chai', group: 'Đồ uống', price: 15000, cost: 8500 },
  { id: 'towel', name: 'Khăn lạnh', unit: 'cái', group: 'Đồ uống', price: 5000, cost: 1800 },
  { id: 'shuttle', name: 'Ống cầu lông (12 quả)', unit: 'ống', group: 'Dụng cụ', price: 260000, cost: 198000 },
  { id: 'pball', name: 'Bóng pickleball (3 quả)', unit: 'hộp', group: 'Dụng cụ', price: 180000, cost: 115000 },
  { id: 'grip', name: 'Quấn cán vợt', unit: 'cuộn', group: 'Dụng cụ', price: 35000, cost: 14000 },
  { id: 'racket', name: 'Thuê vợt', unit: 'lượt', group: 'Dịch vụ', price: 30000, cost: 4000 },
];

/** Hội viên & khách đặt định kỳ (giảm 10%) */
export const FIXED_DISCOUNT = 0.1;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tỉ lệ kín sân theo giờ trong ngày thường */
function baseOccupancy(h: number): number {
  if (h <= 8) return 0.45;
  if (h <= 14) return 0.14;
  if (h <= 16) return 0.35;
  if (h <= 21) return 0.82;
  return 0.45;
}

let cache: { bookings: BookingRec[]; sales: SaleRec[] } | null = null;

export function getReportData() {
  if (!cache) cache = generate();
  return cache;
}

function generate() {
  const rnd = mulberry32(20261018);
  const chance = (p: number) => rnd() < p;
  const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));

  const fixedPool = [
    ...MEMBERS.map((m) => m.name),
    'CLB Phượng Hoàng',
    'FC Văn Phòng',
    'Team Bình',
    'Nhóm Sáu',
    'Team Q7',
    ...Array.from({ length: 46 }, (_, i) => `fixed-${i + 1}`),
  ];

  const bookings: BookingRec[] = [];
  const sales: SaleRec[] = [];
  const start = new Date(REPORT_START.y, REPORT_START.m, REPORT_START.d);
  const end = new Date(REPORT_TODAY.y, REPORT_TODAY.m, REPORT_TODAY.d);
  const totalDays = Math.round((end.getTime() - start.getTime()) / 864e5);

  for (let i = 0, dt = new Date(start); dt <= end; i++, dt.setDate(dt.getDate() + 1)) {
    const y = dt.getFullYear();
    const m = dt.getMonth();
    const d = dt.getDate();
    const k = y * 10000 + m * 100 + d;
    const weekend = dt.getDay() === 0 || dt.getDay() === 6;
    const growth = 0.78 + 0.22 * (i / totalDays); // cơ sở tăng trưởng dần
    const season = m === 1 && d <= 20 ? 0.55 : m === 6 || m === 7 ? 1.08 : 1; // Tết thấp, hè cao

    for (const c of COURTS) {
      for (let h = 6; h <= 22; ) {
        const p = Math.min(0.97, (baseOccupancy(h) + (weekend && h >= 9 && h <= 16 ? 0.25 : 0)) * growth * season);
        if (!chance(p)) {
          h++;
          continue;
        }
        const span = h < 22 && chance(0.35) ? 2 : 1;
        const peak = h >= 17 && h <= 21;
        const type: CustomerType = chance(peak ? 0.55 : 0.35) ? 'fixed' : 'walkin';
        const customer = type === 'fixed' ? fixedPool[int(0, fixedPool.length - 1)] : 'walkin-' + int(1, 6000);
        const amount = c.price * span * (type === 'fixed' ? 1 - FIXED_DISCOUNT : 1);
        bookings.push({ k, y, m, d, hour: h, span, courtId: c.id, sport: c.sport, amount, type, customer });

        const sell = (productId: string, prob: number, a: number, b: number) => {
          if (chance(prob)) sales.push({ k, m, d, hour: h, productId, qty: int(a, b) });
        };
        const team = c.sport === 'bd';
        const racketSport = c.sport === 'cl' || c.sport === 'tn' || c.sport === 'pb';
        sell('water', team ? 0.8 : 0.55, team ? 2 : 1, team ? 8 : 3);
        sell('pocari', 0.3, 1, team ? 4 : 2);
        sell('sting', 0.2, 1, 2);
        sell('towel', 0.25, 1, 3);
        if (c.sport === 'cl') sell('shuttle', 0.12, 1, 1);
        if (c.sport === 'pb') sell('pball', 0.15, 1, 1);
        if (racketSport) sell('grip', 0.06, 1, 1);
        if (racketSport) sell('racket', type === 'walkin' ? 0.3 : 0.05, 1, 2);

        h += span;
      }
    }
  }
  return { bookings, sales };
}
