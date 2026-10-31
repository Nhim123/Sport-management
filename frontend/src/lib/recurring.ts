// Đặt sân định kỳ cho câu lạc bộ: lặp theo thứ trong tuần trong một khoảng ngày.
// Ngày dạng ISO "2026-10-18"; thứ: 0 = T2 … 6 = CN.
import type { AdminBooking, RecurringBooking } from '../types/admin';

/** "Hôm nay" của dữ liệu mẫu: CN 18/10/2026 */
export const TODAY_ISO = '2026-10-18';
export const WD = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const addDays = (s: string, n: number) => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return toIso(d);
};
export const weekday = (s: string) => (parse(s).getDay() + 6) % 7;
export const dm = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)}`;
export const dayLabel = (s: string) => `${WD[weekday(s)]} ${dm(s)}`;
export const daysBetween = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000);

type Pattern = Pick<RecurringBooking, 'days' | 'from' | 'to' | 'skips'>;

/** Các ngày có buổi (bỏ ngày nghỉ), tính từ `since` (mặc định từ đầu hợp đồng) */
export function occurrences(r: Pattern, since?: string, limit = Infinity): string[] {
  const out: string[] = [];
  let d = since && since > r.from ? since : r.from;
  while (d <= r.to && out.length < limit) {
    if (r.days.includes(weekday(d)) && !r.skips.includes(d)) out.push(d);
    d = addDays(d, 1);
  }
  return out;
}

export const overlaps = (aStart: number, aSpan: number, bStart: number, bSpan: number) => aStart < bStart + bSpan && bStart < aStart + aSpan;

/** Buổi bị trùng: với hợp đồng định kỳ khác (chưa kết thúc) và với lịch đặt của hôm nay */
export function conflicts(
  draft: Pattern & Pick<RecurringBooking, 'courtId' | 'start' | 'span'>,
  series: RecurringBooking[],
  today: AdminBooking[],
  ignoreId?: string,
): { date: string; who: string }[] {
  const out = new Map<string, string>();
  const others = series.filter((s) => s.id !== ignoreId && s.status !== 'ended' && s.courtId === draft.courtId && overlaps(draft.start, draft.span, s.start, s.span));
  for (const date of occurrences(draft, TODAY_ISO)) {
    const s = others.find((x) => occurrences(x, date, 1)[0] === date);
    if (s) {
      out.set(date, s.club);
      continue;
    }
    if (date === TODAY_ISO) {
      const b = today.find((x) => x.courtId === draft.courtId && overlaps(draft.start, draft.span, x.start, x.span));
      if (b) out.set(date, b.label);
    }
  }
  return [...out].map(([date, who]) => ({ date, who }));
}

/** Giảm giá theo thời hạn hợp đồng (tuần) và khi trả trước toàn bộ */
export const RECUR_DISCOUNT: Record<number, number> = { 4: 0.05, 8: 0.08, 12: 0.1, 24: 0.15 };
export const PREPAID_EXTRA = 0.05;

export function sessionPrice(courtPrice: number, span: number, weeks: number, prepaid: boolean) {
  const discount = (RECUR_DISCOUNT[weeks] ?? 0) + (prepaid ? PREPAID_EXTRA : 0);
  return { discount, price: Math.round((courtPrice * span * (1 - discount)) / 1000) * 1000 };
}

/** Còn bao nhiêu ngày thì hết hợp đồng */
export const daysLeft = (r: Pick<RecurringBooking, 'to'>) => daysBetween(TODAY_ISO, r.to);
