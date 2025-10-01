const CACHE_NAME = 'gym-tracker-v1';
const ASSETS = [
  './Wdeep2.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// install -> cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// activate -> cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); })
    ))
  );
  self.clients.claim();
});

// fetch -> strategy: cache-first for cached assets, network fallback + cache for others.
// navigation requests fallback to cached Wdeep2.html
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // If request is navigation (user typed URL or clicked link), try network then fallback to cache page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(res => res).catch(() => caches.match('./Wdeep2.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(networkRes => {
        // don't cache cross-origin opaque responses
        if (!networkRes || networkRes.status !== 200 || networkRes.type !== 'basic') return networkRes;
        const clone = networkRes.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return networkRes;
      }).catch(() => {
        // if request fails, try to return a cached file if any
        return caches.match('./Wdeep2.html');
      });
    })
  );
});
