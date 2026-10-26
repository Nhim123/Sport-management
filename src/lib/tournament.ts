// Giải đấu: kiểu dữ liệu, tính số trận / sức chứa sân và sinh sơ đồ nhánh.
import type { Sport } from '../data/mock';
import { hh } from './format';

export type Format = 'knockout' | 'roundrobin' | 'groups';
export type EntryType = 'single' | 'double' | 'team';
export type TournamentStatus = 'draft' | 'open';

export interface Entrant {
  id: string;
  name: string;
}

export interface Tournament {
  id: string;
  name: string;
  sport: Sport;
  entryType: EntryType;
  format: Format;
  maxEntrants: number;
  /** Chỉ dùng với vòng bảng */
  groupCount: number;
  advancePerGroup: number;
  thirdPlace: boolean;
  /** Số hạt giống – là những người đứng đầu danh sách entrants */
  seeds: number;
  startDate: string; // yyyy-mm-dd
  endDate: string;
  regDeadline: string;
  courtIds: string[];
  dailyFrom: number;
  dailyTo: number;
  matchMinutes: number;
  fee: number;
  prize: string;
  description: string;
  entrants: Entrant[];
  status: TournamentStatus;
  createdAt: string;
}

export type TournamentDraft = Omit<Tournament, 'id' | 'status' | 'createdAt'>;

/** "Hôm nay" của dữ liệu mẫu */
export const TODAY_ISO = '2026-10-18';

export const FORMATS: { id: Format; label: string; desc: string }[] = [
  { id: 'knockout', label: 'Loại trực tiếp', desc: 'Thua một trận là dừng. Ít trận, hợp giải đông người.' },
  { id: 'roundrobin', label: 'Vòng tròn', desc: 'Mọi người gặp nhau một lần, xếp hạng theo điểm. Hợp giải ít người.' },
  { id: 'groups', label: 'Vòng bảng + loại trực tiếp', desc: 'Chia bảng đấu vòng tròn, người đứng đầu mỗi bảng vào nhánh loại trực tiếp.' },
];
export const formatLabel = (f: Format) => FORMATS.find((x) => x.id === f)!.label;

export const ENTRY_LABEL: Record<EntryType, string> = { single: 'Đơn', double: 'Đôi', team: 'Đồng đội' };
const TEAM_SPORTS: Sport[] = ['bd', 'br', 'bc'];
export const entryOptions = (s: Sport): EntryType[] => (TEAM_SPORTS.includes(s) ? ['team'] : ['single', 'double']);
/** Danh từ cho một suất tham gia */
export const entrantNoun = (e: EntryType) => (e === 'single' ? 'VĐV' : e === 'double' ? 'cặp' : 'đội');
export const defaultMatchMinutes = (s: Sport) => (s === 'tn' ? 90 : s === 'bd' || s === 'br' ? 60 : 45);

