import { useMutation } from '@tanstack/react-query';
import { createBooking } from '../api/bookings.api';

export function useCreateBooking() {
  return useMutation({ mutationFn: createBooking });
}
