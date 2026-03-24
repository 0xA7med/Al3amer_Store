/**
 * Utility to parse and normalize video URLs into embeddable iframe URLs.
 * Handles YouTube and Facebook formats to prevent X-Frame-Options errors.
 */
export const getEmbedUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;

    try {
        // Handle YouTube
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            let videoId = '';
            
            if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1]?.split('?')[0];
            } else if (url.includes('watch?v=')) {
                videoId = new URL(url).searchParams.get('v') || '';
            } else if (url.includes('embed/')) {
                return url; // Already an embed URL
            }

            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}`;
            }
        }

        // Handle Facebook
        if (url.includes('facebook.com') || url.includes('fb.watch')) {
            return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560`;
        }

        // Return original if unrecognized, but it might not work in cross-origin iframes
        return url;
    } catch (e) {
        console.error('Error parsing video URL:', e);
        return url;
    }
};
