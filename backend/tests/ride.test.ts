import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Ride API', () => {
  let riderId: string;

  beforeAll(async () => {
    // Get a rider from seed data
    const rider = await prisma.rider.findFirst();
    if (!rider) throw new Error('No riders found. Run seed first.');
    riderId = rider.id;
  });

  describe('POST /v1/rides', () => {
    it('should create a new ride request', async () => {
      const response = await request(app)
        .post('/v1/rides')
        .send({
          riderId,
          pickupLat: 37.7749,
          pickupLng: -122.4194,
          destLat: 37.8049,
          destLng: -122.3894,
          tier: 'ECONOMY',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('rideId');
      expect(response.body.data.status).toBe('REQUESTED');
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/v1/rides')
        .send({
          riderId,
          // Missing coordinates
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /v1/rides/:id', () => {
    it('should get ride details', async () => {
      // Create a ride directly in DB for testing GET
      const ride = await prisma.rideRequest.create({
        data: {
          riderId,
          pickupLat: 37.7749,
          pickupLng: -122.4194,
          destLat: 37.8049,
          destLng: -122.3894,
          tier: 'ECONOMY',
        },
      });

      const response = await request(app).get(`/v1/rides/${ride.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(ride.id);
      expect(response.body.data).toHaveProperty('rider');
    });

    it('should fail with non-existent ride ID', async () => {
      const response = await request(app).get('/v1/rides/non-existent-id');

      expect(response.status).toBe(400);
    });
  });
});
