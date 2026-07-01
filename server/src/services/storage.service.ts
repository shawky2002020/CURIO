import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

/**
 * Storage Service.
 * In production, this uploads files to Cloudinary, AWS S3, or Google Cloud Storage.
 */
export const uploadFile = async (filePath: string): Promise<string> => {
  // TODO: Implement cloud upload
  return 'https://example.com/uploads/avatar_mock.png';
};

/**
 * Uploads a file buffer directly to Cloudinary using an upload stream.
 */
export const uploadFileBuffer = async (buffer: Buffer, folder = 'curio'): Promise<string> => {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new ApiError(500, 'Cloudinary credentials are not configured on the server.', 'CLOUDINARY_NOT_CONFIGURED');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          return reject(new ApiError(500, `Cloudinary upload failed: ${error.message}`, 'UPLOAD_FAILED'));
        }
        if (!result) {
          return reject(new ApiError(500, 'Cloudinary upload response was empty.', 'UPLOAD_FAILED'));
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
};

export default uploadFile;

