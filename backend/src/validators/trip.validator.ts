import Joi from 'joi';

// End Trip
export const endTripSchema = Joi.object({
  id: Joi.string().uuid().required(),
});
