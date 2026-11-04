import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookWeekSlots, getCourtSetup, getCourts, getTakenSlots, getWeekTaken, type WeekSlot } from '../api/courts.api';
import { qk } from './queryKeys';

export function useCourts() {
  return useQuery({ queryKey: qk.courts, queryFn: getCourts });
}

/** Thiết lập của chủ sân: ngày mở cửa & các ca cố định */
export function useCourtSetup() {
  return useQuery({ queryKey: qk.courtSetup, queryFn: getCourtSetup });
}

export function useTakenSlots(courtId: string | undefined, dayIndex: number) {
  return useQuery({
    queryKey: qk.takenSlots(courtId ?? '', dayIndex),
    queryFn: () => getTakenSlots(courtId as string, dayIndex),
    enabled: !!courtId,
  });
}

/** Lịch kín cả tuần của một sân (0 = T2 … 6 = CN) */
export function useWeekTaken(courtId: string | undefined) {
  return useQuery({
    queryKey: qk.weekTaken(courtId ?? ''),
    queryFn: () => getWeekTaken(courtId as string),
    enabled: !!courtId,
  });
}

/** Khách đặt nhiều ca trong tuần cho một sân */
export function useBookWeekSlots() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courtId, customer, phone, slots }: { courtId: string; customer: string; phone: string; slots: WeekSlot[] }) => bookWeekSlots(courtId, customer, phone, slots),
    onSuccess: (_r, v) => qc.invalidateQueries({ queryKey: qk.weekTaken(v.courtId) }),
  });
}
