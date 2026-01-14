import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Trip API', () => {
  let tripId: string;

  beforeAll(async () => {
    // Create a trip for testing
    const rider = await prisma.rider.findFirst();
    const driver = await prisma.driver.findFirst({
      where: { status: 'AVAILABLE' },
    });

    if (!rider || !driver) {
      throw new Error('No rider or driver found. Run seed first.');
    }

    const ride = await prisma.rideRequest.create({
      data: {
        riderId: rider.id,
        pickupLat: 37.7749,
        pickupLng: -122.4194,
        destLat: 37.8049,
        destLng: -122.3894,
        tier: 'ECONOMY',
        status: 'ASSIGNED',
        driverId: driver.id,
      },
    });

    const trip = await prisma.trip.create({
      data: {
        rideRequestId: ride.id,
        driverId: driver.id,
        riderId: rider.id,
        status: 'STARTED',
      },
    });

    tripId = trip.id;
  });

  describe('POST /v1/trips/:id/end', () => {
    it('should end an active trip', async () => {
      const response = await request(app).post(`/v1/trips/${tripId}/end`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('fare');
      expect(response.body.data.status).toBe('ENDED');
    });

    it('should fail with non-existent trip ID', async () => {
      const response = await request(app).post('/v1/trips/non-existent-id/end');

      expect(response.status).toBe(400);
    });
  });
});
