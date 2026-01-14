import { Request, Response } from 'express';
import driverService from '../services/driver.service';
import { SuccessResponse, SuccessMsgResponse } from '../core/ApiResponse';

class DriverController {
  /**
   * POST /v1/drivers/:id/location
   * Update driver location
   */
  async updateLocation(req: Request, res: Response) {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    await driverService.updateLocation(id, latitude, longitude);

    return new SuccessMsgResponse('Driver location updated successfully').send(res);
  }

  /**
   * POST /v1/drivers/:id/accept
   * Accept a ride request
   */
  async acceptRide(req: Request, res: Response) {
    const { id } = req.params;
    const { rideId } = req.body;

    await driverService.acceptRide(id, rideId);

    return new SuccessMsgResponse('Ride accepted successfully').send(res);
  }
}

export default new DriverController();
