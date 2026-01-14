import express from 'express';
import asyncHandler from '../../helpers/asyncHandler';
import paymentController from '../../controllers/payment.controller';
import { validate } from '../../middlewares/validator';
import { processPaymentSchema } from '../../validators/payment.validator';

const router = express.Router();

// POST /v1/payments - Process payment
router.post(
  '/',
  validate(processPaymentSchema, 'body'),
  asyncHandler(async (req, res) => paymentController.processPayment(req, res))
);

export default router;
