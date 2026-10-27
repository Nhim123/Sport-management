// Hằng số nghiệp vụ & nhãn hiển thị – không phải dữ liệu động (dữ liệu động lấy qua API).
import type { Sport, SportOption } from '../types/domain';

export const SPORTS: SportOption[] = [
  { id: 'cl', label: 'Cầu lông' },
  { id: 'pb', label: 'Pickleball' },
  { id: 'tn', label: 'Tennis' },
  { id: 'bd', label: 'Bóng đá' },
];

/** Khung giờ mở cửa trong ngày */
export const TIMES = [6, 7, 8, 9, 15, 16, 17, 18, 19, 20, 21, 22];

export const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
export const DOW_LONG = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

/** Ngày hiện tại (mô phỏng theo bản thiết kế – 18/10) */
export const TODAY = 18;

export const MEMBER_DISCOUNT = 0.1;
export const RACKET_RENT = 30000;
export const HOLD_SECONDS = 9 * 60 + 42;

export type { Sport };
