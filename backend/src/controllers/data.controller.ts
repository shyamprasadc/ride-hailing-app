import { Request, Response } from 'express';
import prisma from '../core/database';
import { SuccessResponse } from '../core/ApiResponse';

class DataController {
  async getRiders(req: Request, res: Response) {
    const riders = await prisma.rider.findMany({
      select: { id: true, name: true, email: true, phone: true },
    });
    return new SuccessResponse('Riders fetched successfully', riders).send(res);
  }

  async getDrivers(req: Request, res: Response) {
    const drivers = await prisma.driver.findMany({
      select: { id: true, name: true, phone: true, status: true, tier: true },
    });
    return new SuccessResponse('Drivers fetched successfully', drivers).send(res);
  }
}

export default new DataController();
