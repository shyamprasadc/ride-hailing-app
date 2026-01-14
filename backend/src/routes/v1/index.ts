import express, { Request, Response, NextFunction } from 'express';
import { SuccessMsgResponse } from '../../core/ApiResponse';
import asyncHandler from '../../helpers/asyncHandler';
import rideRoutes from './ride.route';
import driverRoutes from './driver.route';
import tripRoutes from './trip.route';
import paymentRoutes from './payment.route';
import dataRoutes from './data.route';

const router = express.Router();

// Health check
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) =>
    new SuccessMsgResponse('OK').send(res),
  ),
);

// Feature routes
router.use('/rides', rideRoutes);
router.use('/drivers', driverRoutes);
router.use('/trips', tripRoutes);
router.use('/payments', paymentRoutes);
router.use('/data', dataRoutes);

export default router;
