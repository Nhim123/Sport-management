// Kiểm tra hồ sơ đăng ký câu lạc bộ – dùng chung cho màn đăng ký (báo lỗi từng ô) và API (kiểm tra lại trước khi tạo).
import type { ClubSignup } from '../types/admin';
import type { Activity, Sport } from '../types/domain';
import { provinceByCode } from './vnAddress';

export type OwnerErrors = Partial<Record<keyof ClubSignup['owner'], string>>;
export type ClubErrors = Partial<Record<'name' | 'address' | 'ward' | 'province' | 'sports', string>>;

/** Môn có sân – cần khai số sân */
export const COURT_SPORTS: Sport[] = ['cl', 'pb', 'tn', 'bd'];
/** Thứ tự hiện các môn trên màn đăng ký: môn sân trước, rồi bộ môn tập */
export const SIGNUP_SPORTS: Activity[] = ['cl', 'pb', 'tn', 'bd', 'gym', 'yoga', 'hiit', 'swim', 'pt'];
export const MAX_COURTS = 50;

export const isCourtSport = (a: Activity): a is Sport => (COURT_SPORTS as Activity[]).includes(a);
export const digitsOf = (s: string) => s.replace(/\D/g, '');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateOwner(o: ClubSignup['owner']): OwnerErrors {
  const e: OwnerErrors = {};
  const name = o.name.trim();
  if (!name) e.name = 'Nhập họ và tên người đại diện.';
  else if (name.split(/\s+/).length < 2) e.name = 'Nhập đầy đủ họ và tên (VD: Nguyễn Văn An).';
  const cccd = digitsOf(o.cccd);
  if (!cccd) e.cccd = 'Nhập số căn cước công dân.';
  else if (cccd.length !== 12) e.cccd = `Số CCCD gồm 12 chữ số (đang có ${cccd.length}).`;
  const phone = digitsOf(o.phone);
  if (!phone) e.phone = 'Nhập số điện thoại – dùng để đăng nhập.';
  else if (!/^0\d{9}$/.test(phone)) e.phone = 'Số điện thoại di động gồm 10 chữ số, bắt đầu bằng 0.';
  if (!o.email.trim()) e.email = 'Nhập email để nhận hoá đơn và khôi phục mật khẩu.';
  else if (!EMAIL.test(o.email.trim())) e.email = 'Email chưa đúng định dạng (VD: ten@gmail.com).';
  return e;
}

export function validateClub(c: ClubSignup['club']): ClubErrors {
  const e: ClubErrors = {};
  if (c.name.trim().length < 3) e.name = 'Nhập tên câu lạc bộ (ít nhất 3 ký tự).';
  const p = provinceByCode(c.provinceCode);
  if (!p) e.province = 'Chọn tỉnh / thành phố.';
  else if (!p.wards.some((w) => w.code === c.wardCode)) e.ward = 'Chọn phường / xã.';
  if (!c.address.trim()) e.address = 'Nhập số nhà, tên đường.';
  if (c.sports.length === 0) e.sports = 'Chọn ít nhất một môn kinh doanh.';
  return e;
}

export const hasErrors = (e: object) => Object.values(e).some(Boolean);
