import prisma from '../core/database';
import getRedisClient from '../core/redis';
import Logger from '../core/Logger';
import { BadRequestError, NoEntryError } from '../core/ApiError';
import { calculateHaversineDistance } from '../helpers/distance';
import { startPerformanceMeasure, measurePerformance } from '../helpers/performanceHelper';

interface DriverLocation {
  id: string;
  latitude: number;
  longitude: number;
  tier: string;
}

class DriverService {
  /**
   * Update driver location and cache in Redis
   */
  async updateLocation(driverId: string, latitude: number, longitude: number): Promise<void> {
    // Verify driver exists
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      throw new NoEntryError('Driver not found');
    }

    // Update location in database
    await prisma.driver.update({
      where: { id: driverId },
      data: { latitude, longitude },
    });

    // Cache in Redis if driver is available
    if (driver.status === 'AVAILABLE') {
      await this.cacheDriverLocation(driverId, latitude, longitude, driver.tier);
    }

    Logger.info(`Driver ${driverId} location updated: (${latitude}, ${longitude})`);
  }

  /**
   * Get nearby ride requests for a driver
   */
  async getNearbyRides(driverId: string, radiusKm: number = 10) {
    // Get driver's current location
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      throw new NoEntryError('Driver not found');
    }

    if (!driver.latitude || !driver.longitude) {
      throw new BadRequestError('Driver location not set. Please update your location first.');
    }

    // Get all REQUESTED rides
    const requestedRides = await prisma.rideRequest.findMany({
      where: {
        status: 'REQUESTED',
        tier: driver.tier, // Only show rides matching driver's tier
      },
      include: {
        rider: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate distance for each ride and filter by radius
    const nearbyRides = requestedRides
      .map((ride) => {
        const distance = calculateHaversineDistance(
          driver.latitude!,
          driver.longitude!,
          ride.pickupLat,
          ride.pickupLng
        );

        return {
          id: ride.id,
          riderId: ride.riderId,
          rider: ride.rider,
          pickup: {
            latitude: ride.pickupLat,
            longitude: ride.pickupLng,
          },
          destination: {
            latitude: ride.destLat,
            longitude: ride.destLng,
          },
          tier: ride.tier,
          distance, // in km
          createdAt: ride.createdAt,
        };
      })
      .filter((ride) => ride.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance); // Sort by distance (nearest first)

    Logger.info(`Found ${nearbyRides.length} nearby rides for driver ${driverId} within ${radiusKm}km`);

    return nearbyRides;
  }

  /**
   * Accept a ride request (with transaction to prevent double-assignment)
   */
  async acceptRide(driverId: string, rideId: string): Promise<void> {
    await prisma.$transaction(async (tx:any) => {
      // Check driver status
      const driver = await tx.driver.findUnique({ where: { id: driverId } });
      if (!driver) {
        throw new NoEntryError('Driver not found');
      }
      if (driver.status !== 'AVAILABLE') {
        throw new BadRequestError('Driver is not available');
      }

      // Check ride request
      const rideRequest = await tx.rideRequest.findUnique({ where: { id: rideId } });
      if (!rideRequest) {
        throw new NoEntryError('Ride request not found');
      }
      if (rideRequest.status !== 'REQUESTED') {
        throw new BadRequestError('Ride request is not available');
      }

      // Update driver status
      await tx.driver.update({
        where: { id: driverId },
        data: { status: 'ASSIGNED' },
      });

      // Update ride request
      await tx.rideRequest.update({
        where: { id: rideId },
        data: {
          status: 'ASSIGNED',
          driverId,
        },
      });

      // Create trip
      await tx.trip.create({
        data: {
          rideRequestId: rideId,
          driverId,
          riderId: rideRequest.riderId,
          status: 'CREATED',
        },
      });
    });

    // Remove from Redis cache
    await this.removeDriverFromCache(driverId);

    Logger.info(`Driver ${driverId} accepted ride ${rideId}`);
  }

  /**
   * Find nearest available driver (simple distance calculation)
   */
  async findNearestAvailable(
    latitude: number,
    longitude: number,
    tier: string
  ): Promise<string | null> {
    // Start performance measurement
    const startMark = startPerformanceMeasure('driver-matching');
    const recordPerformance = measurePerformance('DriverMatching/Duration', 'driver-matching', startMark);

    try {
      // Try Redis cache first
      const cachedDriverId = await this.findNearestFromCache(latitude, longitude, tier);
      if (cachedDriverId) {
        return cachedDriverId;
      }

      // Fallback to database query
      const drivers = await prisma.driver.findMany({
        where: {
          status: 'AVAILABLE',
          tier: tier as any,
          latitude: { not: null },
          longitude: { not: null },
        },
      });

      if (drivers.length === 0) {
        return null;
      }

      // Calculate distances and find nearest
      let nearestDriver = drivers[0];
      let minDistance = this.calculateDistance(
        latitude,
        longitude,
        nearestDriver.latitude!,
        nearestDriver.longitude!
      );

      for (const driver of drivers.slice(1)) {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          driver.latitude!,
          driver.longitude!
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestDriver = driver;
        }
      }

      return nearestDriver.id;
    } finally {
      recordPerformance();
    }
  }

  /**
   * Cache driver location in Redis
   */
  private async cacheDriverLocation(
    driverId: string,
    latitude: number,
    longitude: number,
    tier: string
  ): Promise<void> {
    try {
      const redis = await getRedisClient();
      const key = `driver:${tier}:${driverId}`;
      await redis.set(key, JSON.stringify({ id: driverId, latitude, longitude, tier }), {
        EX: 3600, // 1 hour expiry
      });
    } catch (error) {
      Logger.error('Failed to cache driver location:', error);
    }
  }

  /**
   * Remove driver from Redis cache
   */
  private async removeDriverFromCache(driverId: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      const keys = await redis.keys(`driver:*:${driverId}`);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      Logger.error('Failed to remove driver from cache:', error);
    }
  }

  /**
   * Find nearest driver from Redis cache
   */
  private async findNearestFromCache(
    latitude: number,
    longitude: number,
    tier: string
  ): Promise<string | null> {
    try {
      const redis = await getRedisClient();
      const keys = await redis.keys(`driver:${tier}:*`);

      if (keys.length === 0) {
        return null;
      }

      const drivers: DriverLocation[] = [];
      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          drivers.push(JSON.parse(data));
        }
      }

      if (drivers.length === 0) {
        return null;
      }

      // Find nearest
      let nearestDriver = drivers[0];
      let minDistance = this.calculateDistance(
        latitude,
        longitude,
        nearestDriver.latitude,
        nearestDriver.longitude
      );

      for (const driver of drivers.slice(1)) {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          driver.latitude,
          driver.longitude
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestDriver = driver;
        }
      }

      // Verify driver is still AVAILABLE in database (cache might be stale)
      const dbDriver = await prisma.driver.findUnique({
        where: { id: nearestDriver.id },
        select: { status: true },
      });

      if (!dbDriver || dbDriver.status !== 'AVAILABLE') {
        // Driver not available, fall back to database query
        return null;
      }

      return nearestDriver.id;
    } catch (error) {
      Logger.error('Failed to find nearest driver from cache:', error);
      return null;
    }
  }

  /**
   * Simple Euclidean distance calculation (good enough for demo)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const latDiff = lat1 - lat2;
    const lngDiff = lng1 - lng2;
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
  }
}

export default new DriverService();
