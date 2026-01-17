import { Request, Response } from 'express';
import rideService from '../services/ride.service';
import { SuccessResponse } from '../core/ApiResponse';

class RideController {
  /**
   * POST /v1/rides
   * Create a new ride request
   */
  async createRide(req: Request, res: Response) {
    const { riderId, pickupLat, pickupLng, destLat, destLng, tier, autoAssign } = req.body;

    const result = await rideService.createRideRequest({
      riderId,
      pickupLat,
      pickupLng,
      destLat,
      destLng,
      tier,
      autoAssign: autoAssign || false,
    });

    return new SuccessResponse('Ride request created successfully', result).send(res);
  }

  /**
   * GET /v1/rides/:id
   * Get ride request details
   */
  async getRide(req: Request, res: Response) {
    const { id } = req.params;

    const ride = await rideService.getRideById(id);

    return new SuccessResponse('Ride details fetched successfully', ride).send(res);
  }
}

export default new RideController();
