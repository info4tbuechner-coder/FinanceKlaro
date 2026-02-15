
const CACHE_NAME = 'klaro-finance-v8';
const STATIC_ASSETS = [
  './',
  'index.html',
  'index.tsx',
  'metadata.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/recharts/umd/Recharts.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js'
];

const LIB_PATTERN = /^https:\/\/aistudiocdn\.com\//;
const API_PATTERN = /^https:\/\/generativelanguage\.googleapis\.com\//;
const ICON_PATTERN = /^https:\/\/api\.dicebear\.com\//;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching static assets');
      return Promise.allSettled(
          STATIC_ASSETS.map(url => cache.add(url).catch(err => console.warn(`Failed to cache ${url}:`, err)))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
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
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // API-Aufrufe an Google Gemini nicht cachen
  if (API_PATTERN.test(url)) {
    return; 
  }

  // Strategie: Stale-While-Revalidate für App-Logik, Index und Icons
  if (url.includes(location.origin) || LIB_PATTERN.test(url) || ICON_PATTERN.test(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => response); 
          return response || fetchPromise;
        });
      })
    );
    return;
  }

  // Strategie: Cache-First für Fonts und CDNs
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      }).catch(() => {
          return new Response('Network error occurred', { status: 408 });
      });
    })
  );
});
