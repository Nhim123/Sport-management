// Hook cho chế độ quản lý – mọi màn quản lý lấy dữ liệu qua đây.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/admin.api';
import type { AdminBooking, Shift, Tournament } from '../types/admin';

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
  notices: ['admin', 'notices'] as const,
  recurring: ['admin', 'recurring'] as const,
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

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: api.NewPlan) => api.createPlan(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ak.plans }),
  });
}

export function useSetShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, day, shift }: { staffId: string; day: number; shift: Shift }) => api.setShift(staffId, day, shift),
    onSuccess: () => qc.invalidateQueries({ queryKey: ak.staff }),
  });
}

export function useCreateTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (t: Omit<Tournament, 'id' | 'entrants'>) => api.createTournament(t),
    onSuccess: () => qc.invalidateQueries({ queryKey: ak.tournaments }),
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

// ---------- Thông báo cần xác nhận ----------
export const useNotices = () => useQuery({ queryKey: ak.notices, queryFn: api.getNotices });

export function useCreateNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (n: api.NewNotice) => api.createNotice(n),
    onSuccess: () => qc.invalidateQueries({ queryKey: ak.notices }),
  });
}

function useNoticeMutation<V>(fn: (v: V) => Promise<boolean>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ak.notices });
      qc.invalidateQueries({ queryKey: ak.bookings });
      qc.invalidateQueries({ queryKey: ak.members });
      qc.invalidateQueries({ queryKey: ['courts'] }); // lưới xếp sân đổi khi xác nhận thanh toán
    },
  });
}

export const useConfirmNotice = () =>
  useNoticeMutation(({ id, by, placement }: { id: string; by: string; placement?: { courtId: string; start: number } }) => api.confirmNotice(id, by, placement));
export const useRejectNotice = () => useNoticeMutation(({ id, by, reason }: { id: string; by: string; reason: string }) => api.rejectNotice(id, by, reason));

// ---------- Đặt sân định kỳ ----------
export const useRecurring = () => useQuery({ queryKey: ak.recurring, queryFn: api.getRecurring });

function useRecurringMutation<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ak.recurring });
      qc.invalidateQueries({ queryKey: ak.bookings });
    },
  });
}

export const useCreateRecurring = () => useRecurringMutation(({ input, skipConflicts }: { input: api.NewRecurring; skipConflicts?: boolean }) => api.createRecurring(input, skipConflicts));
export const useSetRecurringStatus = () => useRecurringMutation(({ id, status }: { id: string; status: 'active' | 'paused' | 'ended' }) => api.setRecurringStatus(id, status));
export const useExtendRecurring = () => useRecurringMutation(({ id, weeks }: { id: string; weeks: number }) => api.extendRecurring(id, weeks));
export const useToggleSkip = () => useRecurringMutation(({ id, date }: { id: string; date: string }) => api.toggleSkip(id, date));
