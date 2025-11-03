// src/index.ts

import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Server as SocketIOServer } from 'socket.io';

import prisma from '@/config/prisma.js';
import logger from '@/utils/logger.js';
import { swaggerUi, swaggerSpec } from '@/swagger.js';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler.js';

// --- Service Imports ---
// Import the singleton instances of our services with correct paths
import { socketManager } from '@/services/socket.js';
import { busStateManager } from '@/services/busStateManager.js';
import { gpsSimulator } from '@/services/gpsSimulator.js';

// --- Route Imports ---
// Import all the route handlers we have created
import authRoutes from '@/api/auth/routes.js';
import busRoutes from '@/api/bus/routes.js';
import routeRoutes from '@/api/route/routes.js';
import stopRoutes from '@/api/stop/routes.js';
import bookingRoutes from '@/api/booking/routes.js';
import driverRoutes from '@/api/driver/routes.js';
import simulatorRoutes from '@/api/simulator/routes.js'; // Dev-only routes

// --- Initialization ---
const app: Express = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    methods: ['GET', 'POST'],
  },
});
const PORT = process.env.PORT || 3000;

// --- Initialize Services with Server Instances ---
// This is the core of our dependency injection pattern.
socketManager.initialize(io);
busStateManager.initialize(io);
gpsSimulator.initialize(io);

// --- Core Middleware ---
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:8080', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Rate Limiting ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true, 
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// --- Request Logging ---
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.originalUrl.includes('/api')) { // Optional: only log API requests
    logger.info(`[${req.method}] ${req.originalUrl}`);
  }
  next();
});

// --- API Documentation ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- API Routes ---
// Register all the imported route handlers with their base paths
app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/stops', stopRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/simulator', simulatorRoutes); // These routes are self-protecting in production

// --- Health Check Endpoint ---
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// --- Error Handling Middleware (must be the last app.use calls) ---
app.use(notFoundHandler); // Catches all 404s for any paths not matched above
app.use(errorHandler);    // Catches and formats all other errors

// --- Server Startup ---
const startServer = () => {
  server.listen(PORT, () => {
    logger.info(`🚌 Server is running on port ${PORT}`);
    logger.info(`✨ Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`📖 API docs available at http://localhost:${PORT}/api-docs`);
    
    // Start the GPS simulation, but only in a non-production environment
    if (process.env.NODE_ENV !== 'production') {
      gpsSimulator.startSimulation();
    }
  });
};

// --- Graceful Shutdown Logic ---
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  gpsSimulator.stopSimulation(); // Ensure the simulator is stopped cleanly
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Prisma client disconnected.');
    process.exit(0);
  });
  
  // Force shutdown after a timeout
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// --- Run the Server ---
startServer();