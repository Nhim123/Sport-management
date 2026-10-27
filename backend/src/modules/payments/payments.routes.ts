import { Router } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import * as service from './payments.service';

const router = Router();

router.get(
  '/methods',
  asyncHandler(async (_req, res) => {
    res.json(await service.getPayMethods());
  }),
);

export default router;
