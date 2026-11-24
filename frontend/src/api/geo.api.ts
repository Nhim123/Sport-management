// Gợi ý địa chỉ: tìm theo chữ (gõ tới đâu gợi ý tới đó) và tìm ngược từ toạ độ GPS.
// Dùng Photon (photon.komoot.io) – dữ liệu OpenStreetMap, miễn phí, không cần khoá API, chạy được cả web lẫn điện thoại.
// expo-location chỉ dùng để lấy toạ độ (reverseGeocodeAsync của nó không chạy trên web và không có tìm theo chữ).
// Muốn đổi nhà cung cấp (Goong, Google Places…): chỉ cần thay thân searchAddress / nearbyAddresses, giữ nguyên kiểu GeoPlace.
// Photon là dịch vụ dùng chung – gọi có debounce, giới hạn số kết quả; lưu lượng lớn thì nên tự dựng Photon hoặc dùng dịch vụ trả phí.

export interface LatLng {
  lat: number;
  lng: number;
}

/** Một gợi ý địa chỉ đã chuẩn hoá cho Việt Nam */
export interface GeoPlace extends LatLng {
  id: string;
  /** Dòng chính: số nhà + đường, hoặc tên địa điểm */
  title: string;
  /** Dòng phụ: phường/xã · tỉnh/thành */
  subtitle: string;
  /** Giá trị điền vào ô "Số nhà, tên đường" (kèm tên địa điểm nếu có) */
  street: string;
  /** Tên phường/xã theo bản đồ – có thể là tên cũ, cần đối chiếu danh mục 2 cấp (lib/vnAddress) */
  ward: string;
  /** Tên tỉnh/thành theo bản đồ – có thể là tỉnh cũ trước sáp nhập */
  province: string;
  /** Có số nhà chưa – chưa có thì nhắc người dùng thêm */
  hasHouseNumber: boolean;
}

const BASE = 'https://photon.komoot.io';
/** Khung toạ độ bao Việt Nam (minLon, minLat, maxLon, maxLat) */
const VN_BBOX = '102.1,8.4,109.5,23.4';
/** "default" = tên gốc trong OSM (tiếng Việt có dấu); không đặt thì Photon theo ngôn ngữ trình duyệt → có thể ra tiếng Anh */
const LANG = 'default';

type PhotonProps = {
  osm_type?: string;
  osm_id?: number;
  type?: string;
  name?: string;
  housenumber?: string;
  street?: string;
  locality?: string;
  district?: string;
  city?: string;
  county?: string;
  state?: string;
  countrycode?: string;
};
type PhotonFeature = { properties: PhotonProps; geometry: { coordinates: [number, number] } };

function toPlace(f: PhotonFeature): GeoPlace | null {
  const p = f.properties;
  if (p.countrycode && p.countrycode !== 'VN') return null;
  const [lng, lat] = f.geometry.coordinates;
  const street = p.street ?? (p.type === 'street' ? p.name : undefined);
  const road = p.housenumber && street ? `${p.housenumber} ${street}` : street;
  // Địa điểm có tên riêng (sân, trường, toà nhà…) thì tên lên trước, đường theo sau
  const isPoi = !!p.name && p.type !== 'street' && p.name !== street;
  const title = isPoi ? p.name! : road ?? p.name ?? '';
  const ward = p.district ?? p.locality ?? '';
  const province = p.city ?? p.state ?? p.county ?? '';
  if (!title) return null;
  const line = [isPoi ? p.name : null, road].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  return {
    id: `${p.osm_type ?? ''}${p.osm_id ?? `${lat},${lng}`}`,
    title,
    subtitle: [isPoi ? road : null, ward, province].filter(Boolean).join(' · '),
    street: line,
    ward,
    province,
    hasHouseNumber: !!p.housenumber,
    lat,
    lng,
  };
}

/** Bỏ trùng: OSM chia một con đường thành nhiều đoạn → cùng tiêu đề + dòng phụ chỉ giữ một */
function dedupe(list: (GeoPlace | null)[]): GeoPlace[] {
  const seen = new Set<string>();
  return list.filter((p): p is GeoPlace => {
    if (!p) return false;
    const key = `${p.title}|${p.subtitle}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function get(path: string, signal?: AbortSignal): Promise<GeoPlace[]> {
  const res = await fetch(`${BASE}${path}`, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Không lấy được gợi ý địa chỉ – thử lại sau.');
  const data = (await res.json()) as { features?: PhotonFeature[] };
  return dedupe((data.features ?? []).map(toPlace));
}

/** Gợi ý theo chữ đang gõ; có toạ độ thì ưu tiên kết quả gần đó */
export function searchAddress(query: string, near?: LatLng | null, signal?: AbortSignal): Promise<GeoPlace[]> {
  const q = new URLSearchParams({ q: query.trim(), limit: '8', bbox: VN_BBOX, lang: LANG });
  if (near) {
    q.set('lat', String(near.lat));
    q.set('lon', String(near.lng));
  }
  return get(`/api/?${q}`, signal).then((r) => r.slice(0, 5));
}

/** Các địa chỉ quanh một toạ độ (vị trí GPS hiện tại) */
export function nearbyAddresses(at: LatLng, signal?: AbortSignal): Promise<GeoPlace[]> {
  const q = new URLSearchParams({ lat: String(at.lat), lon: String(at.lng), limit: '8', radius: '0.3', lang: LANG });
  return get(`/reverse?${q}`, signal).then((r) => r.slice(0, 3));
}

/** Liên kết mở bản đồ (OpenStreetMap) có ghim tại toạ độ */
export const mapUrl = ({ lat, lng }: LatLng) =>
  `https://www.openstreetmap.org/?mlat=${lat.toFixed(6)}&mlon=${lng.toFixed(6)}#map=18/${lat.toFixed(6)}/${lng.toFixed(6)}`;
