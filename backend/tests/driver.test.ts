import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Driver API', () => {
  let driverId: string;
  let rideId: string;
  let riderId: string;

  beforeAll(async () => {
    // Get an available driver from seed data
    const driver = await prisma.driver.findFirst({
      where: { status: 'AVAILABLE' },
    });
    if (!driver) throw new Error('No available drivers found. Run seed first.');
    driverId = driver.id;

    // Get a rider and create a ride request for accept test
    const rider = await prisma.rider.findFirst();
    if (!rider) throw new Error('No riders found. Run seed first.');
    riderId = rider.id;

    const ride = await prisma.rideRequest.create({
      data: {
        riderId: rider.id,
        pickupLat: 37.7749,
        pickupLng: -122.4194,
        destLat: 37.8049,
        destLng: -122.3894,
        tier: 'ECONOMY',
      },
    });
    rideId = ride.id;
  });

  describe('POST /v1/drivers/:id/location', () => {
    it('should update driver location', async () => {
      const response = await request(app)
        .post(`/v1/drivers/${driverId}/location`)
        .send({
          latitude: 37.7849,
          longitude: -122.4094,
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('location updated');
    });

    it('should fail with invalid driver ID', async () => {
      const response = await request(app)
        .post('/v1/drivers/invalid-id/location')
        .send({
          latitude: 37.7849,
          longitude: -122.4094,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /v1/drivers/:id/accept', () => {
    it('should accept a ride request', async () => {
      const response = await request(app)
        .post(`/v1/drivers/${driverId}/accept`)
        .send({
          rideId,
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('accepted');
    });

    it('should fail with invalid ride ID', async () => {
      const response = await request(app)
        .post(`/v1/drivers/${driverId}/accept`)
        .send({
          rideId: 'invalid-ride-id',
        });

      expect(response.status).toBe(400);
    });
  });
});
