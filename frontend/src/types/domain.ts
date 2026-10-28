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
