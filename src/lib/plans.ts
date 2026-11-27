// Gói tập: khuôn khổ (mẫu chuẩn), bảng giá thành phần và cách tính giá đề xuất.
import type { IconName } from '../components/Icon';

export type Access = 'gym' | 'group' | 'pool' | 'court';
export type Extra = 'locker' | 'towel';
export type TemplateId = 'gym' | 'group' | 'pt' | 'combo' | 'offpeak' | 'court';

/** Giá thành phần mỗi tháng – căn cứ để tính giá đề xuất, mọi gói dùng chung */
export const ACCESS: Record<Access, { label: string; monthly: number }> = {
  gym: { label: 'Phòng gym', monthly: 650000 },
  group: { label: 'Lớp nhóm (Yoga, HIIT…)', monthly: 850000 },
  pool: { label: 'Hồ bơi', monthly: 300000 },
  court: { label: 'Đặt sân ưu đãi', monthly: 150000 },
};
export const EXTRAS: Record<Extra, { label: string; monthly: number }> = {
  locker: { label: 'Tủ đồ riêng', monthly: 100000 },
  towel: { label: 'Khăn & nước', monthly: 80000 },
};
export const PT_PRICE = 450000; // mỗi buổi
export const PT_BULK = { from: 24, discount: 0.1 };
export const OFFPEAK_DISCOUNT = 0.25;
export const durationDiscount = (m: number) => (m >= 12 ? 0.15 : m >= 6 ? 0.1 : m >= 3 ? 0.05 : 0);

export const PT_OPTIONS = [0, 8, 12, 24, 36];
export const FREEZE_OPTIONS = [0, 15, 30, 60];
export const COURT_DISCOUNT_OPTIONS = [0, 5, 10, 15, 20];
export const CUSTOM_MONTHS = [1, 2, 3, 6, 9, 12];

/** Ghi đè lệ phí từng dịch vụ cho riêng một gói (gói không tiêu chuẩn) */
export interface PlanFees {
  access?: Partial<Record<Access, number>>;
  extras?: Partial<Record<Extra, number>>;
  /** Tiền mỗi buổi PT */
  pt?: number;
}

export interface PlanShape {
  templateId: TemplateId;
  access: Access[];
  /** Thời hạn sử dụng (tháng) */
  months: number;
  ptSessions: number;
  offPeak: boolean;
  extras: Extra[];
  freezeDays: number;
  courtDiscount: number; // %
  /** Lệ phí tùy chỉnh riêng cho gói; không có thì dùng bảng phí chuẩn */
  fees?: PlanFees;
}

/** Lệ phí áp dụng: ưu tiên phí tùy chỉnh của gói, nếu không có thì bảng phí chuẩn */
export const accessFee = (p: PlanShape, a: Access) => p.fees?.access?.[a] ?? ACCESS[a].monthly;
export const extraFee = (p: PlanShape, e: Extra) => p.fees?.extras?.[e] ?? EXTRAS[e].monthly;
export const ptFee = (p: PlanShape) => p.fees?.pt ?? PT_PRICE;

export interface PlanStats {
  /** Số gói bán ra 6 tháng gần nhất (T5 → T10/2026) */
  sales: number[];
  /** Hội viên đang dùng */
  active: number;
  /** Tỉ lệ gia hạn 0–1, null khi chưa đủ dữ liệu */
  renewal: number | null;
  /** Lượt check-in (hoặc buổi PT) trung bình mỗi tuần của một hội viên */
  checkins: number;
  /** Hết hạn trong 14 ngày tới */
  expiring: number;
}

export interface CustomInfo {
  customer: string;
  phone?: string;
  memberCode?: string;
  note?: string;
}

export interface Plan extends PlanShape {
  id: string;
  name: string;
  price: number;
  status: 'active' | 'paused';
  /** Gói làm riêng theo yêu cầu một khách */
  custom?: CustomInfo;
  /** Gói danh mục dựng tự do, không theo khuôn khổ mẫu */
  freeform?: boolean;
  /** Gói riêng nhưng vẫn cho bán trong danh mục */
  listed?: boolean;
  createdAt: string;
  stats?: PlanStats;
}

export const MONTH_LABELS = ['T5', 'T6', 'T7', 'T8', 'T9', 'T10'];
export const CURRENT_MONTH = 'tháng 10';

export interface PlanTemplate {
  id: TemplateId;
  name: string;
  desc: string;
  icon: IconName;
  /** Quyền lợi bắt buộc của khuôn khổ */
  required: Access[];
  /** Thời hạn được phép */
  months: number[];
  pt?: number[];
  defaults: PlanShape;
}

const base = { ptSessions: 0, offPeak: false, extras: [] as Extra[], freezeDays: 30, courtDiscount: 0 };

