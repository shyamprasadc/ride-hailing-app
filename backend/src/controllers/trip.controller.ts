import { Request, Response } from 'express';
import tripService from '../services/trip.service';
import { SuccessResponse } from '../core/ApiResponse';

class TripController {
  /**
   * POST /v1/trips/:id/end
   * End a trip
   */
  async endTrip(req: Request, res: Response) {
    const { id } = req.params;

    const result = await tripService.endTrip(id);

    return new SuccessResponse('Trip ended successfully', result).send(res);
  }
}

export default new TripController();
