// Dữ liệu mẫu – CHỈ lớp api/ được import file này. Khi backend sẵn sàng, bật API thật qua env.
import type { ClassSession, Court, Member, PayMethod, ScheduleItem } from '../types/domain';

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

export const ME: Member = {
  firstName: 'Minh Anh',
  plan: 'Gym 12 tháng + PT',
  daysLeft: 138,
  until: '05/03/2027',
  ptLeft: 7,
  usedPct: 62,
};

export const MY_SCHEDULE: ScheduleItem[] = [
  { id: 's1', tag: 'HÔM NAY', time: '19:00', title: 'Cầu lông 2 · 1 giờ', sub: 'Mã ĐS-7731 · đã thanh toán', tone: 'brand', upcoming: true },
  { id: 's2', tag: 'T3 20/10', time: '06:30', title: 'PT với HLV Khoa', sub: 'Buổi 18/24 · Thân dưới', tone: 'clay', upcoming: false },
];

export const CLASSES_TONIGHT: ClassSession[] = [
  { id: 'c1', time: '19:30', name: 'HIIT 45 phút', sub: 'HLV Khoa · còn 5 chỗ', full: false },
  { id: 'c2', time: '19:00', name: 'Vinyasa Flow', sub: 'Hết chỗ · danh sách chờ', full: true },
  { id: 'c3', time: '17:30', name: 'Hatha Yoga', sub: 'HLV Mai · còn 6 chỗ', full: false },
];

export const PAY_METHODS: PayMethod[] = [
  { id: 'qr', logo: 'QR', title: 'Chuyển khoản VietQR', sub: 'Mọi ngân hàng · xác nhận tự động', tone: 'info', warn: false },
  { id: 'wallet', logo: 'Ví', title: 'Ví điện tử', sub: 'MoMo, ZaloPay, ShopeePay', tone: 'clay', warn: false },
  { id: 'card', logo: 'Thẻ', title: 'Thẻ ATM / Visa / Mastercard', sub: '', tone: 'neutral', warn: false },
  { id: 'desk', logo: 'Quầy', title: 'Trả tại quầy', sub: 'Cần cọc 50% để giữ sân giờ cao điểm', tone: 'brand', warn: true },
];
