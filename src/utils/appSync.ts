/**
 * App Sync and Cache Buster Utility
 * Ensures standalone mobile PWA clients can force-refresh and purge stale service worker caches.
 */

export const CURRENT_APP_VERSION = '5.14.1';

export async function forceAppSync(): Promise<void> {
  console.log('[AppSync] Initiating force app sync & cache clear...');
  try {
    // 1. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
        console.log('[AppSync] ServiceWorker unregistered:', reg.scope);
      }
    }

    // 2. Delete all CacheStorage entries
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      for (const key of cacheKeys) {
        await caches.delete(key);
        console.log('[AppSync] Cache deleted:', key);
      }
    }
  } catch (err) {
    console.warn('[AppSync] Cache wipe non-fatal error:', err);
  }

  // 3. Clear version markers
  try {
    sessionStorage.clear();
  } catch {
    // ignore
  }

  // 4. Force hard reload bypassing cache
  const cleanUrl = window.location.origin + window.location.pathname + '?sync=' + Date.now();
  window.location.href = cleanUrl;
}

export function setupAutoUpdater(): void {
  if (typeof window === 'undefined') return;

  const checkVersion = async () => {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.version && data.version !== CURRENT_APP_VERSION) {
        // Prevent infinite reload loop within 15 seconds
        const lastSync = sessionStorage.getItem('last_version_sync_time');
        const now = Date.now();
        if (lastSync && now - Number(lastSync) < 15000) {
          return;
        }
        sessionStorage.setItem('last_version_sync_time', String(now));
        console.log(`[AutoUpdater] New version detected: ${data.version} (current: ${CURRENT_APP_VERSION}). Updating...`);
        await forceAppSync();
      }
    } catch {
      // offline or network hiccup, ignore
    }
  };

  // Check on visibility change (when user returns to the app from another tab or WhatsApp)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkVersion();
    }
  });

  // Check on focus
  window.addEventListener('focus', () => {
    checkVersion();
  });

  // Check once after initial load
  setTimeout(checkVersion, 2000);
}

// Expose globally for quick debugging or console triggers
if (typeof window !== 'undefined') {
  (window as any).forceAppSync = forceAppSync;
  setupAutoUpdater();
}
