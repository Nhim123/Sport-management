// Gói tập ghép từ nhiều thành phần (phòng gym, giờ sân, lớp nhóm, PT, bơi) – câu lạc bộ tự đặt, không theo khuôn cố định.
import type { PlanPart } from '../types/admin';
import type { Activity, Sport } from '../types/domain';

const SPORT_NAME: Record<Sport, string> = { cl: 'Cầu lông', pb: 'Pickleball', tn: 'Tennis', bd: 'Sân bóng' };

/** Giá lẻ tham khảo để gợi ý giá gói */
export const UNIT = {
  gym: 650000, // / tháng, cả ngày
  gymOffPeak: 450000, // / tháng, giờ thấp điểm
  courtHour: { cl: 150000, pb: 180000, tn: 250000, bd: 450000 } as Record<Sport, number>, // / giờ
  classUnlimited: 800000, // / tháng
  classSession: 100000, // / buổi
  ptSession: 400000, // / buổi (tính cho cả gói)
  swim: 300000, // / tháng
};
/** Giờ sân trong gói rẻ hơn thuê lẻ; khung thấp điểm rẻ thêm */
const COURT_PACK = 0.85;
const OFF_PEAK = 0.7;
/** Giảm giá theo thời hạn gói */
export const DURATION_DISCOUNT: Record<number, number> = { 1: 0, 3: 0.05, 6: 0.1, 12: 0.15 };

export function partLabel(p: PlanPart): string {
  const peak = p.offPeak ? ' · giờ thấp điểm' : '';
  switch (p.kind) {
    case 'gym':
      return `Phòng gym${p.offPeak ? ' giờ thấp điểm' : ''}`;
    case 'court':
      return `${SPORT_NAME[p.sport ?? 'cl']} ${p.qty ?? 0} giờ/tháng${peak}`;
    case 'class':
      return p.qty ? `Lớp nhóm ${p.qty} buổi/tháng` : 'Lớp nhóm không giới hạn';
    case 'pt':
      return `PT ${p.qty ?? 0} buổi`;
    case 'swim':
      return 'Hồ bơi';
  }
}

/** Logo hiển thị cho thành phần */
export function partSport(p: PlanPart): Activity {
  switch (p.kind) {
    case 'court':
      return p.sport ?? 'cl';
    case 'class':
      return 'yoga';
    default:
      return p.kind;
  }
}

/** Giá lẻ của thành phần trong một tháng (PT tính riêng theo cả gói) */
export function partMonthly(p: PlanPart): number {
  switch (p.kind) {
    case 'gym':
      return p.offPeak ? UNIT.gymOffPeak : UNIT.gym;
    case 'court':
      return UNIT.courtHour[p.sport ?? 'cl'] * (p.qty ?? 0) * COURT_PACK * (p.offPeak ? OFF_PEAK : 1);
    case 'class':
      return p.qty ? UNIT.classSession * p.qty : UNIT.classUnlimited;
    case 'swim':
      return UNIT.swim;
    case 'pt':
      return 0;
  }
}

/** Giá gợi ý: (tổng tiền theo tháng × số tháng − giảm theo thời hạn) + PT; làm tròn 10.000₫ */
export function suggestPrice(parts: PlanPart[], months: number) {
  const monthly = parts.reduce((s, p) => s + partMonthly(p), 0);
  const pt = parts.filter((p) => p.kind === 'pt').reduce((s, p) => s + UNIT.ptSession * (p.qty ?? 0), 0);
  const discount = DURATION_DISCOUNT[months] ?? 0;
  const gross = monthly * months + pt;
  const total = Math.round((monthly * months * (1 - discount) + pt) / 10000) * 10000;
  return { monthly, pt, discount, gross, total };
}

/** Tên gói tự đặt theo thành phần, vd "Gym + Cầu lông 8h · 3 tháng" */
export function autoName(parts: PlanPart[], months: number): string {
  const short = parts.map((p) => {
    switch (p.kind) {
      case 'gym':
        return p.offPeak ? 'Gym thấp điểm' : 'Gym';
      case 'court':
        return `${SPORT_NAME[p.sport ?? 'cl']} ${p.qty}h`;
      case 'class':
        return p.qty ? `Lớp ${p.qty} buổi` : 'Lớp nhóm';
      case 'pt':
        return `PT ${p.qty} buổi`;
      case 'swim':
        return 'Bơi';
    }
  });
  return `${short.join(' + ') || 'Gói mới'} · ${months} tháng`;
}
