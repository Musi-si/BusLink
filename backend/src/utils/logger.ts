import winston from 'winston';
import path from 'path';
import fs from 'fs';

// --- Create logs directory if it doesn't exist ---
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// --- Determine environment ---
const isProduction = process.env.NODE_ENV === 'production';

// --- Define log formats ---
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }), // Log the full stack trace on errors
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    const logMessage = stack || message;
    return `[${timestamp}] ${level}: ${logMessage}`;
  })
);

const transports: winston.transport[] = [
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: fileFormat,
  }),
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    format: fileFormat,
  }),
];

if (!isProduction) {
  transports.push(new winston.transports.Console({
    format: consoleFormat,
  }));
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'buslink-api' },
  transports
});

export default logger;