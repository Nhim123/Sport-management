import { Router } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import * as service from './courts.service';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await service.getCourts());
  }),
);

router.get(
  '/:id/taken',
  asyncHandler(async (req, res) => {
    const dayIndex = Number(req.query.day ?? 0) || 0;
    res.json(await service.getTakenSlots(req.params.id, dayIndex));
  }),
);

export default router;
