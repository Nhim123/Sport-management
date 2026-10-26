import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { newId } from '../lib/tournament';
import { templateOf, type Plan, type PlanStats, type TemplateId } from '../lib/plans';

/** Chưa có backend – danh mục gói lưu trên trình duyệt; số liệu thống kê của gói mẫu là dữ liệu mẫu */
const KEY = 'arena-plans';

const P = (
  id: string,
  templateId: TemplateId,
  name: string,
  price: number,
  over: Partial<Plan>,
  stats: PlanStats,
): Plan => ({ ...templateOf(templateId).defaults, id, name, price, status: 'active', createdAt: '2025-01-01', stats, ...over });

const SEEDS: Plan[] = [
  P('p-gym-1', 'gym', 'Gym 1 tháng', 650000, { months: 1, freezeDays: 0 }, { sales: [38, 42, 51, 47, 40, 44], active: 52, renewal: 0.41, checkins: 2.6, expiring: 18 }),
  P('p-gym-6', 'gym', 'Gym 6 tháng', 3600000, { months: 6 }, { sales: [14, 12, 16, 15, 13, 17], active: 96, renewal: 0.62, checkins: 3.1, expiring: 9 }),
  P('p-gym-12', 'gym', 'Gym 12 tháng', 6600000, { months: 12, freezeDays: 60 }, { sales: [9, 8, 11, 10, 12, 14], active: 188, renewal: 0.74, checkins: 3.4, expiring: 6 }),
  P('p-yoga-3', 'group', 'Yoga 3 tháng', 2400000, { months: 3 }, { sales: [11, 13, 15, 12, 10, 12], active: 64, renewal: 0.58, checkins: 2.2, expiring: 7 }),
  P('p-pt-12', 'pt', 'PT 12 buổi', 5400000, { months: 3, ptSessions: 12 }, { sales: [6, 7, 5, 8, 9, 7], active: 21, renewal: 0.49, checkins: 1.9, expiring: 4 }),
  P('p-pt-24', 'pt', 'PT 24 buổi', 9600000, { months: 6, ptSessions: 24 }, { sales: [3, 4, 4, 5, 4, 6], active: 17, renewal: 0.66, checkins: 2.1, expiring: 2 }),
  P('p-combo-6', 'combo', 'Gym + Bơi 6 tháng', 5400000, { months: 6 }, { sales: [5, 6, 9, 10, 6, 7], active: 35, renewal: 0.55, checkins: 3.0, expiring: 3 }),
  P('p-offpeak-3', 'offpeak', 'Gym giờ thấp điểm 3 tháng', 1350000, { months: 3 }, { sales: [7, 9, 8, 6, 8, 10], active: 29, renewal: 0.47, checkins: 2.8, expiring: 5 }),
  P(
    'p-custom-ma',
    'gym',
    'Gym 12 tháng + PT 24 buổi (riêng)',
    16200000,
    {
      months: 12,
      ptSessions: 24,
      extras: ['locker'],
      freezeDays: 60,
      createdAt: '2026-03-05',
      custom: { customer: 'Nguyễn Minh Anh', memberCode: 'AR-00421', phone: '0912 345 678', note: 'Ưu tiên PT thân dưới; tặng tủ đồ riêng.' },
    },
    { sales: [0, 0, 0, 0, 0, 0], active: 1, renewal: null, checkins: 4.3, expiring: 0 },
  ),
];

function load(): Plan[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return SEEDS;
    const v: unknown = JSON.parse(raw);
    if (Array.isArray(v) && v.length && v.every((p) => p && typeof p.id === 'string' && typeof p.price === 'number' && Array.isArray(p.access))) {
      return v as Plan[];
    }
  } catch {
    /* dữ liệu hỏng – dùng mẫu */
  }
  return SEEDS;
}

interface PlanStore {
  plans: Plan[];
  addPlan: (p: Omit<Plan, 'id' | 'createdAt'>) => Plan;
  updatePlan: (id: string, patch: Partial<Omit<Plan, 'id'>>) => void;
}

const Ctx = createContext<PlanStore | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plans, setPlans] = useState<Plan[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(plans));
    } catch {
      /* không lưu được – vẫn dùng được trong lần mở này */
    }
  }, [plans]);

  const addPlan = useCallback((p: Omit<Plan, 'id' | 'createdAt'>) => {
    const created: Plan = { ...p, id: newId('p-'), createdAt: new Date().toISOString().slice(0, 10) };
    setPlans((prev) => [...prev, created]);
    return created;
  }, []);

  const updatePlan = useCallback((id: string, patch: Partial<Omit<Plan, 'id'>>) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const value = useMemo(() => ({ plans, addPlan, updatePlan }), [plans, addPlan, updatePlan]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlans(): PlanStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePlans must be used inside <PlanProvider>');
  return v;
}
