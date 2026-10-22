import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { COURTS, SPORTS, type Booking, type Court } from '../data/mock';

/**
 * Danh sách sân có thể tùy chỉnh (thêm / sửa / xoá / sắp xếp / ẩn / tạm ngừng).
 * Chưa có backend nên lưu trên trình duyệt; mặc định là 6 sân trong mock.ts.
 */
const KEY = 'arena-courts';
const SPORT_IDS = new Set<string>(SPORTS.map((s) => s.id));

function isCourt(x: unknown): x is Court {
  const c = x as Court;
  return (
    !!c &&
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    typeof c.kind === 'string' &&
    typeof c.price === 'number' &&
    SPORT_IDS.has(c.sport)
  );
}

function load(): Court[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return COURTS;
    const v: unknown = JSON.parse(raw);
    if (Array.isArray(v) && v.length && v.every(isCourt)) return v.map((c) => ({ ...c, mobileKind: c.mobileKind ?? c.kind }));
  } catch {
    /* dữ liệu hỏng hoặc không đọc được – dùng mặc định */
  }
  return COURTS;
}

interface CourtsStore {
  /** Toàn bộ sân theo thứ tự tùy chỉnh (kể cả sân đang ẩn) */
  courts: Court[];
  /** Sân hiện trên lịch / trạng thái sân */
  visible: Court[];
  isCustomized: boolean;
  addCourt: (c: Omit<Court, 'id'>) => Court;
  updateCourt: (id: string, patch: Partial<Omit<Court, 'id'>>) => void;
  removeCourt: (id: string) => void;
  moveCourt: (id: string, dir: -1 | 1) => void;
  resetCourts: () => void;
}

const Ctx = createContext<CourtsStore | null>(null);

export function CourtsProvider({ children }: { children: ReactNode }) {
  const [courts, setCourts] = useState<Court[]>(load);
  const isCustomized = useMemo(() => JSON.stringify(courts) !== JSON.stringify(COURTS), [courts]);

  useEffect(() => {
    try {
      if (isCustomized) localStorage.setItem(KEY, JSON.stringify(courts));
      else localStorage.removeItem(KEY);
    } catch {
      /* không lưu được – thay đổi vẫn dùng được trong lần mở này */
    }
  }, [courts, isCustomized]);

  const addCourt = useCallback((c: Omit<Court, 'id'>) => {
    const created: Court = { ...c, id: 'c-' + Date.now().toString(36) };
    setCourts((prev) => [...prev, created]);
    return created;
  }, []);

  const updateCourt = useCallback((id: string, patch: Partial<Omit<Court, 'id'>>) => {
    setCourts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const removeCourt = useCallback((id: string) => {
    setCourts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const moveCourt = useCallback((id: string, dir: -1 | 1) => {
    setCourts((prev) => {
      const i = prev.findIndex((c) => c.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, []);

  const resetCourts = useCallback(() => setCourts(COURTS), []);

  const value = useMemo(
    () => ({
      courts,
      visible: courts.filter((c) => !c.hidden),
      isCustomized,
      addCourt,
      updateCourt,
      removeCourt,
      moveCourt,
      resetCourts,
    }),
    [courts, isCustomized, addCourt, updateCourt, removeCourt, moveCourt, resetCourts],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCourts(): CourtsStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCourts must be used inside <CourtsProvider>');
  return v;
}

/** Lượt khóa ảo phủ cả ngày cho sân đang tạm ngừng – để lịch & trạng thái sân hiển thị như ô bảo trì */
export function lockBookings(courts: Court[]): Booking[] {
  return courts
    .filter((c) => c.locked)
    .map((c) => ({ id: 'lock-' + c.id, courtId: c.id, start: 0, span: 24, state: 'blocked', label: 'Tạm ngừng', sub: 'Bảo trì dài ngày' }));
}

export const isLockId = (bookingId: string) => bookingId.startsWith('lock-');

/** Các môn đang có sân trong danh sách (giữ thứ tự của SPORTS) */
export function sportsIn(courts: Court[]) {
  return SPORTS.filter((s) => courts.some((c) => c.sport === s.id));
}
