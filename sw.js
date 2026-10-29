// Offline support: serve the cached page instantly, refresh the cache in the background
// so updates arrive on the next open. Only the app's own files are handled; weather and
// place-name lookups always go straight to the network.
const CACHE = 'khizanati-v7';
const FILES = ['./', './index.html', './three.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
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
  if (new URL(e.request.url).origin !== self.location.origin) return;
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
