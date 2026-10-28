// Offline support: serve the cached page instantly, refresh the cache in the background
// so updates arrive on the next open. Weather calls always go to the network.
const CACHE = 'khizanati-v1';
const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const FILES = ['./', './index.html', THREE_URL];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(FILES.map(f => c.add(f))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('open-meteo.com')) return;
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(e.request, { ignoreSearch: true });
      const fresh = fetch(e.request, { cache: 'no-cache' })
        .then(res => {
          if (res.ok) cache.put(e.request.url.split('?')[0], res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});
