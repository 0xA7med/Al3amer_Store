/**
 * Optimizes Cloudinary image URLs for better LCP (Largest Contentful Paint) performance.
 * Supports both fresh URLs and already-transformed Cloudinary URLs (overrides the width).
 *
 * @param url The original image URL
 * @param width The target width to scale the image to (defaults to 800px)
 * @returns The optimized Cloudinary URL, or the original URL if not a Cloudinary link
 */
export function optimizeImage(url: string | null | undefined, width: number = 800): string {
    if (!url) return '';

    if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
        return url;
    }

    // If URL already has transformations, override the width parameter
    if (url.includes('/upload/c_limit,w_')) {
        return url.replace(/\/upload\/c_limit,w_\d+/, `/upload/c_limit,w_${width}`);
    }
    if (url.includes('/upload/c_') || url.includes('/upload/w_') || url.includes('/upload/q_')) {
        // Already has transformations but not in our format — append our transforms
        return url.replace('/upload/', `/upload/c_limit,w_${width},q_auto,f_auto/`);
    }

    // Fresh URL — inject transformations
    return url.replace('/upload/', `/upload/c_limit,w_${width},q_auto,f_auto/`);
}

/**
 * Generates a srcset string for responsive Cloudinary images.
 * Usage: <img srcSet={buildSrcset(url)} sizes="(max-width: 768px) 200px, 400px" />
 *
 * @param url The original Cloudinary image URL
 * @param widths Array of widths for the srcset
 * @returns A srcset string or empty string if not Cloudinary
 */
export function buildSrcset(url: string | null | undefined, widths: number[] = [200, 400, 800]): string {
    if (!url || !url.includes('res.cloudinary.com')) return '';
    return widths.map(w => `${optimizeImage(url, w)} ${w}w`).join(', ');
}
