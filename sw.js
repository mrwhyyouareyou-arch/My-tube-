// Stream x Service Worker — Offline Support
const CACHE = 'streamx-v2';
const OFFLINE_URLS = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(OFFLINE_URLS).catch(()=>{}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Cache-first for fonts/icons
  if(url.includes('fonts.') || url.includes('font-awesome') || url.includes('cdnjs')){
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(resp=>{
        const clone = resp.clone();
        caches.open(CACHE).then(cache=>cache.put(e.request,clone));
        return resp;
      }))
    );
    return;
  }
  // Network-first for API/Firebase calls
  if(url.includes('firebase') || url.includes('firestore') || url.includes('googleapis')){
    e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
    return;
  }
  // For main app — network first, fallback to cache
  if(url.includes(self.location.origin)){
    e.respondWith(
      fetch(e.request).then(resp=>{
        const clone = resp.clone();
        caches.open(CACHE).then(c=>c.put(e.request,clone));
        return resp;
      }).catch(()=>caches.match(e.request)||caches.match('/index.html'))
    );
    return;
  }
  // Default — try network
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});
