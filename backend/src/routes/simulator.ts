// src/routes/simulatorRoutes.ts

import { Router, Request, Response, NextFunction } from 'express';
import { simulatorController } from '@/controllers/simulatorController.js';
import { AppError } from '@/middleware/errorHandler.js';

const router = Router();

// --- CRITICAL: Environment Protection Middleware ---
// This middleware ensures these developer-only routes are NOT available in production.
const devOnly = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production') {
    return next(new AppError('This endpoint is not available in production.', 403));
  }
  next();
};

// Apply the middleware to all routes in this file
router.use(devOnly);

/**
 * @openapi
 * tags:
 *   name: Simulator
 *   description: (DEV ONLY) Endpoints to control the real-time GPS simulator. Not available in production.
 */

/**
 * @openapi
 * /api/simulator/status:
 *   get:
 *     summary: Get the current status of the GPS simulator
 *     tags: [Simulator]
 *     responses:
 *       '200':
 *         description: The current status of the simulator.
 */
router.get('/status', simulatorController.getSimulationStatus);

/**
 * @openapi
 * /api/simulator/start:
 *   post:
 *     summary: Start the GPS simulator
 *     tags: [Simulator]
 *     responses:
 *       '200':
 *         description: Simulator started successfully.
 */
router.post('/start', simulatorController.startSimulation);

/**
 * @openapi
 * /api/simulator/stop:
 *   post:
 *     summary: Stop the GPS simulator
 *     tags: [Simulator]
 *     responses:
 *       '200':
 *         description: Simulator stopped successfully.
 */
router.post('/stop', simulatorController.stopSimulation);

/**
 * @openapi
 * /api/simulator/buses/{id}/add:
 *   post:
 *     summary: Add a specific bus to the running simulation
 *     tags: [Simulator]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The numeric ID of the bus to add.
 *     responses:
 *       '200':
 *         description: Bus added to the simulation.
 */
router.post('/buses/:id/add', simulatorController.addBusToSimulation);

/**
 * @openapi
 * /api/simulator/buses/{id}/remove:
 *   post:
 *     summary: Remove a specific bus from the running simulation
 *     tags: [Simulator]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The numeric ID of the bus to remove.
 *     responses:
 *       '200':
 *         description: Bus removed from the simulation.
 */
router.post('/buses/:id/remove', simulatorController.removeBusFromSimulation);

export default router;