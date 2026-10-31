// Thể thức giải đấu & luật trận theo môn – dùng chung cho màn tạo giải và chi tiết giải.
import type { Format, Tournament } from '../types/admin';
import type { Sport } from '../types/domain';

export interface FormatInfo {
  id: Format;
  label: string;
  hint: string;
  goodFor: string;
}

export const FORMATS: FormatInfo[] = [
  { id: 'knockout', label: 'Loại trực tiếp', hint: 'Thua một trận là bị loại. Nhanh, ít trận nhất.', goodFor: 'Giải đông người, ít ngày' },
  { id: 'double', label: 'Loại kép', hint: 'Thua 2 trận mới bị loại – có nhánh thắng và nhánh thua.', goodFor: 'Công bằng hơn loại trực tiếp' },
  { id: 'roundrobin', label: 'Vòng tròn', hint: 'Mọi đội gặp nhau, xếp hạng theo điểm.', goodFor: 'Giải nhỏ ≤ 8 đội, giải phong trào' },
  { id: 'groups', label: 'Vòng bảng + loại trực tiếp', hint: 'Đá vòng tròn trong bảng, đội đầu bảng vào loại trực tiếp.', goodFor: 'Giải 12–32 đội, như World Cup' },
  { id: 'swiss', label: 'Hệ Thụy Sĩ', hint: 'Mỗi vòng ghép đội cùng điểm, không loại ai. Số vòng cố định.', goodFor: 'Đông đội mà ai cũng được đá nhiều' },
];

export const formatLabel = (f: Format) => FORMATS.find((x) => x.id === f)?.label ?? f;

/** Luật trận theo môn: thời lượng dùng để tính sức chứa sân */
export const MATCH_RULES: Record<Sport, { label: string; minutes: number }[]> = {
  cl: [
    { label: '1 ván 21 điểm', minutes: 25 },
    { label: '2/3 ván 21 điểm', minutes: 45 },
    { label: '1 ván 31 điểm', minutes: 35 },
  ],
  pb: [
    { label: '1 ván 11 điểm', minutes: 20 },
    { label: '2/3 ván 11 điểm', minutes: 30 },
    { label: '1 ván 15 điểm', minutes: 25 },
  ],
  tn: [
    { label: '1 set (tie-break 6–6)', minutes: 60 },
    { label: 'Pro-set 8 ván', minutes: 75 },
    { label: '2/3 set, set 3 super tie-break', minutes: 90 },
  ],
  bd: [
    { label: '2 hiệp × 20 phút', minutes: 50 },
    { label: '2 hiệp × 25 phút', minutes: 60 },
    { label: '2 hiệp × 30 phút', minutes: 70 },
  ],
};
/** Luật mặc định của từng môn (chỉ số trong MATCH_RULES) */
export const DEFAULT_RULE: Record<Sport, number> = { cl: 1, pb: 1, tn: 2, bd: 0 };

export interface FormatOptions {
  thirdPlace: boolean;
  legs: 1 | 2;
  groups: number;
  advance: 1 | 2;
  swissRounds: number;
}

const log2 = (n: number) => Math.ceil(Math.log2(Math.max(2, n)));
export const defaultSwissRounds = (n: number) => log2(n);

function groupSizes(n: number, groups: number) {
  const base = Math.floor(n / groups);
  return Array.from({ length: groups }, (_, i) => base + (i < n % groups ? 1 : 0));
}

/** Số trận, số vòng và số trận tối thiểu mỗi đội của một thể thức */
export function formatStats(format: Format, n: number, o: FormatOptions) {
  switch (format) {
    case 'knockout':
      return { matches: n - 1 + (o.thirdPlace ? 1 : 0), rounds: log2(n), minGames: 1 };
    case 'double':
      return { matches: 2 * n - 1, rounds: 2 * log2(n), minGames: 2 };
    case 'roundrobin':
      return { matches: (o.legs * n * (n - 1)) / 2, rounds: o.legs * (n % 2 ? n : n - 1), minGames: o.legs * (n - 1) };
    case 'groups': {
      const sizes = groupSizes(n, o.groups);
      const ko = o.groups * o.advance;
      return {
        matches: sizes.reduce((s, g) => s + (g * (g - 1)) / 2, 0) + ko - 1 + (o.thirdPlace ? 1 : 0),
        rounds: Math.max(...sizes) - 1 + log2(ko),
        minGames: Math.min(...sizes) - 1,
      };
    }
    case 'swiss':
      return { matches: o.swissRounds * Math.floor(n / 2), rounds: o.swissRounds, minGames: o.swissRounds };
  }
}

/** Mô tả ngắn thể thức + tuỳ chọn, vd "Vòng bảng · 4 bảng, 2 đội đi tiếp · tranh hạng 3" */
export function formatSummary(t: Pick<Tournament, 'format' | 'groupCount' | 'thirdPlace' | 'legs' | 'advance' | 'swissRounds'>) {
  const parts = [formatLabel(t.format)];
  if (t.format === 'groups') parts.push(`${t.groupCount} bảng, ${t.advance ?? 2} đội/bảng đi tiếp`);
  if (t.format === 'roundrobin') parts.push(t.legs === 2 ? 'lượt đi – về' : '1 lượt');
  if (t.format === 'swiss') parts.push(`${t.swissRounds ?? 5} vòng`);
  if ((t.format === 'knockout' || t.format === 'groups') && t.thirdPlace) parts.push('tranh hạng 3');
  return parts.join(' · ');
}
