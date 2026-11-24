// Đăng nhập & đăng ký câu lạc bộ.
// Mỗi câu lạc bộ (phòng tập / gym) chỉ có MỘT tài khoản, thuộc về người đại diện (quản lý); nhân viên khác không đăng nhập.
// Câu lạc bộ mới tự đăng ký: hồ sơ người đại diện + thông tin câu lạc bộ + mật khẩu.
// Backend chưa có endpoint /auth nên tạm giữ trong bộ nhớ;
// khi có API, thay thân hàm bằng client.post('/auth/login' | '/auth/check-owner' | '/auth/register', …) và giữ nguyên chữ ký.
import type { ClubSignup, SalesRep, StaffMember } from '../types/admin';
import { mockDelay } from './client';
import { DEMO_PASSWORD, STAFF } from '../mocks/admin';
import { SALES_REPS } from '../mocks/sales';
import { digitsOf, hasErrors, isCourtSport, validateClub, validateOwner } from '../lib/signup';

/** Chỉ người quản lý câu lạc bộ có tài khoản */
const ALLOWED: StaffMember['role'][] = ['manager'];

/** Độ dài mật khẩu tối thiểu */
export const MIN_PASSWORD = 6;

/** Tài khoản của câu lạc bộ: mã nhân viên người quản lý → mật khẩu (dữ liệu mẫu, mất khi tải lại app) */
const ACCOUNTS = new Map<string, string>([['NV01', DEMO_PASSWORD]]);

const normCode = (s: string) => s.trim().toUpperCase();

function checkAccess(staff: StaffMember) {
  if (!ALLOWED.includes(staff.role)) throw new Error('Chỉ người quản lý câu lạc bộ có tài khoản – nhân viên khác không đăng nhập.');
  if (staff.status !== 'active') throw new Error('Tài khoản đang nghỉ phép – liên hệ quản lý.');
}

/** Câu lạc bộ đã tự đăng ký (dữ liệu mẫu, mất khi tải lại app) */
const CLUBS: { staff: StaffMember; password: string; signup: ClubSignup }[] = [];

export async function login(identifier: string, password: string): Promise<StaffMember> {
  const id = identifier.trim();
  const digits = digitsOf(id);
  const samePhone = (phone: string) => digits.length >= 9 && digitsOf(phone) === digits;
  await mockDelay(null, 400);

  const club = CLUBS.find((c) => c.staff.code === normCode(id) || samePhone(c.staff.phone));
  if (club) {
    if (club.password !== password) throw new Error('Sai số điện thoại / mã nhân viên hoặc mật khẩu.');
    return club.staff;
  }

  const staff = STAFF.find((s) => s.code === normCode(id) || samePhone(s.phone));
  if (staff && !ACCOUNTS.has(staff.code)) {
    if (!ALLOWED.includes(staff.role)) checkAccess(staff);
    throw new Error('Số điện thoại này chưa có tài khoản – chọn “Đăng ký câu lạc bộ mới”.');
  }
  if (!staff || ACCOUNTS.get(staff.code) !== password) throw new Error('Sai số điện thoại / mã nhân viên hoặc mật khẩu.');
  checkAccess(staff);
  return staff;
}

/** Số điện thoại đã gắn với một tài khoản quản lý chưa */
const phoneTaken = (phone: string) =>
  CLUBS.some((c) => digitsOf(c.staff.phone) === digitsOf(phone)) ||
  STAFF.some((s) => ACCOUNTS.has(s.code) && digitsOf(s.phone) === digitsOf(phone));

/** Bước 1 của đăng ký: kiểm tra hồ sơ người đại diện – SĐT (dùng để đăng nhập) và CCCD chưa đăng ký câu lạc bộ khác */
export async function checkOwner(owner: ClubSignup['owner']): Promise<void> {
  await mockDelay(null, 400);
  const e = validateOwner(owner);
  if (hasErrors(e)) throw new Error(Object.values(e).find(Boolean));
  if (phoneTaken(owner.phone)) throw new Error('Số điện thoại này đã có tài khoản – hãy đăng nhập, hoặc dùng số khác.');
  if (CLUBS.some((c) => digitsOf(c.signup.owner.cccd) === digitsOf(owner.cccd))) {
    throw new Error('Số CCCD này đã đứng tên một câu lạc bộ khác – mỗi người đại diện đăng ký một câu lạc bộ.');
  }
}

/** Bước cuối: kiểm tra lại toàn bộ hồ sơ rồi tạo câu lạc bộ + tài khoản quản lý, đăng nhập luôn */
/** Chuẩn hoá mã nhân viên tiếp thị: bỏ khoảng trắng / gạch, viết hoa ("mkt-001" → "MKT001") */
export const normSalesCode = (s: string) => s.replace(/[\s-]/g, '').toUpperCase();

/** Xác minh mã nhân viên tiếp thị Arena đã hướng dẫn đăng ký – để ghi nhận doanh số cho đúng người */
export async function verifySalesCode(code: string): Promise<SalesRep> {
  const c = normSalesCode(code);
  await mockDelay(null, 400);
  if (!c) throw new Error('Nhập mã nhân viên Arena đã hướng dẫn bạn đăng ký.');
  const rep = SALES_REPS.find((r) => r.code === c);
  if (!rep) throw new Error(`Không tìm thấy mã nhân viên ${c} – kiểm tra lại với nhân viên tư vấn.`);
  if (!rep.active) throw new Error(`Mã ${c} đã ngừng hoạt động – liên hệ tổng đài Arena để được hỗ trợ.`);
  return rep;
}

export async function registerClub(signup: ClubSignup, password: string): Promise<StaffMember> {
  await verifySalesCode(signup.salesCode);
  await checkOwner(signup.owner);
  const ce = validateClub(signup.club);
  if (hasErrors(ce)) throw new Error(Object.values(ce).find(Boolean));
  if (password.length < MIN_PASSWORD) throw new Error(`Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự.`);

  // Chỉ giữ số sân của các môn sân đã chọn
  const courts = Object.fromEntries(signup.club.sports.filter(isCourtSport).map((sp) => [sp, signup.club.courts[sp] ?? 1]));
  const staff: StaffMember = {
    id: `club-${CLUBS.length + 1}`,
    code: `QL${String(CLUBS.length + 1).padStart(2, '0')}`,
    name: signup.owner.name.trim().replace(/\s+/g, ' '),
    phone: signup.owner.phone,
    role: 'manager',
    roleLabel: 'Quản lý · Người đại diện',
    status: 'active',
    week: [],
  };
  CLUBS.push({ staff, password, signup: { ...signup, salesCode: normSalesCode(signup.salesCode), club: { ...signup.club, courts } } });
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
