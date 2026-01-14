import Joi from 'joi';

// Process Payment
export const processPaymentSchema = Joi.object({
  tripId: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
  paymentMethod: Joi.string().valid('CARD', 'CASH', 'WALLET').default('CARD'),
});
