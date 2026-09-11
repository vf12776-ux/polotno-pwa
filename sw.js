// sw.js - Продвинутое кэширование для слабой сети

const CACHE_STATIC = 'polotno-static-v4';
const CACHE_DYNAMIC = 'polotno-dynamic-v4';
const CACHE_IMAGES = 'polotno-images-v4';

// Статические файлы (кэшируются при установке)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/admin.html',
  '/style.css',
  '/manifest.json',
  '/admin-manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon31-192.png',
  '/icon31-512.png',
  '/offline.html'
];

// Установка: кэшируем все статические файлы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()) // Активируем сразу
  );
});

// Активация: удаляем старые кэши
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

// Обработка запросов
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Фотографии товаров — кэшируем навечно (cache-first)
  if (url.hostname === 'i.ibb.co' || url.pathname.match(/\.(png|jpg|jpeg|webp|svg)$/)) {
    event.respondWith(cacheFirst(event.request, CACHE_IMAGES));
    return;
  }

  // 2. Firebase SDK и внешние скрипты — кэшируем надолго (cache-first)
  if (url.hostname === 'www.gstatic.com' || url.hostname === 'apis.google.com') {
    event.respondWith(cacheFirst(event.request, CACHE_DYNAMIC));
    return;
  }

  // 3. API-запросы к Firebase — сеть с fallback на кэш (network-first)
  if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('firebaseio.com')) {
    event.respondWith(networkFirst(event.request, CACHE_DYNAMIC));
    return;
  }

  // 4. HTML-страницы — кэш с обновлением в фоне (stale-while-revalidate)
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(event.request, CACHE_STATIC));
    return;
  }

  // 5. Остальные файлы (CSS, JS) — кэш с обновлением в фоне
  event.respondWith(staleWhileRevalidate(event.request, CACHE_DYNAMIC));
});

// Стратегия: Cache First (для картинок и SDK)
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
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

// Стратегия: Network First (для API-данных)
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

// Стратегия: Stale While Revalidate (для HTML, CSS, JS)
// Показываем кэш мгновенно, обновляем в фоне
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