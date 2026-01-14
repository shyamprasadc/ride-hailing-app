import express from 'express';
import asyncHandler from '../../helpers/asyncHandler';
import tripController from '../../controllers/trip.controller';
import { validate } from '../../middlewares/validator';
import { endTripSchema } from '../../validators/trip.validator';

const router = express.Router();

// POST /v1/trips/:id/end - End trip
router.post(
  '/:id/end',
  validate(endTripSchema, 'params'),
  asyncHandler(async (req, res) => tripController.endTrip(req, res))
);

export default router;
