const CACHE_NAME = 'diario-bordo-trevo-v1.0.0';
const CORE_ASSETS = [
  '/', '/index.html', '/manifest.webmanifest', '/assets/css/styles.css',
  '/assets/js/config.js', '/assets/js/db.js', '/assets/js/supabase-rest.js', '/assets/js/app.js',
  '/assets/icons/icon-192.svg', '/assets/icons/icon-512.svg'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.hostname.includes('supabase.co')) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(resp => {
    const copy = resp.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    return resp;
  }).catch(() => caches.match('/index.html'))));
});
