/**
 * App Sync and Cache Buster Utility
 * Ensures standalone mobile PWA clients can force-refresh and purge stale service worker caches.
 */

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

// Expose globally for quick debugging or console triggers
if (typeof window !== 'undefined') {
  (window as any).forceAppSync = forceAppSync;
}
