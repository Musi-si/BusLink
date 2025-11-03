import { z } from 'zod';

// Schema for public patient signup and invitation completion
export const signupSchema = z.object({
  body: z.object({
    fullName: z.string().min(3, 'Full name must be at least 3 characters long'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits')
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string(),
  }),
});

// New schema for forgot password request
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

// New schema for OTP verification
export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
  }),
});

// New schema for password reset
export const resetPasswordSchema = z.object({
  body: z.object({
    passwordResetToken: z.string(), // This is the JWT from verify-otp
    newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
  }),
});

// New schema for changing password by logged-in user
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
  }),
});