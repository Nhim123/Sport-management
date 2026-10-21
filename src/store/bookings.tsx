import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { INITIAL_BOOKINGS, NOW_HOUR, type Booking } from '../data/mock';

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

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(SEED);

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
