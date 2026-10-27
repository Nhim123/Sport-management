// Kiểu dữ liệu domain dùng chung cho toàn app (FE) – khớp với response của backend.

export type Sport = 'cl' | 'pb' | 'tn' | 'bd';

export interface SportOption {
  id: Sport;
  label: string;
}

export interface Court {
  id: string;
  name: string;
  kind: string;
  sport: Sport;
  price: number; // ₫ / giờ
}

/** Thẻ hội viên hiển thị ở trang chủ */
export interface Member {
  firstName: string;
  plan: string;
  daysLeft: number;
  until: string;
  ptLeft: number;
  usedPct: number;
}

export type ScheduleTone = 'brand' | 'clay';

export interface ScheduleItem {
  id: string;
  tag: string;
  time: string;
  title: string;
  sub: string;
  tone: ScheduleTone;
  upcoming: boolean;
}

export interface ClassSession {
  id: string;
  time: string;
  name: string;
  sub: string;
  full: boolean;
}

export type PayTone = 'info' | 'clay' | 'brand' | 'neutral';

export interface PayMethod {
  id: string;
  logo: string;
  title: string;
  sub: string;
  tone: PayTone;
  warn: boolean;
}

/** Dữ liệu gửi lên khi tạo một lượt đặt sân */
export interface CreateBookingInput {
  courtId: string;
  dayIndex: number;
  hour: number;
  racket: boolean;
  method: string;
}

export interface Booking {
  code: string;
  courtId: string;
  dayIndex: number;
  hour: number;
  total: number;
}
