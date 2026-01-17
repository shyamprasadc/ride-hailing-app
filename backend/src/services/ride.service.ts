import prisma from '../core/database';
import Logger from '../core/Logger';
import { NoEntryError } from '../core/ApiError';
import driverService from './driver.service';

interface CreateRideData {
  riderId: string;
  pickupLat: number;
  pickupLng: number;
  destLat: number;
  destLng: number;
  tier: string;
  autoAssign?: boolean;
}

class RideService {
  /**
   * Create ride request with optional auto-assignment
   */
  async createRideRequest(data: CreateRideData) {
    // Verify rider exists
    const rider = await prisma.rider.findUnique({ where: { id: data.riderId } });
    if (!rider) {
      throw new NoEntryError('Rider not found');
    }

    // If auto-assign is enabled, try to find nearest driver
    if (data.autoAssign) {
      const driverId = await driverService.findNearestAvailable(
        data.pickupLat,
        data.pickupLng,
        data.tier
      );

      // If driver found, create assigned ride with trip
      if (driverId) {
        const result = await prisma.$transaction(async (tx: any) => {
          // Create ride request in ASSIGNED state
          const rideRequest = await tx.rideRequest.create({
            data: {
              riderId: data.riderId,
              driverId,
              pickupLat: data.pickupLat,
              pickupLng: data.pickupLng,
              destLat: data.destLat,
              destLng: data.destLng,
              tier: data.tier as any,
              status: 'ASSIGNED',
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
              startTime: new Date(),
            },
          });

          // Get driver details
          const driver = await tx.driver.findUnique({
            where: { id: driverId },
            select: { id: true, name: true, phone: true },
          });

          return { rideRequest, trip, driver };
        });

        Logger.info(`Ride request ${result.rideRequest.id} auto-assigned to driver ${driverId}`);

        return {
          rideId: result.rideRequest.id,
          tripId: result.trip.id,
          status: result.rideRequest.status,
          driver: result.driver,
        };
      }

      // No driver found, fall through to manual acceptance
      Logger.info('Auto-assign requested but no drivers available, creating REQUESTED ride');
    }

    // Manual acceptance or no driver available
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

    Logger.info(`Ride request ${rideRequest.id} created - waiting for driver acceptance`);

    return {
      rideId: rideRequest.id,
      status: rideRequest.status,
      message: 'Ride request created. Waiting for driver to accept.',
    };
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
