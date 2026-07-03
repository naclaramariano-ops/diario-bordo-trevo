const CACHE_NAME = 'diario-bordo-trevo-cloudflare-v1';
const APP_SHELL = [
  '/', '/index.html', '/manifest.webmanifest', '/assets/styles.css', '/assets/app.js',
  '/assets/icon-192.svg', '/assets/icon-512.svg',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.includes('supabase.co')) return;
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      return resp;
    }).catch(() => caches.match('/index.html')))
  );
});
