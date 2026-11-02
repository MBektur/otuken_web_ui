// Service Worker for Ötüken Policy Center PWA
const CACHE_NAME = 'otuken-pwa-v1';
const PRECACHE_ASSETS = [
  '/',
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

  // Ignore non-GET and chrome-extension/api requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Bypass API and admin routes
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/admin/')) {
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

  // Network-first for HTML pages with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return caches.match('/uy');
          });
        })
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
  const options = {
    body: data.body || 'يېڭى ئانالىز ياكى ماقالە ئېلان قىلىندى.',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    dir: data.dir || 'rtl',
    lang: data.lang || 'ug',
    data: {
      url: data.url || '/uy',
      dateOfArrival: Date.now(),
    },
    vibrate: [100, 50, 100],
    actions: [
      {
        action: 'open',
        title: 'ئوقۇش / Оқуш',
      },
      {
        action: 'close',
        title: 'تاقاش / Тақаш',
      },
    ],
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
            body: options.body,
            url: options.data.url,
            icon: options.icon,
          },
        });
      }
    });

  const showNotificationPromise = self.registration.showNotification(title, options);

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

