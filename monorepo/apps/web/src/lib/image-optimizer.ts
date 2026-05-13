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

    const transforms = `c_limit,w_${width},q_auto:eco,f_auto`;

    // 1. If it's already a standard Cloudinary URL
    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
        const parts = url.split('/upload/');
        const filenameIndex = parts[1].indexOf('/');
        if (filenameIndex !== -1) {
            // Has transformations — replace them
            return `${parts[0]}/upload/${transforms}/${parts[1].substring(filenameIndex + 1)}`;
        }
        // No transformations — inject them
        return `${parts[0]}/upload/${transforms}/${parts[1]}`;
    }

    // 2. If it's an external URL (like ImgBB or other HTTP links)
    // We use Cloudinary's powerful 'fetch' API to compress ANY image on the web!
    if (url.startsWith('http://') || url.startsWith('https://')) {
        // Exclude local dev URLs or already fetched URLs to avoid double-fetching
        if (!url.includes('localhost') && !url.includes('image/fetch')) {
            const CLOUD_NAME = 'dupkphrlw'; // Target cloud name
            return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/${transforms}/${encodeURI(url)}`;
        }
    }

    // Fallback for local assets or unknown formats
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
