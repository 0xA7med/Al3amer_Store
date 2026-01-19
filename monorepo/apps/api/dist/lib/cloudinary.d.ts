import { v2 as cloudinary } from 'cloudinary';
/**
 * Uploads a base64 image string to Cloudinary
 * @param base64Image The image data URL (e.g., data:image/png;base64,...)
 * @param folder The folder in cloudinary to store the image
 * @returns The secure URL of the uploaded image
 */
export declare function uploadToCloudinary(base64Image: string, folder?: string): Promise<string>;
export default cloudinary;
//# sourceMappingURL=cloudinary.d.ts.map