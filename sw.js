const CACHE_NAME = 'french-conjugation-v21';
const urlsToCache = [
  './',
  './index.html',
  './conjugation.html',
  './tenses.html',
  './tenses-practice.html',
  './settings.html',
  './app.js',
  './shared.js',
  './tenses-practice.js',
  './settings.js',
  './styles.css',
  './shared.css',
  './tenses-practice.css',
  './settings.css',
  './words.json',
  './tense-practice-words.json',
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

  // Network-first strategy for app files to always get fresh updates
  if (url.pathname.endsWith('words.json') || url.pathname.endsWith('tense-practice-words.json') ||
      url.pathname.endsWith('app.js') || url.pathname.endsWith('index.html') ||
      url.pathname.endsWith('styles.css') || url.pathname.endsWith('conjugation.html') ||
      url.pathname.endsWith('shared.js') || url.pathname.endsWith('shared.css') ||
      url.pathname.endsWith('tenses.html') || url.pathname.endsWith('tenses-practice.html') ||
      url.pathname.endsWith('tenses-practice.js') || url.pathname.endsWith('tenses-practice.css') ||
      url.pathname.endsWith('settings.html') || url.pathname.endsWith('settings.js') ||
      url.pathname.endsWith('settings.css')) {
    const fileName = url.pathname.split('/').pop();
    console.log('[SW] Network-first strategy for', fileName);
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          console.log('[SW] Successfully fetched fresh', fileName, 'from network');
          // Cache the fresh response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          console.log('[SW] Network failed, falling back to cached', fileName);
          // Network failed, fallback to cache
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
