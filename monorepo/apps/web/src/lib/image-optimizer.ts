/**
 * Optimizes Cloudinary image URLs for better LCP (Largest Contentful Paint) performance.
 * 
 * @param url The original image URL
 * @param width The target width to scale the image to (defaults to 800px)
 * @returns The optimized Cloudinary URL, or the original URL if not a Cloudinary link
 */
export function optimizeImage(url: string | null | undefined, width: number = 800): string {
    if (!url) return '';
    
    // Check if it's a Cloudinary URL
    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
        // If it already has transformations, don't double apply (basic check)
        if (url.includes('/upload/c_') || url.includes('/upload/w_') || url.includes('/upload/q_')) {
            return url;
        }
        
        // Inject Cloudinary transformations for auto format, auto quality, and specific width
        // Using c_limit instead of c_scale so we don't upscale small images
        return url.replace('/upload/', `/upload/c_limit,w_${width},q_auto,f_auto/`);
    }
    
    return url;
}
