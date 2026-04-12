/**
 * Extracts the YouTube video ID from various URL formats.
 * Supports:
 *   - https://www.youtube.com/watch?v=XXXX
 *   - https://youtu.be/XXXX
 *   - https://youtube.com/embed/XXXX
 *   - https://www.youtube.com/shorts/XXXX
 */
export function extractYouTubeId(url: string): string | null {
    if (!url) return null;

    const patterns = [
        /[?&]v=([a-zA-Z0-9_-]{11})/,           // watch?v=
        /youtu\.be\/([a-zA-Z0-9_-]{11})/,        // youtu.be/
        /embed\/([a-zA-Z0-9_-]{11})/,             // /embed/
        /shorts\/([a-zA-Z0-9_-]{11})/,            // /shorts/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match?.[1]) return match[1];
    }

    return null;
}

export function buildEmbedUrl(videoId: string): string {
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
}
