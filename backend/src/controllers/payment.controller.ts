import { Request, Response } from 'express';
import paymentService from '../services/payment.service';
import { SuccessResponse } from '../core/ApiResponse';

class PaymentController {
  /**
   * POST /v1/payments
   * Process payment for a trip
   */
  async processPayment(req: Request, res: Response) {
    const { tripId, amount, paymentMethod } = req.body;

    const result = await paymentService.processPayment(tripId, amount, paymentMethod);

    return new SuccessResponse('Payment processed', result).send(res);
  }
}

export default new PaymentController();
