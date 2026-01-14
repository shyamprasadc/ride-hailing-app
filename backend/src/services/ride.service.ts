import prisma from '../core/database';
import Logger from '../core/Logger';
import { BadRequestError, NoEntryError } from '../core/ApiError';
import driverService from './driver.service';
import { performance } from 'perf_hooks';
import { recordMetric } from '../middlewares/performanceMonitoring';

interface CreateRideData {
  riderId: string;
  pickupLat: number;
  pickupLng: number;
  destLat: number;
  destLng: number;
  tier: string;
}

class RideService {
  /**
   * Create ride request and assign nearest available driver
   */
  async createRideRequest(data: CreateRideData) {
    // Verify rider exists
    const rider = await prisma.rider.findUnique({ where: { id: data.riderId } });
    if (!rider) {
      throw new NoEntryError('Rider not found');
    }

    // Find nearest available driver
    const driverId = await driverService.findNearestAvailable(
      data.pickupLat,
      data.pickupLng,
      data.tier
    );

    if (!driverId) {
      // No driver available - create request in REQUESTED state
      const rideRequest = await prisma.rideRequest.create({
        data: {
          riderId: data.riderId,
          pickupLat: data.pickupLat,
          pickupLng: data.pickupLng,
          destLat: data.destLat,
          destLng: data.destLng,
          tier: data.tier as any,
          status: 'REQUESTED',
        },
      });

      Logger.info(`Ride request ${rideRequest.id} created - no drivers available`);

      return {
        rideId: rideRequest.id,
        status: rideRequest.status,
        message: 'No drivers available. Your request is queued.',
      };
    }

    // Assign driver and create trip (transaction)
    const startMark = `ride-assignment-${Date.now()}`;
    performance.mark(startMark);

    try {
      const result = await prisma.$transaction(async (tx:any) => {
        // Verify driver is still available
        const driver = await tx.driver.findUnique({ where: { id: driverId } });
        if (!driver || driver.status !== 'AVAILABLE') {
          throw new BadRequestError('Driver is no longer available');
        }

        // Create ride request
        const rideRequest = await tx.rideRequest.create({
          data: {
            riderId: data.riderId,
            pickupLat: data.pickupLat,
            pickupLng: data.pickupLng,
            destLat: data.destLat,
            destLng: data.destLng,
            tier: data.tier as any,
            status: 'ASSIGNED',
            driverId,
          },
        });

        // Update driver status
        await tx.driver.update({
          where: { id: driverId },
          data: { status: 'ASSIGNED' },
        });

        // Create trip
        const trip = await tx.trip.create({
          data: {
            rideRequestId: rideRequest.id,
            driverId,
            riderId: data.riderId,
            status: 'CREATED',
          },
        });

        return { rideRequest, trip, driver };
      });

      Logger.info(`Ride request ${result.rideRequest.id} created and assigned to driver ${driverId}`);

      return {
        rideId: result.rideRequest.id,
        tripId: result.trip.id,
        status: result.rideRequest.status,
        driver: {
          id: result.driver.id,
          name: result.driver.name,
          phone: result.driver.phone,
        },
      };
    } finally {
      // Record metric
      const endMark = `ride-assignment-end-${Date.now()}`;
      performance.mark(endMark);
      const measure = performance.measure('ride-assignment', startMark, endMark);
      recordMetric('RideAssignment/TransactionTime', measure.duration);
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures('ride-assignment');
    }
  }

  /**
   * Get ride request by ID with details
   */
  async getRideById(rideId: string) {
    const rideRequest = await prisma.rideRequest.findUnique({
      where: { id: rideId },
      include: {
        rider: {
          select: { id: true, name: true, phone: true },
        },
        driver: {
          select: { id: true, name: true, phone: true, latitude: true, longitude: true },
        },
        trip: {
          include: {
            payment: true,
          },
        },
      },
    });

    if (!rideRequest) {
      throw new NoEntryError('Ride request not found');
    }

    return {
      id: rideRequest.id,
      status: rideRequest.status,
      pickup: {
        latitude: rideRequest.pickupLat,
        longitude: rideRequest.pickupLng,
      },
      destination: {
        latitude: rideRequest.destLat,
        longitude: rideRequest.destLng,
      },
      tier: rideRequest.tier,
      rider: rideRequest.rider,
      driver: rideRequest.driver,
      trip: rideRequest.trip
        ? {
            id: rideRequest.trip.id,
            status: rideRequest.trip.status,
            startTime: rideRequest.trip.startTime,
            endTime: rideRequest.trip.endTime,
            fare: rideRequest.trip.fare,
            distance: rideRequest.trip.distance,
            payment: rideRequest.trip.payment,
          }
        : null,
      createdAt: rideRequest.createdAt,
    };
  }
}

export default new RideService();
