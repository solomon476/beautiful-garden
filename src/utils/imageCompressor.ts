/**
 * Helper to compress image files before storing in localStorage or Supabase
 * Keeps file size under ~200KB while preserving visual clarity.
 */
export async function compressImage(
  file: File | Blob,
  maxWidth: number = 1280,
  maxHeight: number = 1280,
  quality: number = 0.82
): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) {
        resolve('');
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;

          // Calculate scaled dimensions
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
            resolve(rawDataUrl);
            return;
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch (err) {
          console.warn('[imageCompressor] Canvas compression failed, using original', err);
          resolve(rawDataUrl);
        }
      };

      img.onerror = () => {
        // Fallback to raw data url if image cannot be rendered to canvas
        resolve(rawDataUrl);
      };

      img.src = rawDataUrl;
    };

    reader.onerror = () => {
      resolve('');
    };

    reader.readAsDataURL(file);
  });
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

