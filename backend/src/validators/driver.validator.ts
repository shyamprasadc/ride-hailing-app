import Joi from 'joi';

// Update Driver Location
export const updateLocationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
});

// Accept Ride
export const acceptRideSchema = Joi.object({
  rideId: Joi.string().uuid().required(),
});

// Driver ID param validation
export const driverIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
});
