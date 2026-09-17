/**
 * Helper utilities to detect and format video URLs (YouTube, Vimeo, direct MP4/WebM).
 */

export function getYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  const match = cleanUrl.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  return match ? match[1] : null;
}

export function getVimeoVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  const match = cleanUrl.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  return match ? match[1] : null;
}

export function isYouTubeUrl(url: string | null | undefined): boolean {
  return !!getYouTubeVideoId(url);
}

export function isVimeoUrl(url: string | null | undefined): boolean {
  return !!getVimeoVideoId(url);
}

export function isEmbeddableVideoUrl(url: string | null | undefined): boolean {
  return isYouTubeUrl(url) || isVimeoUrl(url);
}

export function getYouTubeEmbedUrl(
  videoId: string,
  options?: {
    autoplay?: boolean;
    mute?: boolean;
    loop?: boolean;
    controls?: boolean;
  }
): string {
  const autoplay = options?.autoplay !== false ? 1 : 0;
  const mute = options?.mute ? 1 : 0;
  const controls = options?.controls !== false ? 1 : 0;
  const loop = options?.loop ? `&loop=1&playlist=${videoId}` : "";
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplay}&mute=${mute}&controls=${controls}&rel=0&modestbranding=1&playsinline=1${loop}`;
}

export function getVimeoEmbedUrl(
  vimeoId: string,
  options?: {
    autoplay?: boolean;
    mute?: boolean;
    loop?: boolean;
    controls?: boolean;
  }
): string {
  const autoplay = options?.autoplay !== false ? 1 : 0;
  const mute = options?.mute ? 1 : 0;
  const controls = options?.controls !== false ? 1 : 0;
  const loop = options?.loop ? 1 : 0;
  return `https://player.vimeo.com/video/${vimeoId}?autoplay=${autoplay}&muted=${mute}&controls=${controls}&loop=${loop}`;
}

export function getVideoThumbnail(url: string | null | undefined): string | null {
  const ytId = getYouTubeVideoId(url);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
  }
  return null;
}
