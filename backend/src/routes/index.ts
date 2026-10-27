import { Router } from 'express';
import bookingsRoutes from '../modules/bookings/bookings.routes';
import classesRoutes from '../modules/classes/classes.routes';
import courtsRoutes from '../modules/courts/courts.routes';
import membersRoutes from '../modules/members/members.routes';
import paymentsRoutes from '../modules/payments/payments.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.use('/courts', courtsRoutes);
router.use('/classes', classesRoutes);
router.use('/members', membersRoutes);
router.use('/payments', paymentsRoutes);
router.use('/bookings', bookingsRoutes);

export default router;
