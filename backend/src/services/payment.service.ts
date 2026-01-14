import prisma from '../core/database';
import Logger from '../core/Logger';
import { BadRequestError, NoEntryError } from '../core/ApiError';

class PaymentService {
  /**
   * Process payment (simulate with 90% success rate)
   */
  async processPayment(tripId: string, amount: number, paymentMethod: string) {
    // Verify trip exists and is ended
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { payment: true },
    });

    if (!trip) {
      throw new NoEntryError('Trip not found');
    }

    if (trip.status !== 'ENDED') {
      throw new BadRequestError('Trip must be ended before payment');
    }

    if (trip.payment) {
      throw new BadRequestError('Payment already processed for this trip');
    }

    // Validate amount matches trip fare
    if (trip.fare && Math.abs(amount - trip.fare) > 0.01) {
      throw new BadRequestError(`Payment amount must match trip fare ($${trip.fare})`);
    }

    // Simulate payment processing (90% success rate)
    const isSuccess = Math.random() < 0.9;
    const status = isSuccess ? 'SUCCESS' : 'FAILED';

    // Create payment record and update trip status (transaction)
    const result = await prisma.$transaction(async (tx:any) => {
      const payment = await tx.payment.create({
        data: {
          tripId,
          amount,
          status: status as any,
          paymentMethod,
        },
      });

      // Update trip status to PAID if payment successful
      if (isSuccess) {
        await tx.trip.update({
          where: { id: tripId },
          data: { status: 'PAID' },
        });
      }

      return payment;
    });

    Logger.info(`Payment ${result.id} for trip ${tripId}: ${status} ($${amount})`);

    return {
      id: result.id,
      tripId: result.tripId,
      amount: result.amount,
      status: result.status,
      paymentMethod: result.paymentMethod,
      createdAt: result.createdAt,
    };
  }
}

export default new PaymentService();
