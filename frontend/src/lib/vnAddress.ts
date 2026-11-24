// Đơn vị hành chính Việt Nam theo mô hình 2 cấp (từ 01/07/2025): Tỉnh / Thành phố → Phường / Xã / Đặc khu.
// Dữ liệu: 34 tỉnh/thành, 3.321 phường/xã – lấy từ provinces.open-api.vn (API v2), gói sẵn trong app để chạy không cần mạng.
// Cập nhật: tải lại https://provinces.open-api.vn/api/v2/?depth=2 rồi ghi đè src/data/vn-units.json (dạng [mã, tên, [[mã, tên], …]]).
import RAW from '../data/vn-units.json';

export interface Ward {
  code: number;
  name: string; // "Phường Bến Thành"
}
export interface Province {
  code: number;
  name: string; // "Thành phố Hồ Chí Minh"
  wards: Ward[];
}

/** Bỏ dấu, viết thường – để tìm "ben thanh" vẫn ra "Bến Thành" */
export const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** Tên rút gọn: bỏ "Tỉnh / Thành phố / Phường / Xã / Đặc khu" ở đầu */
export const shortName = (name: string) => name.replace(/^(Tỉnh|Thành phố|TP\.?|Phường|Xã|Đặc khu)\s+/i, '');
const key = (name: string) => fold(shortName(name)).replace(/-/g, ' ').replace(/\s+/g, ' ');

const byVi = (a: { name: string }, b: { name: string }) => shortName(a.name).localeCompare(shortName(b.name), 'vi');

export const PROVINCES: Province[] = (RAW as [number, string, [number, string][]][])
  .map(([code, name, wards]) => ({ code, name, wards: wards.map(([c, n]) => ({ code: c, name: n })).sort(byVi) }))
  .sort(byVi);

export const provinceByCode = (code?: number) => PROVINCES.find((p) => p.code === code);

/**
 * Tỉnh cũ (trước sáp nhập 2025) → tỉnh mới. Dữ liệu bản đồ / GPS có nơi vẫn ghi tên tỉnh cũ,
 * nên cần đổi sang tỉnh mới khi tự điền từ gợi ý.
 */
const MERGED: Record<string, string[]> = {
  'Tuyên Quang': ['Hà Giang'],
  'Lào Cai': ['Yên Bái'],
  'Thái Nguyên': ['Bắc Kạn'],
  'Phú Thọ': ['Vĩnh Phúc', 'Hòa Bình'],
  'Bắc Ninh': ['Bắc Giang'],
  'Hưng Yên': ['Thái Bình'],
  'Hải Phòng': ['Hải Dương'],
  'Ninh Bình': ['Hà Nam', 'Nam Định'],
  'Quảng Trị': ['Quảng Bình'],
  'Đà Nẵng': ['Quảng Nam'],
  'Quảng Ngãi': ['Kon Tum'],
  'Gia Lai': ['Bình Định'],
  'Khánh Hòa': ['Ninh Thuận'],
  'Lâm Đồng': ['Đắk Nông', 'Bình Thuận'],
  'Đắk Lắk': ['Phú Yên'],
  'Hồ Chí Minh': ['Bình Dương', 'Bà Rịa - Vũng Tàu', 'Vũng Tàu', 'Sài Gòn'],
  'Đồng Nai': ['Bình Phước'],
  'Tây Ninh': ['Long An'],
  'Cần Thơ': ['Sóc Trăng', 'Hậu Giang'],
  'Vĩnh Long': ['Bến Tre', 'Trà Vinh'],
  'Đồng Tháp': ['Tiền Giang'],
  'Cà Mau': ['Bạc Liêu'],
  'An Giang': ['Kiên Giang'],
  Huế: ['Thừa Thiên Huế', 'Thừa Thiên - Huế'],
};
const ALIAS = new Map<string, string>();
for (const [now, olds] of Object.entries(MERGED)) for (const o of olds) ALIAS.set(key(o), key(now));

/** Tìm tỉnh mới từ một tên tỉnh bất kỳ (mới hoặc cũ, có/không dấu, có/không "Tỉnh"/"Thành phố") */
export function matchProvince(name?: string): Province | undefined {
  if (!name) return undefined;
  const k = key(name).replace(/ city$/, '');
  const target = ALIAS.get(k) ?? k;
  return PROVINCES.find((p) => key(p.name) === target);
}

/** Tìm phường/xã trong một tỉnh theo tên – chỉ nhận khi khớp hẳn, tránh chọn nhầm */
export function matchWard(p: Province | undefined, name?: string): Ward | undefined {
  if (!p || !name) return undefined;
  const k = key(name);
  return p.wards.find((w) => key(w.name) === k);
}

/** Lọc danh sách theo chữ gõ (không dấu): khớp đầu từ lên trước, chứa chuỗi theo sau */
export function filterUnits<U extends { name: string }>(list: U[], q: string): U[] {
  const f = fold(q);
  if (!f) return list;
  const starts: U[] = [];
  const contains: U[] = [];
  for (const u of list) {
    const k = key(u.name);
    if (k.startsWith(f) || k.includes(` ${f}`)) starts.push(u);
    else if (fold(u.name).includes(f)) contains.push(u);
  }
  return [...starts, ...contains];
}

/** Địa chỉ đầy đủ theo thứ tự Việt Nam: số nhà đường, phường/xã, tỉnh/thành */
export const fullAddress = (a: { address: string; ward: string; province: string }) =>
  [a.address.trim(), a.ward, a.province].filter(Boolean).join(', ');
