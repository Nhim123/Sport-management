// Dữ liệu mẫu – CHỈ lớp api/ được import file này. Khi backend sẵn sàng, bật API thật qua env.
import type { ClubSetup, Court } from '../types/domain';

export const COURTS: Court[] = [
  { id: 'cl1', name: 'Cầu lông 1', kind: 'Thảm PVC · trong nhà', sport: 'cl', price: 150000 },
  { id: 'cl2', name: 'Cầu lông 2', kind: 'Thảm PVC · trong nhà', sport: 'cl', price: 150000 },
  { id: 'pba', name: 'Pickleball A', kind: 'Ngoài trời · có mái', sport: 'pb', price: 180000 },
  { id: 'pbb', name: 'Pickleball B', kind: 'Ngoài trời', sport: 'pb', price: 180000 },
  { id: 'tn', name: 'Tennis', kind: 'Sân cứng · đèn LED', sport: 'tn', price: 250000 },
  { id: 'bd', name: 'Sân 5 người', kind: 'Cỏ nhân tạo', sport: 'bd', price: 450000 },
];

/** Giờ đã kín hôm nay theo từng sân */
export const TAKEN_TODAY: Record<string, number[]> = {
  cl1: [16, 17, 18, 19, 21],
  cl2: [18, 21],
  pba: [15, 17, 18, 20],
  pbb: [18, 19, 20],
  tn: [16, 17, 18, 19, 21, 22],
  bd: [18, 19, 20, 21],
};

/** Các ngày tới – giả định kín 18:00, 19:00 */
export const TAKEN_FUTURE = [18, 19];

/**
 * Thiết lập ban đầu của chủ sân: mở cửa T3 → CN (nghỉ T2),
 * khách chỉ đặt theo các ca cố định bên dưới.
 */
export const CLUB_SETUP: ClubSetup = {
  openDays: [1, 2, 3, 4, 5, 6], // 0 = T2 … 6 = CN → nghỉ T2
  shifts: [
    { id: 'sang', label: 'Ca sáng', start: 8, span: 2 }, // 08:00–10:00
    { id: 'chieu', label: 'Ca chiều', start: 15, span: 2 }, // 15:00–17:00
    { id: 'toi1', label: 'Ca tối 1', start: 17, span: 2 }, // 17:00–19:00
    { id: 'toi2', label: 'Ca tối 2', start: 19, span: 2 }, // 19:00–21:00
    { id: 'toi3', label: 'Ca tối 3', start: 21, span: 2 }, // 21:00–23:00
  ],
};
