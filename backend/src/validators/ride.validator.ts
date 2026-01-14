import Joi from 'joi';

// Create Ride Request
export const createRideSchema = Joi.object({
  riderId: Joi.string().uuid().required(),
  pickupLat: Joi.number().min(-90).max(90).required(),
  pickupLng: Joi.number().min(-180).max(180).required(),
  destLat: Joi.number().min(-90).max(90).required(),
  destLng: Joi.number().min(-180).max(180).required(),
  tier: Joi.string().valid('ECONOMY', 'PREMIUM').default('ECONOMY'),
});

// Get Ride by ID
export const getRideSchema = Joi.object({
  id: Joi.string().uuid().required(),
});
