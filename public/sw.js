const CACHE_NAME = 'perfect-time-v13';

// Core shell assets for instant load (DO NOT precache HTML so navigation is always fresh)
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/icon.svg',
];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Precache non-critical failure:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Stale-while-revalidate or Network-first strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Do not intercept non-GET, API, Supabase, version.json, or external streams
  if (
    event.request.method !== 'GET' ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('spotify.com') ||
    url.pathname.startsWith('/api') ||
    url.pathname === '/version.json'
  ) {
    return;
  }

  // 1. Always NETWORK-FIRST for HTML / page navigation so fresh deploys load immediately on mobile!
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((res) => res || caches.match('/index.html') || caches.match('/')))
    );
    return;
  }

  // 2. For static assets (images, icons, css, js), use cache-first with network fallback
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico|css|js|woff2)$/i)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Default fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// Push notification event for OS-level lock screen notifications
self.addEventListener('push', (event) => {
  let title = 'Perfect Time 🌷';
  let body = 'A sweet whisper in our private garden ♡';
  let targetUrl = '/';

  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      body = data.body || body;
      targetUrl = data.url || targetUrl;
    } catch {
      body = event.data.text() || body;
    }
  }

  const options = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: targetUrl },
    vibrate: [200, 100, 200],
    renotify: true,
    tag: 'perfect-time-notification',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Click notification to open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
