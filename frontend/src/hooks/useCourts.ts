import { useQuery } from '@tanstack/react-query';
import { getCourts, getTakenSlots } from '../api/courts.api';
import { qk } from './queryKeys';

export function useCourts() {
  return useQuery({ queryKey: qk.courts, queryFn: getCourts });
}

export function useTakenSlots(courtId: string | undefined, dayIndex: number) {
  return useQuery({
    queryKey: qk.takenSlots(courtId ?? '', dayIndex),
    queryFn: () => getTakenSlots(courtId as string, dayIndex),
    enabled: !!courtId,
  });
}
