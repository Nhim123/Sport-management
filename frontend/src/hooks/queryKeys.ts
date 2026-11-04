// Tập trung query key để cache nhất quán giữa các hook.
export const qk = {
  courts: ['courts'] as const,
  courtSetup: ['courts', 'setup'] as const,
  takenSlots: (courtId: string, day: number) => ['courts', courtId, 'taken', day] as const,
  weekTaken: (courtId: string) => ['courts', courtId, 'week'] as const,
};
