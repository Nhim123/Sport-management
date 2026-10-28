// Đăng nhập & đăng ký tài khoản cho nhân viên.
// Backend chưa có endpoint /auth nên tạm kiểm tra theo danh sách nhân viên mẫu;
// khi có API, thay thân hàm bằng client.post('/auth/login' | '/auth/register', …) và giữ nguyên chữ ký.
import type { StaffMember } from '../types/admin';
import { mockDelay } from './client';
import { DEMO_PASSWORD, STAFF } from '../mocks/admin';

/** Vai trò được vào chế độ quản lý */
const ALLOWED: StaffMember['role'][] = ['manager', 'reception'];

/** Độ dài mật khẩu tối thiểu */
export const MIN_PASSWORD = 6;

/** Tài khoản đã tạo: mã nhân viên → mật khẩu (dữ liệu mẫu, mất khi tải lại app) */
const ACCOUNTS = new Map<string, string>([
  ['NV01', DEMO_PASSWORD],
  ['NV02', DEMO_PASSWORD],
]);

const digitsOf = (s: string) => s.replace(/\D/g, '');
const normCode = (s: string) => s.trim().toUpperCase();

function checkAccess(staff: StaffMember) {
  if (!ALLOWED.includes(staff.role)) throw new Error('Tài khoản này không có quyền vào chế độ quản lý.');
  if (staff.status !== 'active') throw new Error('Tài khoản đang nghỉ phép – liên hệ quản lý.');
}

export async function login(identifier: string, password: string): Promise<StaffMember> {
  const id = identifier.trim();
  const digits = digitsOf(id);
  const staff = STAFF.find((s) => s.code === normCode(id) || (digits.length >= 9 && digitsOf(s.phone) === digits));
  await mockDelay(null, 400);
  if (staff && !ACCOUNTS.has(staff.code)) throw new Error('Nhân viên này chưa có tài khoản – chọn “Đăng ký” và nhập mã nhân viên.');
  if (!staff || ACCOUNTS.get(staff.code) !== password) throw new Error('Sai số điện thoại / mã nhân viên hoặc mật khẩu.');
  checkAccess(staff);
  return staff;
}

/** Bước 1 của đăng ký: mã nhân viên (bắt buộc) phải có trong hồ sơ và khớp số điện thoại */
export async function verifyStaff(code: string, phone: string): Promise<StaffMember> {
  const c = normCode(code);
  await mockDelay(null, 400);
  if (!c) throw new Error('Mã nhân viên là bắt buộc để tạo tài khoản.');
  const staff = STAFF.find((s) => s.code === c);
  if (!staff) throw new Error(`Không tìm thấy mã nhân viên ${c} – kiểm tra lại với quản lý.`);
  if (digitsOf(staff.phone) !== digitsOf(phone)) throw new Error('Số điện thoại không khớp với hồ sơ của mã nhân viên này.');
  checkAccess(staff);
  if (ACCOUNTS.has(staff.code)) throw new Error('Mã nhân viên này đã có tài khoản – hãy đăng nhập.');
  return staff;
}

/** Bước 2: đặt mật khẩu; kiểm tra lại bước 1 rồi tạo tài khoản */
export async function register(code: string, phone: string, password: string): Promise<StaffMember> {
  const staff = await verifyStaff(code, phone);
  if (password.length < MIN_PASSWORD) throw new Error(`Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự.`);
  ACCOUNTS.set(staff.code, password);
  return staff;
}

/** Tài khoản thử của dữ liệu mẫu (chỉ hiện ở bản phát triển) */
export const DEMO_ACCOUNT = { identifier: '0912 778 901', password: DEMO_PASSWORD };
