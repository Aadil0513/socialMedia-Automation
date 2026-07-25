import { v2 as cloudinary } from "cloudinary";
import { Readable } from 'stream';
import dotenv from "dotenv";

dotenv.config();

// 1. Cloudinary initialization
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const cloudinaryUploader = cloudinary.uploader;

// 2. Helper function to upload Multer Memory Buffer to Cloudinary
export const uploadBufferToCloudinary = (fileBuffer, mimetype) => {
  return new Promise((resolve, reject) => {
    const isVideo = mimetype.startsWith('video');
    const resourceType = isVideo ? 'video' : 'image';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'facebook_automation',
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    // Stream memory buffer directly to Cloudinary
    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

export { cloudinary, cloudinaryUploader };