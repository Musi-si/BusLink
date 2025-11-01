// src/middleware/errorHandler.ts

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger.js';

/**
 * Custom Error class to extend the built-in Error.
 * This allows us to add a statusCode and other custom properties.
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // To distinguish from programming errors

    // Capture the stack trace, excluding the constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global Error Handling Middleware.
 * This should be the last middleware in your Express app.
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let error = err;

  // If the error is not an AppError, convert it to one
  if (!(error instanceof AppError)) {
    // Default to 500 for non-operational errors
    const statusCode = 500;
    const message = 'An unexpected internal server error occurred.';
    error = new AppError(message, statusCode);
  }

  // Log the original error for debugging purposes
  logger.error(err.stack || err.message);

  // --- Handle Specific Prisma Errors ---
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation (e.g., duplicate email)
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.[0] || 'field';
      const message = `A record with this ${field} already exists.`;
      error = new AppError(message, 409); // 409 Conflict is often more appropriate
    }
    // Record to be updated or deleted not found
    if (err.code === 'P2025') {
      const message = `The requested resource was not found.`;
      error = new AppError(message, 404);
    }
    // Foreign key constraint failed
    if (err.code === 'P2003') {
        const field = (err.meta?.field_name as string) || 'related resource';
        const message = `Invalid reference to a ${field}.`;
        error = new AppError(message, 400);
    }
  }

  // --- Handle JWT Errors ---
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Your session has expired. Please log in again.', 401);
  }

  // --- Final Response ---
  const appError = error as AppError;
  res.status(appError.statusCode || 500).json({
    success: false,
    error: {
      message: appError.message || 'Server Error',
      // Include stack trace only in development environment
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

/**
 * Wraps async route handlers to catch errors and pass them to the global error handler.
 * This avoids the need for try-catch blocks in every controller.
 * @param fn The async controller function.
 * @returns A new function that Express can execute.
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 404 Not Found Handler.
 * To be placed right before the global error handler.
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`The requested route '${req.originalUrl}' does not exist.`, 404);
  next(error);
};