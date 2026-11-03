// Service Worker for Ötüken Policy Center PWA
const CACHE_NAME = 'otuken-pwa-v3';
const NAV_TIMEOUT_MS = 50;
// Home pages open instantly from cache (stale-while-revalidate); next launch gets the fresh copy
const INSTANT_PATHS = ['/uy', '/ug'];
const PRECACHE_ASSETS = [
  '/uy',
  '/ug',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/fonts/ukij-tuz.woff2',
  '/fonts/lateef-bold.woff2',
  '/fonts/lateef-regular.woff2',
  '/logo.Header-UY.png'
];

// Query-less cache key for plain pages; search/pagination keep their full URL
function navCacheKey(url) {
  if (url.searchParams.has('q') || url.searchParams.has('page')) return url.href;
  return url.origin + url.pathname;
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Precache partial fail:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET, non-origin, and local dev requests to prevent stale HMR bundles
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    self.location.hostname === 'localhost' ||
    self.location.hostname === '127.0.0.1'
  ) {
    return;
  }

  // Bypass API, admin, and settings routes
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/admin/') ||
    url.pathname.includes('/settings/')
  ) {
    return;
  }

  // Cache-first for static assets (fonts, icons, images, css)
  const isStaticAsset =
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(woff2|woff|ttf|png|jpg|jpeg|svg|webp|ico|css|js)$/i);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML pages: serve cache immediately if the network is slower than NAV_TIMEOUT_MS,
  // always refresh the cache in the background (avoids a white screen on PWA launch).
  if (request.mode === 'navigate') {
    const key = navCacheKey(url);
    const network = fetch(request).then((response) => {
      if (response && response.status === 200 && !response.redirected) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(key, clone));
      }
      return response;
    });
    event.waitUntil(network.catch(() => {}));

    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = (await cache.match(key)) || null;

        if (!cached) {
          try {
            return await network;
          } catch {
            return (await cache.match('/uy')) || Response.error();
          }
        }

        if (INSTANT_PATHS.includes(url.pathname) && !url.searchParams.has('q') && !url.searchParams.has('page')) {
          return cached;
        }

        const timeout = new Promise((resolve) => setTimeout(() => resolve(null), NAV_TIMEOUT_MS));
        try {
          const fresh = await Promise.race([network, timeout]);
          if (fresh) return fresh;
        } catch {
          // fall through to cached copy
        }
        return cached;
      })()
    );
    return;
  }
});

// Push Notification Event Listener
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: event.data.text() };
    }
  }

  const title = data.title || 'ئۆتۈكەن — يېڭى ماقالە';
  const targetUrl = data.url || '/uy';

  // Base options supported universally across iOS Safari PWA, Android Chrome, and Desktop
  const baseOptions = {
    body: data.body || 'يېڭى ئانالىز ياكى ماقالە ئېلان قىلىندى.',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: data.tag || 'otuken-' + Date.now(),
    renotify: true,
    data: {
      url: targetUrl,
      dateOfArrival: Date.now(),
    },
  };

  // Broadcast to open client windows (Foreground In-App Notification Banner)
  const broadcastPromise = self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientList) => {
      for (const client of clientList) {
        client.postMessage({
          type: 'PUSH_NOTIFICATION_RECEIVED',
          payload: {
            title,
            body: baseOptions.body,
            url: targetUrl,
            icon: baseOptions.icon,
          },
        });
      }
    })
    .catch(() => {});

  // Resilient showNotification: Attempt rich options first, fallback to minimal clean options for iOS Safari
  const showNotificationPromise = self.registration
    .showNotification(title, {
      ...baseOptions,
      ...(typeof navigator !== 'undefined' && 'vibrate' in navigator ? { vibrate: [100, 50, 100] } : {}),
    })
    .catch((err) => {
      console.warn('showNotification rich failed, retrying minimal for iOS:', err);
      return self.registration.showNotification(title, {
        body: baseOptions.body,
        icon: baseOptions.icon,
        data: baseOptions.data,
      });
    });

  event.waitUntil(Promise.all([broadcastPromise, showNotificationPromise]));
});

// Push Notification Click Event Listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/uy';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it and navigate
        for (const client of clientList) {
          if ('focus' in client) {
            if (client.url.includes(targetUrl)) {
              return client.focus();
            }
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

