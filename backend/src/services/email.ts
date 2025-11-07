// utils/email.ts

import nodemailer from 'nodemailer';
import 'dotenv/config';

// Ensure email credentials are defined
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error("FATAL ERROR: Email credentials (EMAIL_USER, EMAIL_PASS) are not defined in the .env file.");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email transporter is configured correctly and ready to send messages.');
  }
});

export const sendVerificationEmail = async (name: string, email: string, token: string) => {
  const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:8080';
  const url = `${frontendUrl.replace(/\/$/, '')}/login?verifyToken=${token}`;

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
};

export const sendPasswordResetOTP = async (name: string, email: string, otp: string) => {
  const htmlEmail = `
    <div style="font-family: Arial, sans-serif; text-align: center; color: #333; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px; margin: auto;">
        <h2 style="color: #16a34a;">Password Reset Request</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>We received a request to reset your password for your BusLink Rwanda account.</p>
        <p>Your One-Time Password (OTP) is:</p>
        <h3 style="color: #16a34a; font-size: 28px; letter-spacing: 3px; margin: 25px 0; padding: 10px 20px; background-color: #f0f8ff; border-radius: 8px;">${otp}</h3>
        <p>Please enter this OTP on the password reset page to continue. This OTP is valid for 10 minutes.</p>
        <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #999;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"BusLink Rwanda" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: email,
    subject: 'BusLink Rwanda: Your Password Reset OTP',
    html: htmlEmail,
  });
};

export default transporter;