/**
 * Smart Mobile Photo Compression & Video Processing
 * Compresses heavy smartphone camera photos (8MB–20MB) down to ~300KB–600KB
 * preserving crisp visual fidelity and enabling instant <1s uploads on mobile networks.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  originalFormatted: string;
  compressedFormatted: string;
  reductionPercent: number;
  format: 'webp' | 'jpeg';
  width: number;
  height: number;
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export async function compressImageWithStats(
  file: File | Blob,
  maxWidth: number = 1280,
  maxHeight: number = 1280,
  quality: number = 0.82
): Promise<CompressionResult> {
  return new Promise((resolve) => {
    const originalSizeBytes = file.size || 0;
    const reader = new FileReader();

    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) {
        resolve({
          dataUrl: '',
          originalSizeBytes,
          compressedSizeBytes: 0,
          originalFormatted: formatBytes(originalSizeBytes),
          compressedFormatted: '0 KB',
          reductionPercent: 0,
          format: 'jpeg',
          width: 0,
          height: 0,
        });
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;

          // Adaptive scaling: cap maximum dimensions for crispness without bloated megabytes
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              dataUrl: rawDataUrl,
              originalSizeBytes,
              compressedSizeBytes: originalSizeBytes,
              originalFormatted: formatBytes(originalSizeBytes),
              compressedFormatted: formatBytes(originalSizeBytes),
              reductionPercent: 0,
              format: 'jpeg',
              width,
              height,
            });
            return;
          }

          // Use high-quality bicubic smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Try modern WebP first if supported (up to 30% smaller than JPEG), fallback to JPEG
          let chosenFormat: 'webp' | 'jpeg' = 'jpeg';
          let compressed = '';

          try {
            const webpData = canvas.toDataURL('image/webp', quality);
            if (webpData.startsWith('data:image/webp')) {
              compressed = webpData;
              chosenFormat = 'webp';
            }
          } catch {}

          if (!compressed) {
            compressed = canvas.toDataURL('image/jpeg', quality);
            chosenFormat = 'jpeg';
          }

          // Compute compressed size from base64 string
          const base64Str = compressed.split(',')[1] || '';
          const compressedSizeBytes = Math.round((base64Str.length * 3) / 4);

          const reductionPercent =
            originalSizeBytes > 0 && compressedSizeBytes < originalSizeBytes
              ? Math.round(((originalSizeBytes - compressedSizeBytes) / originalSizeBytes) * 100)
              : 0;

          resolve({
            dataUrl: compressed,
            originalSizeBytes,
            compressedSizeBytes,
            originalFormatted: formatBytes(originalSizeBytes),
            compressedFormatted: formatBytes(compressedSizeBytes),
            reductionPercent,
            format: chosenFormat,
            width,
            height,
          });
        } catch (err) {
          console.warn('[imageCompressor] Canvas compression failed, using original', err);
          resolve({
            dataUrl: rawDataUrl,
            originalSizeBytes,
            compressedSizeBytes: originalSizeBytes,
            originalFormatted: formatBytes(originalSizeBytes),
            compressedFormatted: formatBytes(originalSizeBytes),
            reductionPercent: 0,
            format: 'jpeg',
            width: img.width,
            height: img.height,
          });
        }
      };

      img.onerror = () => {
        resolve({
          dataUrl: rawDataUrl,
          originalSizeBytes,
          compressedSizeBytes: originalSizeBytes,
          originalFormatted: formatBytes(originalSizeBytes),
          compressedFormatted: formatBytes(originalSizeBytes),
          reductionPercent: 0,
          format: 'jpeg',
          width: 0,
          height: 0,
        });
      };

      img.src = rawDataUrl;
    };

    reader.onerror = () => {
      resolve({
        dataUrl: '',
        originalSizeBytes,
        compressedSizeBytes: 0,
        originalFormatted: formatBytes(originalSizeBytes),
        compressedFormatted: '0 KB',
        reductionPercent: 0,
        format: 'jpeg',
        width: 0,
        height: 0,
      });
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Backward-compatible helper that returns just the compressed dataUrl string.
 */
export async function compressImage(
  file: File | Blob,
  maxWidth: number = 1280,
  maxHeight: number = 1280,
  quality: number = 0.82
): Promise<string> {
  const res = await compressImageWithStats(file, maxWidth, maxHeight, quality);
  return res.dataUrl;
}

/**
 * Extracts a high quality frame from a video file/blob to use as an instant keepsake poster,
 * and measures the duration in seconds.
 */
export async function extractVideoThumbnail(
  file: File | Blob,
  seekTime: number = 0.5
): Promise<{ thumbnailUrl: string; duration: number }> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({ thumbnailUrl: '', duration: 0 });
      return;
    }

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const blobUrl = URL.createObjectURL(file);
    video.src = blobUrl;

    let hasResolved = false;
    const cleanup = () => {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {}
    };

    const timeout = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        resolve({ thumbnailUrl: '/assets/garden/card_archive.jpg', duration: video.duration || 0 });
      }
    }, 6000);

    video.onloadedmetadata = () => {
      const targetTime = Math.min(seekTime, (video.duration || 1) / 2);
      video.currentTime = targetTime;
    };

    video.onseeked = () => {
      if (hasResolved) return;
      hasResolved = true;
      clearTimeout(timeout);

      try {
        const canvas = document.createElement('canvas');
        const targetWidth = Math.min(video.videoWidth || 640, 800);
        const ratio = (video.videoHeight || 360) / (video.videoWidth || 640);
        canvas.width = targetWidth;
        canvas.height = Math.round(targetWidth * (isNaN(ratio) || ratio <= 0 ? 0.75 : ratio));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);
          cleanup();
          resolve({ thumbnailUrl, duration: video.duration || 0 });
          return;
        }
      } catch (err) {
        console.warn('[extractVideoThumbnail] Failed to capture video frame:', err);
      }
      cleanup();
      resolve({ thumbnailUrl: '/assets/garden/card_archive.jpg', duration: video.duration || 0 });
    };

    video.onerror = () => {
      if (!hasResolved) {
        hasResolved = true;
        clearTimeout(timeout);
        cleanup();
        resolve({ thumbnailUrl: '/assets/garden/card_archive.jpg', duration: 0 });
      }
    };
  });
}
