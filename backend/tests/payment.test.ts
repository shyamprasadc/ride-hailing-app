import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Payment API', () => {
  let tripId: string;

  beforeAll(async () => {
    // Create a completed trip for payment testing
    const rider = await prisma.rider.findFirst();
    const driver = await prisma.driver.findFirst();

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
        status: 'ENDED',
        fare: 25.5,
        distance: 5.2,
        endTime: new Date(),
      },
    });

    tripId = trip.id;
  });

  describe('POST /v1/payments', () => {
    it('should process payment for a trip', async () => {
      const response = await request(app)
        .post('/v1/payments')
        .send({
          tripId,
          amount: 25.5,
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data.status).toBe('SUCCESS');
    });

    it('should fail with invalid trip ID', async () => {
      const response = await request(app)
        .post('/v1/payments')
        .send({
          tripId: 'invalid-trip-id',
          amount: 25.5,
        });

      expect(response.status).toBe(400);
    });
  });
});
