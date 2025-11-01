// utils/email.ts

import nodemailer, { Transporter } from 'nodemailer';

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error("FATAL ERROR: Email credentials (EMAIL_USER, EMAIL_PASS) are not defined in the .env file.");
  process.exit(1);
}

const transporter: Transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// FIX: Prefixed unused `success` parameter with an underscore
transporter.verify((error, _success) => {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email transporter is configured correctly and ready to send messages.');
  }
});

export default transporter;