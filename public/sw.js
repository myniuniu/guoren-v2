const CACHE_PREFIX = 'guoren-pwa';
const APP_VERSION = 'v4';
const STATIC_CACHE = `${CACHE_PREFIX}-static-${APP_VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-${APP_VERSION}`;
const CACHE_NAMES = [STATIC_CACHE, RUNTIME_CACHE];
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/pwa-192.png',
  '/pwa-512.png',
  '/pwa-maskable-192.png',
  '/pwa-maskable-512.png',
];
const STATIC_DESTINATIONS = new Set(['script', 'style', 'image', 'font', 'manifest', 'worker']);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && !CACHE_NAMES.includes(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstAppShell(request));
    return;
  }

  if (STATIC_DESTINATIONS.has(request.destination) || url.pathname.startsWith('/assets/')) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function networkFirstAppShell(request) {
  const cache = await caches.open(STATIC_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put('/index.html', response.clone());
    }
    return response;
  } catch {
    return await cache.match('/index.html') || await cache.match('/') || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || await refresh || Response.error();
}
