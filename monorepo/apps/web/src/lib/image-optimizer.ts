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

    // Use aggressive auto-quality and forced modern format (webp/avif)
    const transforms = `c_scale,w_${width},q_auto:eco,f_auto`;

    // If URL already has transformations, replace the entire segment
    if (url.includes('/upload/')) {
        const parts = url.split('/upload/');
        // Find if there's an intermediate segment before the filename
        const filenameIndex = parts[1].indexOf('/');
        if (filenameIndex !== -1) {
            // Has transformations — replace them
            return `${parts[0]}/upload/${transforms}/${parts[1].substring(filenameIndex + 1)}`;
        }
        // No transformations — inject them
        return `${parts[0]}/upload/${transforms}/${parts[1]}`;
    }

    return url;
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
