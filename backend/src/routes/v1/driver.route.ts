import express from 'express';
import asyncHandler from '../../helpers/asyncHandler';
import driverController from '../../controllers/driver.controller';
import { validate } from '../../middlewares/validator';
import {
  updateLocationSchema,
  acceptRideSchema,
  driverIdSchema,
} from '../../validators/driver.validator';

const router = express.Router();

// POST /v1/drivers/:id/location - Update driver location
router.post(
  '/:id/location',
  validate(driverIdSchema, 'params'),
  validate(updateLocationSchema, 'body'),
  asyncHandler(async (req, res) => driverController.updateLocation(req, res))
);

// POST /v1/drivers/:id/accept - Accept ride request
router.post(
  '/:id/accept',
  validate(driverIdSchema, 'params'),
  validate(acceptRideSchema, 'body'),
  asyncHandler(async (req, res) => driverController.acceptRide(req, res))
);

export default router;
