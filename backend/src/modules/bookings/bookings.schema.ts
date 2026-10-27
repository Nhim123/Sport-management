import { z } from 'zod';

export const createBookingSchema = z.object({
  courtId: z.string().min(1),
  dayIndex: z.number().int().min(0),
  hour: z.number().int().min(0).max(23),
  racket: z.boolean().default(false),
  method: z.string().min(1).default('qr'),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
