import { Router } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { createBookingSchema } from './bookings.schema';
import * as service from './bookings.service';

const router = Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = createBookingSchema.parse(req.body);
    const booking = await service.createBooking(input);
    res.status(201).json(booking);
  }),
);

export default router;
