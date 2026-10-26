import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { newId, type Tournament, type TournamentDraft, type TournamentStatus } from '../lib/tournament';

/** Chưa có backend – lưu giải đấu trên trình duyệt, mặc định có 2 giải mẫu */
const KEY = 'arena-tournaments';

const names = (list: string[]) => list.map((name, i) => ({ id: 'e' + i, name }));

const SAMPLES: Tournament[] = [
  {
    id: 't-sample-1',
    name: 'Giải cầu lông Arena mở rộng 2026',
    sport: 'cl',
    entryType: 'double',
    format: 'knockout',
    maxEntrants: 16,
    groupCount: 4,
    advancePerGroup: 2,
    thirdPlace: true,
    seeds: 4,
    startDate: '2026-11-14',
    endDate: '2026-11-15',
    regDeadline: '2026-11-07',
    courtIds: ['cl1', 'cl2'],
    dailyFrom: 8,
    dailyTo: 20,
    matchMinutes: 45,
    fee: 300000,
    prize: 'Cúp + 10.000.000₫ cho nhà vô địch',
    description: 'Giải đôi nam mở rộng cho hội viên và khách vãng lai.',
    entrants: names([
      'Anh Tuấn / Minh Khôi',
      'Hoàng Nam / Thành Đạt',
      'CLB Phượng Hoàng A',
      'Quốc Bảo / Gia Huy',
      'Đức Long / Tấn Phát',
      'CLB Phượng Hoàng B',
      'Hải Nam / Khánh Linh',
      'Team Q7',
      'Văn Phòng FC',
      'Minh Anh / Thu Hà',
      'Ngọc Trâm / Bé Na',
    ]),
    status: 'open',
    createdAt: '2026-10-10',
  },
  {
    id: 't-sample-2',
    name: 'Pickleball Cup tháng 12',
    sport: 'pb',
    entryType: 'double',
    format: 'groups',
    maxEntrants: 12,
    groupCount: 4,
    advancePerGroup: 2,
    thirdPlace: false,
    seeds: 4,
    startDate: '2026-12-05',
    endDate: '2026-12-06',
    regDeadline: '2026-11-28',
    courtIds: ['pba', 'pbb'],
    dailyFrom: 7,
    dailyTo: 19,
    matchMinutes: 45,
    fee: 250000,
    prize: '[GIẢI THƯỞNG]',
    description: '',
    entrants: [],
    status: 'draft',
    createdAt: '2026-10-16',
  },
];

function load(): Tournament[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return SAMPLES;
    const v: unknown = JSON.parse(raw);
    if (Array.isArray(v) && v.every((t) => t && typeof t.id === 'string' && typeof t.name === 'string' && Array.isArray(t.entrants))) {
      return v as Tournament[];
    }
  } catch {
    /* dữ liệu hỏng – dùng mẫu */
  }
  return SAMPLES;
}

interface TournamentStore {
  tournaments: Tournament[];
  createTournament: (d: TournamentDraft, status: TournamentStatus) => Tournament;
  updateTournament: (id: string, patch: Partial<Omit<Tournament, 'id'>>) => void;
  removeTournament: (id: string) => void;
}

const Ctx = createContext<TournamentStore | null>(null);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [tournaments, setTournaments] = useState<Tournament[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(tournaments));
    } catch {
      /* không lưu được – vẫn dùng được trong lần mở này */
    }
  }, [tournaments]);

  const createTournament = useCallback((d: TournamentDraft, status: TournamentStatus) => {
    const t: Tournament = { ...d, id: newId('t-'), status, createdAt: new Date().toISOString().slice(0, 10) };
    setTournaments((prev) => [t, ...prev]);
    return t;
  }, []);

  const updateTournament = useCallback((id: string, patch: Partial<Omit<Tournament, 'id'>>) => {
    setTournaments((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const removeTournament = useCallback((id: string) => {
    setTournaments((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({ tournaments, createTournament, updateTournament, removeTournament }),
    [tournaments, createTournament, updateTournament, removeTournament],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTournaments(): TournamentStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTournaments must be used inside <TournamentProvider>');
  return v;
}