// ---------- Ngày ----------
const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const toDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export function fmtDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '—';
  const dt = toDate(iso);
  return `${DOW[dt.getDay()]} ${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}
export function daysInclusive(a: string, b: string): number {
  if (!a || !b) return 0;
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / 864e5) + 1;
}
export function fmtRange(t: Pick<Tournament, 'startDate' | 'endDate'>): string {
  return t.startDate === t.endDate ? fmtDate(t.startDate) : `${fmtDate(t.startDate)} – ${fmtDate(t.endDate)}`;
}
export const fmtHours = (from: number, to: number) => `${hh(from)}–${to === 24 ? '24:00' : hh(to)}`;

// ---------- Số trận ----------
export function groupSizes(n: number, g: number): number[] {
  const base = Math.floor(n / g);
  const extra = n % g;
  return Array.from({ length: g }, (_, i) => base + (i < extra ? 1 : 0));
}

type Shape = Pick<Tournament, 'format' | 'maxEntrants' | 'groupCount' | 'advancePerGroup' | 'thirdPlace'>;

export function qualifiers(t: Shape): number {
  return t.format === 'groups' ? t.groupCount * t.advancePerGroup : t.maxEntrants;
}

export function matchCount(t: Shape): number {
  const n = t.maxEntrants;
  if (n < 2) return 0;
  if (t.format === 'roundrobin') return (n * (n - 1)) / 2;
  const ko = (q: number) => (q >= 2 ? q - 1 + (t.thirdPlace && q >= 4 ? 1 : 0) : 0);
  if (t.format === 'knockout') return ko(n);
  const groupMatches = groupSizes(n, t.groupCount).reduce((s, k) => s + (k * (k - 1)) / 2, 0);
  return groupMatches + ko(qualifiers(t));
}

/** Số vòng của nhánh loại trực tiếp (0 nếu không có) */
export function knockoutRoundCount(t: Shape): number {
  if (t.format === 'roundrobin') return 0;
  const q = qualifiers(t);
  return q >= 2 ? Math.ceil(Math.log2(q)) : 0;
}

export function capacity(t: Pick<Tournament, 'courtIds' | 'dailyFrom' | 'dailyTo' | 'matchMinutes' | 'startDate' | 'endDate'>) {
  const perCourt = Math.floor(((t.dailyTo - t.dailyFrom) * 60) / t.matchMinutes);
  const perDay = t.courtIds.length * Math.max(0, perCourt);
  const days = Math.max(0, daysInclusive(t.startDate, t.endDate));
  return { perCourt, perDay, days, total: perDay * days };
}

// ---------- Sơ đồ ----------
export interface Slot {
  label: string;
  seed?: number;
  bye?: boolean;
  /** Suất chưa có người đăng ký / người thắng trận trước */
  pending?: boolean;
}
export interface BracketMatch {
  no?: number;
  a: Slot;
  b: Slot;
}
export interface BracketRound {
  name: string;
  matches: BracketMatch[];
}

export function roundName(fromEnd: number): string {
  if (fromEnd === 1) return 'Chung kết';
  if (fromEnd === 2) return 'Bán kết';
  if (fromEnd === 3) return 'Tứ kết';
  return `Vòng 1/${2 ** (fromEnd - 1)}`;
}

/** Thứ tự hạt giống chuẩn: 8 → [1,8,4,5,2,7,3,6] để hạt giống 1 và 2 chỉ gặp nhau ở chung kết */
export function seedOrder(size: number): number[] {
  let o = [1];
  while (o.length < size) {
    const m = o.length * 2;
    o = o.flatMap((x) => [x, m + 1 - x]);
  }
  return o;
}

/** slots theo thứ tự hạt giống (slots[0] là hạt giống 1) */
export function knockoutRounds(slots: Slot[], startNo = 1): BracketRound[] {
  const n = slots.length;
  if (n < 2) return [];
  const size = 2 ** Math.ceil(Math.log2(n));
  const order = seedOrder(size);
  const at = (seed: number): Slot => (seed <= n ? slots[seed - 1] : { label: 'Miễn đấu', bye: true });
  let no = startNo - 1;
  const total = Math.log2(size);

  const first: BracketMatch[] = [];
  for (let i = 0; i < size; i += 2) {
    const a = at(order[i]);
    const b = at(order[i + 1]);
    first.push({ a, b, no: a.bye || b.bye ? undefined : ++no });
  }
  const rounds: BracketRound[] = [{ name: roundName(total), matches: first }];
  let winners: Slot[] = first.map((m) => (m.a.bye ? m.b : m.b.bye ? m.a : { label: `Thắng trận ${m.no}`, pending: true }));

  while (winners.length > 1) {
    const ms: BracketMatch[] = [];
    for (let i = 0; i < winners.length; i += 2) ms.push({ a: winners[i], b: winners[i + 1], no: ++no });
    rounds.push({ name: roundName(Math.log2(ms.length) + 1), matches: ms });
    winners = ms.map((m) => ({ label: `Thắng trận ${m.no}`, pending: true }));
  }
  return rounds;
}

/** Suất tham gia đủ maxEntrants: người đã đăng ký trước, phần còn lại là "Suất k" chờ đăng ký */
export function entrantSlots(t: Pick<Tournament, 'entrants' | 'maxEntrants' | 'seeds'>): Slot[] {
  return Array.from({ length: t.maxEntrants }, (_, i) => {
    const e = t.entrants[i];
    return {
      label: e ? e.name : `Suất ${i + 1}`,
      pending: !e,
      seed: e && i < t.seeds ? i + 1 : undefined,
    };
  });
}

const GROUP_NAMES = 'ABCDEFGHIJKLMNOP';
const PLACE = ['Nhất', 'Nhì', 'Ba', 'Tư'];

/** Chia bảng kiểu rắn (snake) để hạt giống trải đều các bảng */
export function groupsOf(slots: Slot[], g: number): { name: string; slots: Slot[] }[] {
  const groups = Array.from({ length: g }, (_, i) => ({ name: `Bảng ${GROUP_NAMES[i]}`, slots: [] as Slot[] }));
  slots.forEach((s, i) => {
    const row = Math.floor(i / g);
    const col = row % 2 === 0 ? i % g : g - 1 - (i % g);
    groups[col].slots.push(s);
  });
  return groups;
}

/** Người đi tiếp từ vòng bảng, xếp theo thứ tự hạt giống: Nhất A, Nhất B, …, Nhì A, Nhì B… */
export function qualifierSlots(t: Pick<Tournament, 'groupCount' | 'advancePerGroup'>): Slot[] {
  const out: Slot[] = [];
  for (let p = 0; p < t.advancePerGroup; p++) {
    for (let g = 0; g < t.groupCount; g++) out.push({ label: `${PLACE[p]} ${GROUP_NAMES[g]}`, pending: true });
  }
  return out;
}

export const newId = (prefix: string) => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
