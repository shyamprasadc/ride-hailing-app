import express from 'express';
import asyncHandler from '../../helpers/asyncHandler';
import rideController from '../../controllers/ride.controller';
import { validate } from '../../middlewares/validator';
import { createRideSchema, getRideSchema } from '../../validators/ride.validator';

const router = express.Router();

// POST /v1/rides - Create ride request
router.post(
  '/',
  validate(createRideSchema, 'body'),
  asyncHandler(async (req, res) => rideController.createRide(req, res))
);

// GET /v1/rides/:id - Get ride details
router.get(
  '/:id',
  validate(getRideSchema, 'params'),
  asyncHandler(async (req, res) => rideController.getRide(req, res))
);

export default router;
