// src/controllers/simulatorController.ts

import { Request, Response } from 'express';
import { gpsSimulator } from '@/services/gpsSimulator.js';
import { asyncHandler } from '@/middleware/errorHandler.js';

/**
 * Controller for managing the GPS simulator via API endpoints.
 * Note: These endpoints should only be exposed in a development environment.
 */
class SimulatorController {
  /**
   * Starts the GPS simulation.
   * POST /api/simulator/start
   */
  startSimulation = asyncHandler(async (req: Request, res: Response) => {
    await gpsSimulator.startSimulation();
    res.status(200).json({
      success: true,
      message: 'GPS simulation started successfully.',
      data: (gpsSimulator as any).getStatus?.() ?? null,
    });
  });

  /**
   * Stops the GPS simulation.
   * POST /api/simulator/stop
   */
  stopSimulation = asyncHandler(async (req: Request, res: Response) => {
    gpsSimulator.stopSimulation();
    res.status(200).json({
      success: true,
      message: 'GPS simulation stopped successfully.',
      data: (gpsSimulator as any).getStatus?.() ?? null,
    });
  });

  /**
   * Gets the current status of the GPS simulation.
   * GET /api/simulator/status
   */
  getSimulationStatus = asyncHandler(async (req: Request, res: Response) => {
    const status = (gpsSimulator as any).getStatus?.() ?? null;
    res.status(200).json({
      success: true,
      data: status,
    });
  });

  /**
   * Dynamically adds a specific bus to the running simulation.
   * POST /api/simulator/buses/:id/add
   */
  addBusToSimulation = asyncHandler(async (req: Request, res: Response) => {
    const busId = parseInt(req.params.id);
    await gpsSimulator.addBusToSimulation(busId);
    res.status(200).json({
      success: true,
      message: `Attempted to add bus ${busId} to simulation.`,
      data: (gpsSimulator as any).getStatus?.() ?? null,
    });
  });

  /**
   * Dynamically removes a specific bus from the running simulation.
   * POST /api/simulator/buses/:id/remove
   */
  removeBusFromSimulation = asyncHandler(async (req: Request, res: Response) => {
    const busId = parseInt(req.params.id);
    gpsSimulator.removeBusFromSimulation(busId);
    res.status(200).json({
      success: true,
      message: `Bus ${busId} removed from simulation.`,
      data: (gpsSimulator as any).getStatus?.() ?? null,
    });
  });
}

export const simulatorController = new SimulatorController();