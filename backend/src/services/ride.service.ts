import prisma from '../core/database';
import Logger from '../core/Logger';
import { NoEntryError } from '../core/ApiError';

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
   * Create ride request (manual driver acceptance)
   */
  async createRideRequest(data: CreateRideData) {
    // Verify rider exists
    const rider = await prisma.rider.findUnique({ where: { id: data.riderId } });
    if (!rider) {
      throw new NoEntryError('Rider not found');
    }

    // Create ride request in REQUESTED state (no auto-assignment)
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
