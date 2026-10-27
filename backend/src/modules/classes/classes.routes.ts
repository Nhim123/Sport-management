import { Router } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import * as service from './classes.service';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await service.getTonightClasses());
  }),
);

export default router;
