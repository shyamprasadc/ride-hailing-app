import express from 'express';
import asyncHandler from '../../helpers/asyncHandler';
import dataController from '../../controllers/data.controller';

const router = express.Router();

// GET /v1/data/riders - Get all riders
router.get('/riders', asyncHandler(async (req, res) => dataController.getRiders(req, res)));

// GET /v1/data/drivers - Get all drivers
router.get('/drivers', asyncHandler(async (req, res) => dataController.getDrivers(req, res)));

export default router;
