import { v2 as cloudinary } from 'cloudinary';

// Check if credentials are present
const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export class CloudinaryService {
  /**
   * Upload an image buffer to Cloudinary or fallback to Base64 representation.
   */
  static async uploadAvatar(fileBuffer: Buffer, mimeType: string): Promise<string> {
    if (!isCloudinaryConfigured) {
      console.log('[Cloudinary Service] Credentials not supplied. Falling back to local data URI.');
      const base64Data = fileBuffer.toString('base64');
      return `data:${mimeType};base64,${base64Data}`;
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'pocketpilot_avatars',
          allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
          transformation: [{ width: 250, height: 250, crop: 'thumb', gravity: 'face' }]
        },
        (error, result) => {
          if (error) {
            console.error('[Cloudinary Upload Error]', error);
            reject(error);
          } else {
            resolve(result?.secure_url || '');
          }
        }
      );
      uploadStream.end(fileBuffer);
    });
  }
}
