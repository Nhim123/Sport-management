import { CLOSE_HOUR, type Booking, type Court } from '../data/mock';

/** Trạng thái một sân tại một thời điểm – suy ra từ store đặt sân, không lưu riêng */
export type CourtStatusKind = 'inUse' | 'class' | 'pending' | 'blocked' | 'soon' | 'free';

export interface CourtStatus {
  court: Court;
  kind: CourtStatusKind;
  /** Lượt đang diễn ra tại thời điểm xem */
  current?: Booking;
  /** Lượt kế tiếp bắt đầu sau thời điểm xem */
  next?: Booking;
  /** Phút còn lại của lượt hiện tại, hoặc số phút còn trống khi sân trống */
  minutesLeft: number;
  /** 0–1: phần đã trôi qua của lượt hiện tại */
  progress: number;
}

/** Sân trống nhưng lượt kế tiếp bắt đầu trong khoảng này → "Sắp tới lượt" */
export const SOON_MINUTES = 30;

const KIND_BY_STATE: Record<Booking['state'], CourtStatusKind> = {
  booked: 'inUse',
  class: 'class',
  pending: 'pending',
  blocked: 'blocked',
};

/** t là giờ thập phân: 19.25 = 19:15 */
export function courtStatus(court: Court, bookings: Booking[], t: number): CourtStatus {
  const mine = bookings.filter((b) => b.courtId === court.id).sort((a, b) => a.start - b.start);
  const current = mine.find((b) => b.start <= t && t < b.start + b.span);
  const next = mine.find((b) => b.start > t);

  if (current) {
    return {
      court,
      kind: KIND_BY_STATE[current.state],
      current,
      next,
      minutesLeft: Math.round((current.start + current.span - t) * 60),
      progress: (t - current.start) / current.span,
    };
  }

  const minutesLeft = Math.round(((next ? next.start : CLOSE_HOUR) - t) * 60);
  return {
    court,
    kind: next && minutesLeft <= SOON_MINUTES ? 'soon' : 'free',
    next,
    minutesLeft,
    progress: 0,
  };
}

/** 45 -> "45 phút", 90 -> "1 giờ 30 phút", 120 -> "2 giờ" */
export function fmtDuration(min: number): string {
  if (min < 60) return `${min} phút`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} giờ ${m} phút` : `${h} giờ`;
}
