// types/index.ts

import { Request } from 'express';
import { Role } from '@prisma/client'; // Import the Role enum from Prisma

export interface JwtPayload {
  id: number;
  email: string;
  role: Role; // Use the Prisma Role enum for consistency
  name: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}