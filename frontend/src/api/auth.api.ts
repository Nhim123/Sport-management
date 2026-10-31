// Đăng nhập & đăng ký tài khoản quản lý.
// Mỗi câu lạc bộ (phòng tập / gym) chỉ có MỘT tài khoản, thuộc về người quản lý; nhân viên khác không đăng nhập.
// Backend chưa có endpoint /auth nên tạm kiểm tra theo danh sách nhân viên mẫu;
// khi có API, thay thân hàm bằng client.post('/auth/login' | '/auth/register', …) và giữ nguyên chữ ký.
import type { StaffMember } from '../types/admin';
import { mockDelay } from './client';
import { DEMO_PASSWORD, STAFF } from '../mocks/admin';

/** Chỉ người quản lý câu lạc bộ có tài khoản */
const ALLOWED: StaffMember['role'][] = ['manager'];

/** Độ dài mật khẩu tối thiểu */
export const MIN_PASSWORD = 6;

/** Tài khoản của câu lạc bộ: mã nhân viên người quản lý → mật khẩu (dữ liệu mẫu, mất khi tải lại app) */
const ACCOUNTS = new Map<string, string>([['NV01', DEMO_PASSWORD]]);

const digitsOf = (s: string) => s.replace(/\D/g, '');
const normCode = (s: string) => s.trim().toUpperCase();

function checkAccess(staff: StaffMember) {
  if (!ALLOWED.includes(staff.role)) throw new Error('Chỉ người quản lý câu lạc bộ có tài khoản – nhân viên khác không đăng nhập.');
  if (staff.status !== 'active') throw new Error('Tài khoản đang nghỉ phép – liên hệ quản lý.');
}

export async function login(identifier: string, password: string): Promise<StaffMember> {
  const id = identifier.trim();
  const digits = digitsOf(id);
  const staff = STAFF.find((s) => s.code === normCode(id) || (digits.length >= 9 && digitsOf(s.phone) === digits));
  await mockDelay(null, 400);
  if (staff && !ACCOUNTS.has(staff.code)) {
    if (!ALLOWED.includes(staff.role)) checkAccess(staff);
    throw new Error('Người quản lý chưa có tài khoản – chọn “Đăng ký” và nhập mã nhân viên.');
  }
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
  if (ACCOUNTS.size > 0) throw new Error('Câu lạc bộ đã có tài khoản quản lý – mỗi câu lạc bộ chỉ có một tài khoản.');
  return staff;
}

/** Bước 2: đặt mật khẩu; kiểm tra lại bước 1 rồi tạo tài khoản */
export async function register(code: string, phone: string, password: string): Promise<StaffMember> {
  const staff = await verifyStaff(code, phone);
  if (password.length < MIN_PASSWORD) throw new Error(`Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự.`);
  ACCOUNTS.set(staff.code, password);
  return staff;
}

/**
 * Giai đoạn test: mở app là vào thẳng chế độ quản lý bằng tài khoản thử, không qua màn đăng nhập.
 * Chỉ bật ở bản phát triển (Expo Go / dev server); bản build phát hành luôn tắt.
 * Tắt thủ công: EXPO_PUBLIC_AUTO_LOGIN=false
 */
export const AUTO_LOGIN = __DEV__ && process.env.EXPO_PUBLIC_AUTO_LOGIN !== 'false';

/** Tài khoản thử của dữ liệu mẫu (chỉ hiện ở bản phát triển) */
export const DEMO_ACCOUNT = { identifier: '0908 111 222', password: DEMO_PASSWORD };

/** Phiên có sẵn cho bản test – lấy thẳng từ hồ sơ người quản lý, không cần chờ đăng nhập */
export const testSession = (): StaffMember | null => (AUTO_LOGIN ? STAFF.find((s) => s.code === 'NV01') ?? null : null);
