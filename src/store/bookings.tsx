import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { INITIAL_BOOKINGS, NOW_HOUR, type Booking } from '../data/mock';

/**
 * Kho lượt đặt sân – dùng chung cho màn quản trị (Lịch đặt sân) và app hội viên.
 * Lưu trên trình duyệt để lượt đặt/cọc từ app chuyển sang lịch của cơ sở và còn lại sau khi tải lại.
 * Chưa có backend nên mặc định là dữ liệu mẫu trong mock.ts.
 */
const KEY = 'arena-bookings';

interface BookingStore {
  bookings: Booking[];
  addBooking: (b: Omit<Booking, 'id'>) => Booking;
  updateBooking: (id: string, patch: Partial<Omit<Booking, 'id'>>) => void;
  removeBooking: (id: string) => void;
  /** true nếu [start, start+span) trên sân này còn trống */
  isFree: (courtId: string, start: number, span: number) => boolean;
}

const Ctx = createContext<BookingStore | null>(null);

/** Lượt đã đặt bắt đầu trước "bây giờ" coi như khách đã check-in */
const SEED = INITIAL_BOOKINGS.map((b) => (b.state === 'booked' && b.start < NOW_HOUR ? { ...b, checkedIn: true } : b));

function isBooking(x: unknown): x is Booking {
  const b = x as Booking;
  return !!b && typeof b.id === 'string' && typeof b.courtId === 'string' && typeof b.start === 'number' && typeof b.span === 'number' && typeof b.label === 'string';
}

function load(): Booking[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const v: unknown = JSON.parse(raw);
      if (Array.isArray(v) && v.every(isBooking)) return v as Booking[];
    }
  } catch {
    /* dữ liệu hỏng – dùng dữ liệu mẫu */
  }
  return SEED;
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(bookings));
    } catch {
      /* không lưu được – thay đổi vẫn dùng được trong lần mở này */
    }
  }, [bookings]);

  const isFree = useCallback(
    (courtId: string, start: number, span: number) =>
      !bookings.some((b) => b.courtId === courtId && b.start < start + span && start < b.start + b.span),
    [bookings],
  );

  const addBooking = useCallback((b: Omit<Booking, 'id'>) => {
    const created: Booking = { ...b, id: 'n' + Date.now().toString(36) };
    setBookings((prev) => [...prev, created]);
    return created;
  }, []);

  const updateBooking = useCallback((id: string, patch: Partial<Omit<Booking, 'id'>>) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }, []);

  const removeBooking = useCallback((id: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const value = useMemo(
    () => ({ bookings, addBooking, updateBooking, removeBooking, isFree }),
    [bookings, addBooking, updateBooking, removeBooking, isFree],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBookings(): BookingStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('useBookings must be used inside <BookingProvider>');
  return v;
}
