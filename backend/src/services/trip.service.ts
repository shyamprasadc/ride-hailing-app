import prisma from '../core/database';
import Logger from '../core/Logger';
import { BadRequestError, NoEntryError } from '../core/ApiError';
import { fareRates } from '../config';
import { startPerformanceMeasure, measurePerformance } from '../helpers/performanceHelper';

class TripService {
  /**
   * End trip, calculate fare, and free driver (transaction)
   */
  async endTrip(tripId: string) {
    const startMark = startPerformanceMeasure('trip-end');
    const recordPerformance = measurePerformance('TripEnd/TransactionTime', 'trip-end', startMark);

    try {
      const result = await prisma.$transaction(async (tx:any) => {
        // Get trip details
        const trip = await tx.trip.findUnique({
          where: { id: tripId },
          include: {
            rideRequest: true,
          },
        });

        if (!trip) {
          throw new NoEntryError('Trip not found');
        }

        if (trip.status === 'ENDED' || trip.status === 'PAID') {
          throw new BadRequestError('Trip already ended');
        }

        // Calculate distance (simple Euclidean distance)
        const distance = this.calculateDistance(
          trip.rideRequest.pickupLat,
          trip.rideRequest.pickupLng,
          trip.rideRequest.destLat,
          trip.rideRequest.destLng
        );

        // Calculate fare based on tier
        const fare = this.calculateFare(distance, trip.rideRequest.tier);

        // Update trip
        const updatedTrip = await tx.trip.update({
          where: { id: tripId },
          data: {
            status: 'ENDED',
            endTime: new Date(),
            distance,
            fare,
          },
        });

        // Free driver (set status back to AVAILABLE)
        await tx.driver.update({
          where: { id: trip.driverId },
          data: { status: 'AVAILABLE' },
        });

        return updatedTrip;
      });

      Logger.info(`Trip ${tripId} ended. Distance: ${result.distance}km, Fare: $${result.fare}`);

      return {
        id: result.id,
        status: result.status,
        startTime: result.startTime,
        endTime: result.endTime,
        distance: result.distance,
        fare: result.fare,
      };
    } finally {
      recordPerformance();
    }
  }

  /**
   * Calculate simple Euclidean distance (in km approximation)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const latDiff = lat1 - lat2;
    const lngDiff = lng1 - lng2;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    
    // Rough conversion to km (1 degree ≈ 111 km at equator)
    return Math.round(distance * 111 * 100) / 100; // Round to 2 decimals
  }

  /**
   * Calculate fare based on distance and tier
   */
  private calculateFare(distance: number, tier: string): number {
    const rate = tier === 'PREMIUM' ? fareRates.PREMIUM : fareRates.ECONOMY;
    return Math.round(distance * rate * 100) / 100; // Round to 2 decimals
  }
}

export default new TripService();
