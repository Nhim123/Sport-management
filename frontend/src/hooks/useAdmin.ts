// Hook cho chế độ quản lý – mọi màn quản lý lấy dữ liệu qua đây.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/admin.api';
import type { AdminBooking, Tournament } from '../types/admin';

export const ak = {
  all: ['admin'] as const,
  dashboard: ['admin', 'dashboard'] as const,
  bookings: ['admin', 'bookings'] as const,
  members: ['admin', 'members'] as const,
  member: (code: string) => ['admin', 'members', code] as const,
  tournaments: ['admin', 'tournaments'] as const,
  tournament: (id: string) => ['admin', 'tournaments', id] as const,
  plans: ['admin', 'plans'] as const,
  staff: ['admin', 'staff'] as const,
  report: ['admin', 'report'] as const,
  scanLog: ['admin', 'scanLog'] as const,
};

export const useDashboard = () => useQuery({ queryKey: ak.dashboard, queryFn: api.getDashboard });
export const useDayBookings = () => useQuery({ queryKey: ak.bookings, queryFn: api.getDayBookings });
export const useMembers = () => useQuery({ queryKey: ak.members, queryFn: api.getMembers });
export const useMember = (code: string) => useQuery({ queryKey: ak.member(code), queryFn: () => api.getMember(code), enabled: !!code });
export const useTournaments = () => useQuery({ queryKey: ak.tournaments, queryFn: api.getTournaments });
export const useTournament = (id: string) => useQuery({ queryKey: ak.tournament(id), queryFn: () => api.getTournament(id), enabled: !!id });
export const usePlans = () => useQuery({ queryKey: ak.plans, queryFn: api.getPlans });
export const useStaff = () => useQuery({ queryKey: ak.staff, queryFn: api.getStaff });
export const useMonthReport = () => useQuery({ queryKey: ak.report, queryFn: api.getMonthReport });

export function useCreateDayBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: Omit<AdminBooking, 'id'>) => api.createDayBooking(b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ak.bookings }),
  });
}

export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<AdminBooking, 'id'>> }) => api.updateBooking(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ak.bookings }),
  });
}

export function useRemoveBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.removeBooking(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ak.bookings }),
  });
}

export function useCheckInMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.checkInMember(code),
    onSuccess: () => qc.invalidateQueries({ queryKey: ak.members }),
  });
}

export function useRenewMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, planIndex, method }: { code: string; planIndex: number; method: string }) => api.renewMember(code, planIndex, method),
    onSuccess: () => qc.invalidateQueries({ queryKey: ak.members }),
  });
}

export function useSetTournamentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Tournament['status'] }) => api.setTournamentStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ak.tournaments }),
  });
}

// ---------- Quét QR check-in ----------
export const useScanLog = () => useQuery({ queryKey: ak.scanLog, queryFn: api.getScanLog });

/** Đọc & kiểm tra mã – là thao tác, không lưu cache */
export const useResolveQr = () => useMutation({ mutationFn: (raw: string) => api.resolveQr(raw) });

export function useConfirmCourtEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, collected }: { id: string; collected?: boolean }) => api.confirmCourtEntry(id, collected),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ak.bookings });
      qc.invalidateQueries({ queryKey: ak.scanLog });
    },
  });
}

export function useConfirmClassEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, memberCode }: { classId: string; memberCode: string }) => api.confirmClassEntry(classId, memberCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ak.dashboard });
      qc.invalidateQueries({ queryKey: ak.members });
      qc.invalidateQueries({ queryKey: ak.scanLog });
    },
  });
}
