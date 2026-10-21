// Tổng hợp doanh thu đặt sân & lợi nhuận sản phẩm theo ngày / tháng / năm.
import { COURTS, type Court } from '../data/mock';
import {
  PRODUCTS,
  REPORT_START,
  REPORT_TODAY,
  getReportData,
  type CustomerType,
  type Product,
  type Ymd,
} from '../data/reports';
import { hh } from './format';

export type Granularity = 'day' | 'month' | 'year';

const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const DOW_LONG = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
const pad = (n: number) => String(n).padStart(2, '0');

export const ymdKey = (x: Ymd) => x.y * 10000 + x.m * 100 + x.d;
export const daysIn = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const fromDate = (dt: Date): Ymd => ({ y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate() });
const addDays = (x: Ymd, n: number) => fromDate(new Date(x.y, x.m, x.d + n));

export function clampYmd(x: Ymd): Ymd {
  if (ymdKey(x) < ymdKey(REPORT_START)) return REPORT_START;
  if (ymdKey(x) > ymdKey(REPORT_TODAY)) return REPORT_TODAY;
  return x;
}

/** "2026-10-18" <-> Ymd (tháng 0–11) */
export function toIso(x: Ymd): string {
  return `${x.y}-${pad(x.m + 1)}-${pad(x.d)}`;
}
export function parseIso(s: string | null): Ymd | null {
  const m = s?.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!m) return null;
  const x = { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3] ?? 1) };
  if (x.m < 0 || x.m > 11 || x.d < 1 || x.d > daysIn(x.y, x.m)) return null;
  return clampYmd(x);
}

export function periodRange(a: Ymd, g: Granularity): { from: Ymd; to: Ymd } {
  if (g === 'day') return { from: a, to: a };
  if (g === 'month') return { from: { y: a.y, m: a.m, d: 1 }, to: { y: a.y, m: a.m, d: daysIn(a.y, a.m) } };
  return { from: { y: a.y, m: 0, d: 1 }, to: { y: a.y, m: 11, d: 31 } };
}

export function periodLabel(a: Ymd, g: Granularity): string {
  if (g === 'day') return `${DOW_LONG[new Date(a.y, a.m, a.d).getDay()]}, ${pad(a.d)}/${pad(a.m + 1)}/${a.y}`;
  if (g === 'month') return `Tháng ${a.m + 1}/${a.y}`;
  return `Năm ${a.y}`;
}

export function shift(a: Ymd, g: Granularity, dir: 1 | -1): Ymd {
  if (g === 'day') return clampYmd(addDays(a, dir));
  if (g === 'month') {
    const dt = new Date(a.y, a.m + dir, 1);
    const y = dt.getFullYear();
    const m = dt.getMonth();
    return clampYmd({ y, m, d: Math.min(a.d, daysIn(y, m)) });
  }
  return clampYmd({ y: a.y + dir, m: a.m, d: Math.min(a.d, daysIn(a.y + dir, a.m)) });
}

export function canShift(a: Ymd, g: Granularity, dir: 1 | -1): boolean {
  const { from, to } = periodRange(a, g);
  return dir < 0 ? ymdKey(from) > ymdKey(REPORT_START) : ymdKey(to) < ymdKey(REPORT_TODAY);
}

export interface Bucket {
  label: string; // nhãn trục
  full: string; // nhãn đầy đủ cho tooltip / bảng
  future: boolean;
}

export function buckets(a: Ymd, g: Granularity): Bucket[] {
  if (g === 'day') {
    return Array.from({ length: 17 }, (_, i) => ({ label: `${6 + i}h`, full: `${hh(6 + i)}–${hh(7 + i)}`, future: false }));
  }
  if (g === 'month') {
    return Array.from({ length: daysIn(a.y, a.m) }, (_, i) => {
      const x = { y: a.y, m: a.m, d: i + 1 };
      return {
        label: String(i + 1),
        full: `${DOW[new Date(x.y, x.m, x.d).getDay()]} ${pad(x.d)}/${pad(x.m + 1)}`,
        future: ymdKey(x) > ymdKey(REPORT_TODAY),
      };
    });
  }
  return Array.from({ length: 12 }, (_, i) => ({
    label: `T${i + 1}`,
    full: `Tháng ${i + 1}/${a.y}`,
    future: a.y * 100 + i > REPORT_TODAY.y * 100 + REPORT_TODAY.m,
  }));
}

const bucketIndex = (r: { m: number; d: number; hour: number }, g: Granularity) =>
  g === 'day' ? r.hour - 6 : g === 'month' ? r.d - 1 : r.m;

/**
 * Kỳ so sánh. Kỳ đang diễn ra (chứa "hôm nay") được so với cùng số ngày của kỳ trước
 * để không lấy tháng chưa hết so với tháng đã đủ ngày.
 */
function compareRange(a: Ymd, g: Granularity): { from: Ymd; to: Ymd; label: string } | null {
  const cur = periodRange(a, g);
  const t = ymdKey(REPORT_TODAY);
  const ongoing = ymdKey(cur.from) <= t && t <= ymdKey(cur.to);
  let from: Ymd;
  let to: Ymd;
  let label: string;
  if (g === 'day') {
    from = to = addDays(a, -7);
    label = 'so với cùng thứ tuần trước';
  } else if (g === 'month') {
    const dt = new Date(a.y, a.m - 1, 1);
    const y = dt.getFullYear();
    const m = dt.getMonth();
    from = { y, m, d: 1 };
    to = { y, m, d: ongoing ? Math.min(REPORT_TODAY.d, daysIn(y, m)) : daysIn(y, m) };
    label = ongoing ? 'so với cùng kỳ tháng trước' : 'so với tháng trước';
  } else {
    from = { y: a.y - 1, m: 0, d: 1 };
    to = ongoing ? { y: a.y - 1, m: REPORT_TODAY.m, d: REPORT_TODAY.d } : { y: a.y - 1, m: 11, d: 31 };
    label = ongoing ? 'so với cùng kỳ năm trước' : 'so với năm trước';
  }
  if (ymdKey(from) < ymdKey(REPORT_START)) return null;
  return { from, to, label };
}

