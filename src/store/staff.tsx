import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ROLES, type Shift, type Staff } from '../lib/staff';
import { newId } from '../lib/tournament';

/** Chưa có backend – danh sách nhân viên lưu trên trình duyệt; số liệu tháng là dữ liệu mẫu */
const KEY = 'arena-staff';

const W = (s: string): Shift[] => s.split(' ').map((x) => (x === '-' ? 'off' : (x as Shift)));

const S = (o: Omit<Staff, 'perms' | 'ptRate' | 'commission' | 'hourlyRate' | 'baseSalary'> & Partial<Staff>): Staff => ({
  perms: ROLES[o.role].perms,
  baseSalary: 0,
  hourlyRate: 0,
  ptRate: 0,
  commission: 0,
  ...o,
});

const SEEDS: Staff[] = [
  S({ id: 's01', code: 'NV01', name: 'Phạm Quang Huy', phone: '0908 111 222', email: 'huy.pham@arena.vn', role: 'manager', type: 'full', status: 'active', startDate: '2023-02-01', baseSalary: 18000000, commission: 0.01, week: W('S S C S C - T'), stats: { monthShifts: 22, salesRevenue: 42000000 } }),
  S({ id: 's02', code: 'NV02', name: 'Trần Ngọc Linh', phone: '0912 778 901', email: 'linh.tran@arena.vn', role: 'reception', type: 'full', status: 'active', startDate: '2024-06-15', baseSalary: 7500000, commission: 0.02, week: W('T T - T T T T'), stats: { monthShifts: 21, checkins: 3120, bookings: 186, salesRevenue: 38400000 } }),
  S({ id: 's03', code: 'NV03', name: 'Lê Hồng Nhung', phone: '0935 402 118', role: 'reception', type: 'full', status: 'active', startDate: '2025-01-06', baseSalary: 7500000, commission: 0.02, week: W('S S S - S S S'), stats: { monthShifts: 20, checkins: 2480, bookings: 141, salesRevenue: 25200000 } }),
  S({ id: 's04', code: 'NV04', name: 'Võ Minh Tú', phone: '0976 230 554', role: 'reception', type: 'part', status: 'active', startDate: '2026-05-20', hourlyRate: 30000, commission: 0.02, week: W('C C C C - C C'), stats: { monthShifts: 14, checkins: 1210, bookings: 64, salesRevenue: 6600000 } }),
  S({ id: 's05', code: 'NV05', name: 'Đặng Minh Khoa', phone: '0903 665 410', role: 'pt', type: 'full', status: 'active', startDate: '2024-03-01', baseSalary: 9000000, ptRate: 150000, commission: 0.05, week: W('S S - S S T T'), stats: { monthShifts: 19, ptSessions: 64, clients: 14, salesRevenue: 19200000 } }),
  S({ id: 's06', code: 'NV06', name: 'Nguyễn Thanh Mai', phone: '0918 304 770', role: 'coach', type: 'full', status: 'active', startDate: '2023-09-10', baseSalary: 8000000, ptRate: 120000, week: W('S T S T S - S'), stats: { monthShifts: 20, classes: 26, ptSessions: 6, clients: 48 } }),
  S({ id: 's07', code: 'NV07', name: 'Phan Thu Thảo', phone: '0387 220 913', role: 'coach', type: 'part', status: 'active', startDate: '2025-08-01', hourlyRate: 120000, week: W('- T - T - T T'), stats: { monthShifts: 13, classes: 13, clients: 31 } }),
  S({ id: 's08', code: 'NV08', name: 'Trần Quốc Dũng', phone: '0909 812 336', role: 'coach', type: 'full', status: 'active', startDate: '2024-11-04', baseSalary: 10000000, ptRate: 200000, commission: 0.05, week: W('C C C - C C C'), stats: { monthShifts: 20, classes: 18, ptSessions: 22, clients: 26, salesRevenue: 8800000 } }),
  S({ id: 's09', code: 'NV09', name: 'Lý Văn Sơn', phone: '0962 145 008', role: 'tech', type: 'full', status: 'active', startDate: '2024-01-15', baseSalary: 8500000, week: W('C C C C C - -'), stats: { monthShifts: 18, tickets: 23 } }),
  S({ id: 's10', code: 'NV10', name: 'Bùi Thị Hoa', phone: '0399 551 274', role: 'cleaner', type: 'full', status: 'leave', startDate: '2023-05-02', baseSalary: 6000000, week: W('S S S P P P P'), note: 'Nghỉ phép 15/10 – 20/10', stats: { monthShifts: 12 } }),
];

function load(): Staff[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return SEEDS;
    const v: unknown = JSON.parse(raw);
    if (Array.isArray(v) && v.length && v.every((s) => s && typeof s.id === 'string' && Array.isArray(s.week) && s.week.length === 7)) {
      return v as Staff[];
    }
  } catch {
    /* dữ liệu hỏng – dùng mẫu */
  }
  return SEEDS;
}

interface StaffStore {
  staff: Staff[];
  addStaff: (s: Omit<Staff, 'id' | 'code'>) => Staff;
  updateStaff: (id: string, patch: Partial<Omit<Staff, 'id' | 'code'>>) => void;
  setShift: (id: string, day: number, shift: Shift) => void;
}

const Ctx = createContext<StaffStore | null>(null);

export function StaffProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<Staff[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(staff));
    } catch {
      /* không lưu được – vẫn dùng được trong lần mở này */
    }
  }, [staff]);

  const addStaff = useCallback(
    (s: Omit<Staff, 'id' | 'code'>) => {
      const next = Math.max(0, ...staff.map((x) => Number(x.code.replace(/\D/g, '')) || 0)) + 1;
      const created: Staff = { ...s, id: newId('s-'), code: 'NV' + String(next).padStart(2, '0') };
      setStaff((prev) => [...prev, created]);
      return created;
    },
    [staff],
  );

  const updateStaff = useCallback((id: string, patch: Partial<Omit<Staff, 'id' | 'code'>>) => {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const setShift = useCallback((id: string, day: number, shift: Shift) => {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, week: s.week.map((x, i) => (i === day ? shift : x)) } : s)));
  }, []);

  const value = useMemo(() => ({ staff, addStaff, updateStaff, setShift }), [staff, addStaff, updateStaff, setShift]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStaff(): StaffStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStaff must be used inside <StaffProvider>');
  return v;
}
