const CACHE_STATIC = 'polotno-static-v5';
const CACHE_DYNAMIC = 'polotno-dynamic-v5';
const CACHE_IMAGES = 'polotno-images-v5';
const BASE_URL = '/polotno-pwa';

const STATIC_ASSETS = [
  `${BASE_URL}/`,
  `${BASE_URL}/index.html`,
  `${BASE_URL}/admin.html`,
  `${BASE_URL}/style.css`,
  `${BASE_URL}/manifest.json`,
  `${BASE_URL}/admin-manifest.json`,
  `${BASE_URL}/icon-192.png`,
  `${BASE_URL}/icon-512.png`,
  `${BASE_URL}/icon31-192.png`,
  `${BASE_URL}/icon31-512.png`,
  `${BASE_URL}/offline.html`
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => 
          key !== CACHE_STATIC && 
          key !== CACHE_DYNAMIC && 
          key !== CACHE_IMAGES
        ).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.hostname === 'i.ibb.co' || url.pathname.match(/\.(png|jpg|jpeg|webp|svg)$/)) {
    event.respondWith(cacheFirst(event.request, CACHE_IMAGES));
    return;
  }

  if (url.hostname === 'www.gstatic.com' || url.hostname === 'apis.google.com') {
    event.respondWith(cacheFirst(event.request, CACHE_DYNAMIC));
    return;
  }

  if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('firebaseio.com')) {
    event.respondWith(networkFirst(event.request, CACHE_DYNAMIC));
    return;
  }

  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(event.request, CACHE_STATIC));
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request, CACHE_DYNAMIC));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response('', { status: 408 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'offline' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);
  
  return cached || fetchPromise;
}