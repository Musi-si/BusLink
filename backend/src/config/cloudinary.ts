import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import 'dotenv/config'

// Ensure Cloudinary environment variables are set
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("FATAL ERROR: Cloudinary credentials are not defined in the .env file.")
    process.exit(1)
}

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Use HTTPS
})

// Define the storage engine for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    // Define folder and format for uploaded files
    folder: 'buslink-rwanda', // You can change this folder name
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    // Optional: transformation to apply to all uploaded images
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  } as any, // Use 'as any' to bypass a known minor type mismatch in the library
})

export { cloudinary, storage }