export interface TypeStats {
  revenue: number;
  count: number;
  customers: number;
}

export interface ProductRow {
  product: Product;
  qty: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface SeriesPoint extends Bucket {
  values: number[];
}

export interface Summary {
  compareLabel: string | null;
  booking: {
    total: number;
    prev: number | null;
    byType: Record<CustomerType, TypeStats>;
    byCourt: { court: Court; revenue: number; count: number }[];
    /** values = [cố định, vãng lai] */
    series: SeriesPoint[];
  };
  products: {
    rows: ProductRow[];
    revenue: number;
    cost: number;
    profit: number;
    prevRevenue: number | null;
    prevProfit: number | null;
    /** values = [lợi nhuận] của sản phẩm đang chọn (hoặc tất cả) */
    series: SeriesPoint[];
  };
}

/** Doanh thu từng ngày của `days` ngày kết thúc tại `end`; values = [đặt sân, sản phẩm] */
export function dailyRevenue(end: Ymd, days: number): SeriesPoint[] {
  const { bookings, sales } = getReportData();
  const keys = Array.from({ length: days }, (_, i) => addDays(end, i - days + 1));
  const at = new Map(keys.map((x, i) => [ymdKey(x), i]));
  const out: SeriesPoint[] = keys.map((x) => {
    const dow = new Date(x.y, x.m, x.d).getDay();
    const dm = `${pad(x.d)}/${pad(x.m + 1)}`;
    return { label: DOW[dow], full: `${DOW_LONG[dow]} ${dm}`, future: false, values: [0, 0] };
  });
  const price = new Map(PRODUCTS.map((p) => [p.id, p.price]));

  for (const r of bookings) {
    const i = at.get(r.k);
    if (i !== undefined) out[i].values[0] += r.amount;
  }
  for (const s of sales) {
    const i = at.get(s.k);
    if (i !== undefined) out[i].values[1] += s.qty * price.get(s.productId)!;
  }
  return out;
}

export function summarize(a: Ymd, g: Granularity, productId: string | null): Summary {
  const { bookings, sales } = getReportData();
  const range = periodRange(a, g);
  const f = ymdKey(range.from);
  const t = ymdKey(range.to);
  const cmp = compareRange(a, g);
  const cf = cmp ? ymdKey(cmp.from) : 0;
  const ct = cmp ? ymdKey(cmp.to) : -1;
  const bks = buckets(a, g);

  // ---- Đặt sân ----
  const bSeries: SeriesPoint[] = bks.map((b) => ({ ...b, values: [0, 0] }));
  const byType: Record<CustomerType, TypeStats> = {
    fixed: { revenue: 0, count: 0, customers: 0 },
    walkin: { revenue: 0, count: 0, customers: 0 },
  };
  const people: Record<CustomerType, Set<string>> = { fixed: new Set(), walkin: new Set() };
  const courts = new Map(COURTS.map((c) => [c.id, { court: c, revenue: 0, count: 0 }]));
  let total = 0;
  let prev = 0;

  for (const r of bookings) {
    if (r.k >= f && r.k <= t) {
      total += r.amount;
      const s = byType[r.type];
      s.revenue += r.amount;
      s.count += 1;
      people[r.type].add(r.customer);
      bSeries[bucketIndex(r, g)].values[r.type === 'fixed' ? 0 : 1] += r.amount;
      const c = courts.get(r.courtId)!;
      c.revenue += r.amount;
      c.count += 1;
    } else if (r.k >= cf && r.k <= ct) {
      prev += r.amount;
    }
  }
  byType.fixed.customers = people.fixed.size;
  byType.walkin.customers = people.walkin.size;

  // ---- Sản phẩm ----
  const rows = new Map<string, ProductRow>(PRODUCTS.map((p) => [p.id, { product: p, qty: 0, revenue: 0, cost: 0, profit: 0 }]));
  const pSeries: SeriesPoint[] = bks.map((b) => ({ ...b, values: [0] }));
  let prevRevenue = 0;
  let prevProfit = 0;

  for (const s of sales) {
    const row = rows.get(s.productId)!;
    const p = row.product;
    if (s.k >= f && s.k <= t) {
      row.qty += s.qty;
      row.revenue += s.qty * p.price;
      row.cost += s.qty * p.cost;
      if (!productId || productId === p.id) pSeries[bucketIndex(s, g)].values[0] += s.qty * (p.price - p.cost);
    } else if (s.k >= cf && s.k <= ct) {
      prevRevenue += s.qty * p.price;
      prevProfit += s.qty * (p.price - p.cost);
    }
  }
  const productRows = [...rows.values()].map((r) => ({ ...r, profit: r.revenue - r.cost }));
  const pRevenue = productRows.reduce((s, r) => s + r.revenue, 0);
  const pCost = productRows.reduce((s, r) => s + r.cost, 0);

  return {
    compareLabel: cmp?.label ?? null,
    booking: {
      total,
      prev: cmp ? prev : null,
      byType,
      byCourt: [...courts.values()].sort((x, y) => y.revenue - x.revenue),
      series: bSeries,
    },
    products: {
      rows: productRows,
      revenue: pRevenue,
      cost: pCost,
      profit: pRevenue - pCost,
      prevRevenue: cmp ? prevRevenue : null,
      prevProfit: cmp ? prevProfit : null,
      series: pSeries,
    },
  };
}
