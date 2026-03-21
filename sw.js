const CACHE_NAME = 'french-conjugation-v54';
const urlsToCache = [
  './',
  './index.html',
  './practice-setup.html',
  './practice.html',
  './listening-setup.html',
  './listening.html',
  './settings.html',
  './practice.js',
  './practice-setup.js',
  './listening-setup.js',
  './listening.js',
  './shared.js',
  './settings.js',
  './practice.css',
  './listening.css',
  './shared.css',
  './settings.css',
  './words.json',
  './sentences.json',
  './manifest.json',
  './icons/manifest-icon-192.maskable.png',
  './icons/manifest-icon-512.maskable.png',
  './icons/apple-icon-180.png',
  './icons/favicon-196.png'
];

// Install event - cache static assets (resilient approach)
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Opened cache');
        // Cache each file individually to avoid atomic failure
        const cachePromises = urlsToCache.map(url => {
          return cache.add(url)
            .then(() => {
              console.log('[SW] Cached:', url);
            })
            .catch(err => {
              console.warn('[SW] Failed to cache:', url, err);
              // Don't fail the installation if one file fails
            });
        });
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('[SW] Installation complete');
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
    })
  );
  // Claim clients immediately
  return self.clients.claim();
});

// Fetch event - strategy depends on the resource
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  const pathname = url.pathname;

  // version.json is NEVER cached — always goes to network
  if (pathname.endsWith('version.json')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first strategy for audio files (progressive caching)
  if (pathname.includes('/audio/') && pathname.endsWith('.mp3')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {
          return new Response('', { status: 404 });
        });
      })
    );
    return;
  }

  // Network-first strategy for all app files (HTML, JS, CSS, JSON)
  const isAppFile = pathname.endsWith('.html') || pathname.endsWith('.js') ||
                    pathname.endsWith('.css') || pathname.endsWith('.json');

  if (isAppFile) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first strategy for all other resources (icons, manifest, etc.)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return cached response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        // Try to fetch from network
        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the fetched response for future use
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Network request failed, return cached response if available
          return caches.match(event.request);
        });
      })
  );
});
