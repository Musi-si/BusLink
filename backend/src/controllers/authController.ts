// controllers/authController.ts

import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '@/lib/prisma.js';
import transporter from '@/utils/email.js';
import { AuthRequest } from '@/types/index.js';
import logger from '@/utils/logger.js';

export class AuthController {
  /**
   * Register a new user and send a verification email.
   */
  async register(req: AuthRequest, res: Response) {
    const { name, email, password, role = 'passenger', phone, license_number, vehicle_plate, vehicle_model, vehicle_capacity } = req.body;

    if (!Object.values(Role).includes(role)) {
      // FIX: Added return statement
      return res.status(400).json({ message: 'Invalid role provided' });
    }

    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        // FIX: Added return statement
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const SECRET = process.env.JWT_SECRET as string;

      const verificationPayload = {
        name,
        email,
        password: hashedPassword,
        role,
        phone,
        license_number,
        vehicle_plate,
        vehicle_model,
        vehicle_capacity,
      };

      const token = jwt.sign(verificationPayload, SECRET, { expiresIn: '15m' });
      const url = `http://localhost:3000/api/auth/verify?token=${token}`;

      const htmlEmail = `
        <div style="font-family: Arial, sans-serif; text-align: center; color: #333; padding: 20px;">
            <h2 style="color: #16a34a;">Welcome to BusLink!</h2>
            <p>Hi <strong>${name}</strong>,</p>
            <p>Thank you for joining <strong>BusLink</strong> – the platform for real-time bus tracking.</p>
            <p>To get started, please verify your email address by clicking the button below:</p>
            <a href="${url}" style="display: inline-block; margin: 20px 0; padding: 14px 28px; font-size: 16px; color: #fff; background-color: #16a34a; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email</a>
            <p style="font-size: 14px; color: #777;">This link will expire in 15 minutes.</p>
            <hr style="margin: 30px 0; border-color: #e5e7eb;">
            <p style="font-size: 12px; color: #999;">If you did not register for BusLink, please ignore this email.</p>
        </div>
        `;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify your email for BusLink!',
        html: htmlEmail,
      });

      // FIX: Added return statement
      return res.status(201).json({ message: 'Verification email sent successfully.' });
    } catch (err) {
      logger.error('Signup error:', err);
      // FIX: Added return statement
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Verify the email token, create the user, and show a success page.
   */
  async verify(req: AuthRequest, res: Response) {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Token is required' });
    }

    try {
      const SECRET = process.env.JWT_SECRET as string;
      const decoded = jwt.verify(token, SECRET) as any;

      const { name, email, password, role, phone, license_number, vehicle_plate, vehicle_model, vehicle_capacity, bus_number } = decoded;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).send('<h1>Error</h1><p>This email is already registered. Please log in.</p>');
      }

      // If the role is 'driver', we need to check vehicle info BEFORE creating the user
      // to ensure the transaction can complete.
      if (role === 'driver') {
        if (!license_number || !vehicle_plate || !bus_number) {
          logger.error(`Driver registration for ${email} failed: missing license, plate, or bus number.`);
          return res.status(400).json({ message: 'Driver and Bus information is incomplete. License number, vehicle plate, and bus number are required.' });
        }
      }

      // We will use a transaction to ensure that if any step fails, all steps are rolled back.
      // This is crucial for creating a user, driver, and bus together.
      await prisma.$transaction(async (tx) => {
        // Step 1: Create the User
        const user = await tx.user.create({
          data: {
            name,
            email,
            password, // This is already hashed
            role: role as Role,
            phone,
            isEmailVerified: true,
          },
        });

        // Step 2: If the role is 'driver', create the associated profiles
        if (role === 'driver') {
          
          // Step 2a: Create the Driver profile, linked to the User
          const driver = await tx.driver.create({
            data: {
              userId: user.id,
              name,
              phone: phone || '', // Driver phone is mandatory in the new schema
              licenseNumber: license_number,
              isVerified: false, // Admin should verify drivers later
            },
          });

          // Step 2b: Create the Bus, linked to the Driver
          // We'll assign it to a default/unassigned route for now.
          // Let's ensure a default route exists or create one.
          let defaultRoute = await tx.route.findFirst({ where: { name: 'Unassigned' } });
          if (!defaultRoute) {
            defaultRoute = await tx.route.create({
              data: {
                name: 'Unassigned',
                description: 'Default route for newly registered buses.',
                isActive: false,
              }
            });
          }

          await tx.bus.create({
            data: {
              busNumber: bus_number,
              vehiclePlate: vehicle_plate,
              vehicleModel: vehicle_model,
              capacity: vehicle_capacity || 30, // Default capacity
              routeId: defaultRoute.id, // Assign to the default route
              driverId: driver.id,      // Link the new Bus to the new Driver
            },
          });
        }
      });

      const successHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head><title>Email Verified Successfully</title><style>body{font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background-color:#f3f4f6}.container{background:white;padding:2rem;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,.1);text-align:center;max-width:400px}.success-icon{color:#10b981;font-size:48px;margin-bottom:1rem}h1{color:#1f2937;margin-bottom:1rem}p{color:#6b7280;margin-bottom:2rem;line-height:1.5}.btn{background-color:#2563eb;color:white;padding:12px 24px;border:none;border-radius:6px;font-size:16px;cursor:pointer;text-decoration:none;display:inline-block;transition:background-color .3s}.btn:hover{background-color:#1d4ed8}</style><script>setTimeout(()=>{window.location.href='http://localhost:8080/login'},3e3)</script></head>
      <body><div class="container"><div class="success-icon">✓</div><h1>Email Verified Successfully!</h1><p>Your BusLink account has been created. You can now log in.</p><p>You will be redirected to the login page automatically in 3 seconds...</p><a href="http://localhost:8080/login" class="btn">Go to Login Page Now</a></div></body>
      </html>`;
      // FIX: res.send implicitly returns, but making it explicit is better practice.
      res.send(successHtml);
      return;

    } catch (err: any) {
      logger.error('Verification error:', err);
      if (err.name === 'TokenExpiredError') {
        return res.status(400).send('<h1>Error</h1><p>This verification link has expired. Please try signing up again.</p>');
      }
      return res.status(400).send('<h1>Error</h1><p>This verification link is invalid. Please try signing up again.</p>');
    }
  }

  /**
   * Log in a user.
   */
  async login(req: AuthRequest, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      if (!user.isEmailVerified) {
        return res.status(401).json({ message: 'Email not verified' });
      }

      const SECRET = process.env.JWT_SECRET as string;

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        SECRET,
        { expiresIn: '1h' }
      );

      const { password: _, ...userData } = user;

      return res.json({ token, user: userData });
    } catch (err) {
      logger.error('Login error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  /**
   * Get the profile of the currently authenticated user.
   */
  async me(req: AuthRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'No token provided or user not found' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true, name: true, email: true, role: true, phone: true,
          isEmailVerified: true, isActive: true, createdAt: true, updatedAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json(user);
    } catch (err) {
      logger.error('Get profile error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async logout(req: AuthRequest, res: Response) {
    return res.status(200).json({ message: 'Logged out successfully.' });
  }
}