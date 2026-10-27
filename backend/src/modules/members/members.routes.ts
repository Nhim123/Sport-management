import { Router } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import * as service from './members.service';

const router = Router();

router.get(
  '/me',
  asyncHandler(async (_req, res) => {
    res.json(await service.getMe());
  }),
);

router.get(
  '/me/schedule',
  asyncHandler(async (_req, res) => {
    res.json(await service.getMySchedule());
  }),
);

export default router;