export const TEMPLATES: PlanTemplate[] = [
  {
    id: 'gym', name: 'Gym tiêu chuẩn', desc: 'Tập phòng gym cả ngày.', icon: 'dumbbell',
    required: ['gym'], months: [1, 3, 6, 12],
    defaults: { ...base, templateId: 'gym', access: ['gym'], months: 6 },
  },
  {
    id: 'group', name: 'Yoga & lớp nhóm', desc: 'Không giới hạn lớp Yoga, HIIT, Zumba.', icon: 'users',
    required: ['group'], months: [1, 3, 6, 12],
    defaults: { ...base, templateId: 'group', access: ['group'], months: 3 },
  },
  {
    id: 'pt', name: 'PT cá nhân', desc: 'Gói buổi tập 1–1 với HLV, có hạn dùng.', icon: 'coach',
    required: [], months: [2, 3, 6], pt: [8, 12, 24, 36],
    defaults: { ...base, templateId: 'pt', access: [], months: 3, ptSessions: 12, freezeDays: 15 },
  },
  {
    id: 'combo', name: 'Combo Gym + Bơi', desc: 'Gym và hồ bơi, kèm khăn & nước.', icon: 'tag',
    required: ['gym', 'pool'], months: [3, 6, 12],
    defaults: { ...base, templateId: 'combo', access: ['gym', 'pool'], months: 6, extras: ['towel'] },
  },
  {
    id: 'offpeak', name: 'Giờ thấp điểm', desc: 'Chỉ tập 9:00–16:00 ngày thường, rẻ hơn 25%.', icon: 'timer',
    required: ['gym'], months: [1, 3, 6],
    defaults: { ...base, templateId: 'offpeak', access: ['gym'], months: 3, offPeak: true, freezeDays: 15 },
  },
  {
    id: 'court', name: 'Hội viên sân', desc: 'Giảm giá đặt sân cầu lông, pickleball, tennis.', icon: 'calendar',
    required: ['court'], months: [3, 6, 12],
    defaults: { ...base, templateId: 'court', access: ['court'], months: 6, courtDiscount: 15 },
  },
];
export const templateOf = (id: TemplateId) => TEMPLATES.find((t) => t.id === id)!;

const round10k = (n: number) => Math.round(n / 10000) * 10000;

/** Bảng tính giá đề xuất theo thành phần */
export function priceBreakdown(p: PlanShape): { lines: { label: string; amount: number }[]; suggested: number } {
  const lines: { label: string; amount: number }[] = [];
  let sub = 0;
  for (const a of p.access) {
    const v = accessFee(p, a) * p.months;
    lines.push({ label: `${ACCESS[a].label} × ${p.months} tháng`, amount: v });
    sub += v;
  }
  for (const e of p.extras) {
    const v = extraFee(p, e) * p.months;
    lines.push({ label: `${EXTRAS[e].label} × ${p.months} tháng`, amount: v });
    sub += v;
  }
  const dd = durationDiscount(p.months);
  if (sub && dd) {
    lines.push({ label: `Ưu đãi gói ${p.months} tháng −${dd * 100}%`, amount: -sub * dd });
    sub -= sub * dd;
  }
  if (sub && p.offPeak) {
    lines.push({ label: `Chỉ giờ thấp điểm −${OFFPEAK_DISCOUNT * 100}%`, amount: -sub * OFFPEAK_DISCOUNT });
    sub -= sub * OFFPEAK_DISCOUNT;
  }
  if (p.ptSessions) {
    const unit = ptFee(p);
    const v = p.ptSessions * unit;
    lines.push({ label: `PT ${p.ptSessions} buổi × ${unit.toLocaleString('vi-VN')}₫`, amount: v });
    sub += v;
    if (p.ptSessions >= PT_BULK.from) {
      lines.push({ label: `Ưu đãi PT từ ${PT_BULK.from} buổi −${PT_BULK.discount * 100}%`, amount: -v * PT_BULK.discount });
      sub -= v * PT_BULK.discount;
    }
  }
  return { lines, suggested: round10k(sub) };
}

export function autoName(p: PlanShape): string {
  const m = `${p.months} tháng`;
  const pt = p.ptSessions ? `PT ${p.ptSessions} buổi` : '';
  let head: string;
  switch (p.templateId) {
    case 'pt':
      return pt || `PT ${m}`;
    case 'combo':
      head = `Gym + Bơi ${m}`;
      break;
    case 'offpeak':
      head = `Gym giờ thấp điểm ${m}`;
      break;
    case 'group':
      head = `Yoga & lớp nhóm ${m}`;
      break;
    case 'court':
      head = `Hội viên sân ${m}`;
      break;
    default:
      head = `Gym ${m}`;
  }
  return pt ? `${head} + ${pt}` : head;
}

/** Quyền lợi dạng nhãn ngắn để hiện trong bảng / thẻ */
export function benefitTags(p: PlanShape): string[] {
  const t: string[] = p.access.map((a) => (a === 'group' ? 'Lớp nhóm' : a === 'court' ? `Giảm ${p.courtDiscount}% đặt sân` : ACCESS[a].label));
  if (p.ptSessions) t.push(`PT ${p.ptSessions} buổi`);
  if (p.offPeak) t.push('Giờ thấp điểm');
  for (const e of p.extras) t.push(EXTRAS[e].label);
  if (p.courtDiscount && !p.access.includes('court')) t.push(`Giảm ${p.courtDiscount}% đặt sân`);
  if (p.freezeDays) t.push(`Bảo lưu ${p.freezeDays} ngày`);
  return t;
}

export const salesThisMonth = (p: Plan) => p.stats?.sales[p.stats.sales.length - 1] ?? 0;
export const revenueThisMonth = (p: Plan) => salesThisMonth(p) * p.price;
