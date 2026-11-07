import React from 'react';

/**
 * Spotify Integration Utilities for Perfect Time
 * Allows adding songs directly from Spotify with instant oEmbed metadata extraction,
 * clean URL parsing, and 1-tap mobile/desktop deep-linking.
 */

export interface SpotifyTrackMeta {
  title?: string;
  artist?: string;
  thumbnailUrl?: string;
  embedHtml?: string;
}

/**
 * Checks if a URL or URI points to Spotify
 */
export function isSpotifyUrl(url?: string | null): boolean {
  if (!url) return false;
  return /spotify\.com|spotify:track/i.test(url);
}

/**
 * Extracts the 22-character Spotify track ID from any URL or URI
 */
export function extractSpotifyTrackId(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:track\/|spotify:track:)([a-zA-Z0-9]{22})/);
  return match ? match[1] : null;
}

/**
 * Cleans Spotify tracking parameters (?si=... &utm_source=...)
 */
export function getCleanSpotifyUrl(url: string): string {
  const trackId = extractSpotifyTrackId(url);
  if (trackId) {
    return `https://open.spotify.com/track/${trackId}`;
  }
  return url;
}

/**
 * Generates direct URI to open the native Spotify app on iOS/Android/Desktop
 */
export function getSpotifyAppUri(url: string): string {
  const trackId = extractSpotifyTrackId(url);
  if (trackId) {
    return `spotify:track:${trackId}`;
  }
  return url;
}

/**
 * Opens Spotify in native app or web browser
 */
export function openSpotifyApp(query?: string): void {
  const cleanQuery = query?.trim();
  const url = cleanQuery
    ? `https://open.spotify.com/search/${encodeURIComponent(cleanQuery)}`
    : 'https://open.spotify.com';
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Opens Spotify search directly in app or browser tab
 */
export function openSpotifySearch(query: string): void {
  openSpotifyApp(query);
}

/**
 * Fetches official track title and album cover thumbnail via Spotify's universal public oEmbed API.
 * Requires NO API key and supports universal open CORS.
 */
export async function fetchSpotifyOEmbed(url: string): Promise<SpotifyTrackMeta | null> {
  const cleanUrl = getCleanSpotifyUrl(url);
  if (!cleanUrl.includes('open.spotify.com/track/')) {
    return null;
  }

  try {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(cleanUrl)}`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title,
      artist: data.author_name,
      thumbnailUrl: data.thumbnail_url,
      embedHtml: data.html,
    };
  } catch (err) {
    console.warn('Failed to fetch Spotify oEmbed:', err);
    return null;
  }
}

/**
 * Spotify SVG Icon
 */
export const SpotifyIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className = 'w-4 h-4',
  style,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.307c-.215.352-.676.465-1.028.25-2.817-1.722-6.363-2.112-10.539-1.157-.402.092-.803-.16-.895-.562-.092-.403.16-.803.562-.895 4.571-1.045 8.492-.596 11.65 1.336.352.215.465.676.25 1.028zm1.47-3.266c-.27.44-.848.58-1.288.31-3.225-1.982-8.14-2.557-11.956-1.399-.496.15-1.023-.134-1.173-.63-.15-.496.134-1.023.63-1.173 4.364-1.324 9.791-.685 13.477 1.58.44.27.58.848.31 1.288zm.126-3.41c-3.868-2.296-10.25-2.508-13.935-1.389-.593.18-1.222-.16-1.402-.754-.18-.593.16-1.222.754-1.402 4.24-1.287 11.29-1.037 15.733 1.601.533.316.708 1.01.392 1.543-.316.533-1.01.708-1.542.401z" />
  </svg>
);

/**
 * Embedded Spotify Player (Official Iframe)
 * Allows playing directly inside Sound Garden without navigating away.
 */
export const SpotifyEmbedPlayer: React.FC<{
  url?: string;
  height?: number;
  className?: string;
}> = ({ url, height = 80, className = '' }) => {
  const trackId = extractSpotifyTrackId(url);
  if (!trackId) return null;

  return (
    <div className={`w-full rounded-2xl overflow-hidden shadow-md border border-emerald-500/25 bg-[#0e0e14] ${className}`}>
      <iframe
        src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
        width="100%"
        height={height}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title="Spotify Track Player"
        style={{ borderRadius: '16px', display: 'block', border: 'none' }}
      />
    </div>
  );
};
