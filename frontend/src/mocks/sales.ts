// Nhân viên tiếp thị của Arena (dữ liệu mẫu). Mỗi người có một mã do Arena cấp để ghi nhận các câu lạc bộ họ hướng dẫn đăng ký.
import type { SalesRep } from '../types/admin';

export const SALES_REPS: SalesRep[] = [
  { code: 'MKT001', name: 'Lê Minh Tuấn', team: 'Tiếp thị · TP. Hồ Chí Minh', phone: '0903 210 001', active: true },
  { code: 'MKT002', name: 'Phạm Thu Hà', team: 'Tiếp thị · Hà Nội', phone: '0912 210 002', active: true },
  { code: 'MKT003', name: 'Trần Quốc Việt', team: 'Tiếp thị · Đà Nẵng', phone: '0935 210 003', active: true },
  { code: 'MKT004', name: 'Nguyễn Thị Lan', team: 'Tiếp thị · TP. Hồ Chí Minh', phone: '0908 210 004', active: false },
];
