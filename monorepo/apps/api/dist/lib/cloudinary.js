import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
/**
 * Uploads a base64 image string to Cloudinary
 * @param base64Image The image data URL (e.g., data:image/png;base64,...)
 * @param folder The folder in cloudinary to store the image
 * @returns The secure URL of the uploaded image
 */
export async function uploadToCloudinary(base64Image, folder = 'al3amer-products') {
    try {
        const result = await cloudinary.uploader.upload(base64Image, {
            folder,
            resource_type: 'auto',
        });
        return result.secure_url;
    }
    catch (error) {
        console.error('Cloudinary Upload Error:', error);
        throw new Error('Failed to upload image to Cloudinary');
    }
}
export default cloudinary;
//# sourceMappingURL=cloudinary.js.map