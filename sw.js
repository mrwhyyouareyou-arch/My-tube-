// MyTube Service Worker v3 — Fast Launch PWA
const CACHE = 'mytube-v3';
const ASSETS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
];

// Install: cache everything immediately
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: Cache-First for assets, Network-First for Firebase/Cloudinary
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Skip non-GET and Firebase/Cloudinary (always fresh)
  if (e.request.method !== 'GET') return;
  if (url.includes('firestore.googleapis.com') ||
      url.includes('firebase') ||
      url.includes('cloudinary') ||
      url.includes('googleapis.com/identitytoolkit')) return;

  // Cache-first for static assets (fonts, icons, CSS)
  if (url.includes('fonts.googleapis.com') ||
      url.includes('cdnjs.cloudflare.com') ||
      url.includes('gstatic.com')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        });
      })
    );
    return;
  }

  // Network-first for HTML (always get fresh app)
  if (url.includes('index.html') || url.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Default: try network, fallback to cache
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
