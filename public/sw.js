// Service Worker for enhanced caching of third-party resources
const CACHE_NAME = 'pakplay-cache-v1';
const RUNTIME_CACHE = 'pakplay-runtime-v1';

// Resources to cache immediately
const PRECACHE_URLS = [
  '/',
  '/favicon.png',
  '/apple-touch-icon.png',
];

// Install event - precache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - cache strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Strategy for different resource types
  if (
    // Supabase images - Cache first, network fallback (1 year)
    url.hostname.includes('supabase.co') && 
    (request.destination === 'image' || url.pathname.includes('/storage/'))
  ) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) return response;
          
          return fetch(request).then((networkResponse) => {
            // Cache the response for 1 year
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
  } 
  // Google APIs images - Cache first (1 week)
  else if (
    url.hostname.includes('googleusercontent.com') && 
    request.destination === 'image'
  ) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) return response;
          
          return fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
  }
  // Google Ads scripts - Network first with cache fallback
  else if (
    url.hostname.includes('googlesyndication.com') ||
    url.hostname.includes('googletagmanager.com')
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
  }
  // All other requests - network first
  else {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
  }
});
