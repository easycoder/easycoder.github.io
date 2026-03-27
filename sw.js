// EasyCoder Service Worker
// Bump CACHE_VERSION on each deployment to trigger cache refresh
const CACHE_VERSION = 'v1';
const CACHE_NAME = `easycoder-cache-${CACHE_VERSION}`;

// Core assets to pre-cache on install
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/dist/easycoder.js',
  '/resources/css/styles.css'
];

// Install: pre-cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: delete old versioned caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for ECS scripts and REST calls, cache-first for static assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Network-first for ECS scripts and API calls
  if (url.pathname.endsWith('.ecs') || event.request.method !== 'GET') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache a copy of successful GET responses
          if (event.request.method === 'GET' && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, images)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        return cached;
      }
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
