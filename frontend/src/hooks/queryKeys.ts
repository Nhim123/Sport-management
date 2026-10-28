// Tập trung query key để cache nhất quán giữa các hook.
export const qk = {
  courts: ['courts'] as const,
  takenSlots: (courtId: string, day: number) => ['courts', courtId, 'taken', day] as const,
};
