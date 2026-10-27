// Tập trung query key để cache nhất quán giữa các hook.
export const qk = {
  courts: ['courts'] as const,
  takenSlots: (courtId: string, day: number) => ['courts', courtId, 'taken', day] as const,
  classesTonight: ['classes', 'tonight'] as const,
  me: ['members', 'me'] as const,
  mySchedule: ['members', 'me', 'schedule'] as const,
  payMethods: ['payments', 'methods'] as const,
};
