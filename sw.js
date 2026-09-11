const CACHE_NAME = 'polotno-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/admin.html',
  '/admin-manifest.json',
  '/style.css',
  '/app.js',
  '/admin.js',
  '/install-prompt.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon31-192.png',
  '/icon31-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});