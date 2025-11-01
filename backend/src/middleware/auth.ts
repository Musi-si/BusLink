// middleware/auth.ts

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '@/types/index.js';

/**
 * JWT Authentication Middleware.
 */
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token is required' });
    }

    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = decodedPayload;

    // FIX: Added return to make code path explicit
    return next();
  } catch (error: any) {
    console.error('Authentication error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    return res.status(500).json({ message: 'Authentication failed' });
  }
};

/**
 * Role-based Authorization Middleware.
 */
export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication is required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: You do not have the required permissions' });
    }
    
    // FIX: Added return to make code path explicit
    return next();
  };
};

/**
 * Optional Authentication Middleware.
 */
// FIX: Prefixed unused `res` parameter with an underscore
export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
      req.user = decodedPayload;
    }
  } catch (error) {
    // If token verification fails, we do nothing and proceed.
  }
  
  next();
};