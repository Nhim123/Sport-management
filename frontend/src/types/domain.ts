// Kiểu dữ liệu domain dùng chung cho toàn app (FE) – khớp với response của backend.

export type Sport = 'cl' | 'pb' | 'tn' | 'bd';

/** Môn / bộ môn có logo riêng: các môn sân + gym, yoga, HIIT, bơi, PT */
export type Activity = Sport | 'gym' | 'yoga' | 'hiit' | 'swim' | 'pt';

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

/** Một ca cố định do chủ sân thiết lập (khung giờ chơi) */
export interface CourtShift {
  id: string;
  label: string; // VD: "Ca tối 1"
  start: number; // giờ bắt đầu, 17 = 17:00
  span: number; // số giờ
}

/** Thiết lập ban đầu của chủ sân: ngày mở cửa & các ca cố định */
export interface ClubSetup {
  openDays: number[]; // thứ mở cửa: 0 = T2 … 6 = CN
  shifts: CourtShift[];
}
