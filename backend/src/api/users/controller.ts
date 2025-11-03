import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import prisma from '@/config/prisma';
import AppError from '@/utils/AppError';
import { AuthRequest } from '@/types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail } from '@/services/email';

export class UserController {
  /**
   * Invite a new HOSPITAL ADMIN to the platform.
   * This is a protected action for System Admins only.
   */
  async inviteHospitalAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, fullName } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return next(new AppError('A user with this email already exists.', 409));
      }

      // Generate a temporary password for the invitee
      const hashedPassword = await bcrypt.hash('Password123!', 12);

      // Create a verification token payload, securely setting the role
      const verificationPayload = {
        email, password: hashedPassword, role: Role.HOSPITAL_ADMIN, // The role is explicitly and securely set here
      };

      const token = jwt.sign(verificationPayload, process.env.JWT_SECRET!, { expiresIn: '24h' });

      await sendVerificationEmail(fullName, email, token);

      res.status(200).json({ status: 'success', message: `Invitation for HOSPITAL_ADMIN sent to ${email}.` });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Invite a new staff member (Doctor or Receptionist) to a hospital.
   * This is initiated by a logged-in Hospital Admin.
   */
  async inviteStaff(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, role, fullName } = req.body as { email: string, role: Role, fullName: string };
      const hospitalAdminId = req.user!.id;
      
      // Validate the role being assigned
      if (role !== Role.DOCTOR && role !== Role.RECEPTIONIST) {
          return next(new AppError('Invalid role. Can only invite DOCTOR or RECEPTIONIST.', 400));
      }

      // Find the admin's hospital
      const hospital = await prisma.hospital.findUnique({ where: { adminId: hospitalAdminId } });
      if (!hospital) {
        return next(new AppError('Hospital admin profile not found.', 404));
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return next(new AppError('A user with this email already exists.', 409));
      }
      
      const hashedPassword = await bcrypt.hash('Password123!', 12);
      
      const verificationPayload = {
        email, password: hashedPassword, role, hospitalId: hospital.id, // Link new staff to the admin's hospital
      };
      
      const token = jwt.sign(verificationPayload, process.env.JWT_SECRET!, { expiresIn: '24h' });

      await sendVerificationEmail(fullName, email, token);

      res.status(200).json({ status: 'success', message: `Invitation for ${role} sent to ${email}.` });
    } catch (error) {
      next(error);
    }
  }

  // Upload Avatar
  async uploadAvatar(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: userIdToUpdate } = req.params;
      const requesterId = req.user!.id;

      // Authorization: User can update their own avatar, or an admin can.
      if (userIdToUpdate !== requesterId && req.user!.role !== 'ADMIN') {
        return next(new AppError('You are not authorized to perform this action.', 403));
      }

      if (!req.file) {
        return next(new AppError('No file uploaded.', 400));
      }

      const avatarUrl = req.file.path; // This comes from Cloudinary storage
      await prisma.user.update({
        where: { id: userIdToUpdate },
        data: { avatarUrl }
      });

      res.status(200).json({ status: 'success', data: { avatarUrl } });
    } catch (error) {
      next(error);
    }
  }

  // Resend an invitation email
  async resendInvite(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, fullName } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return next(new AppError('User not found.', 404));
      }
      if (user.isEmailVerified) {
        return next(new AppError('This user is already verified.', 400));
      }

      // Re-generate a token. You might need more info for this, like hospitalId
      // This is a simplified version.
      const verificationPayload = { email: user.email, role: user.role };
      const token = jwt.sign(verificationPayload, process.env.JWT_SECRET!, { expiresIn: '7d' });
      await sendVerificationEmail(fullName, user.email, token);

      res.status(200).json({ status: 'success', message: 'Invitation email resent successfully.' });
    } catch (error) {
      next(error);
    }
  }
}