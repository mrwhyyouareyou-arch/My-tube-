// StreamX Service Worker v6 - Bug Killer + Smart Cache
const CACHE = 'streamx-v6';
const STATIC_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

// Install: Sirf fonts/icons cache karo, app ko haath mat lagao
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC_ASSETS)).catch(()=>{})
  );
  self.skipWaiting();
});

// Activate: Purane saare cache uda do - mytube-v3, streamx-v2, sab
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: 3 Rule ka Game
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // RULE 1: Firebase/API ko kabhi cache mat karo - Hamesha fresh
  if (e.request.method !== 'GET' || 
      url.includes('firestore.googleapis.com') || 
      url.includes('firebase') || 
      url.includes('googleapis.com') ||
      url.includes('cloudinary.com') ||
      url.includes('identitytoolkit')) {
    return; // Browser ko handle karne do
  }

  // RULE 2: Fonts/Icons = Cache-First - Ye hi fast banayega app ko
  if (url.includes('fonts.googleapis.com') || 
      url.includes('cdnjs.cloudflare.com') || 
      url.includes('gstatic.com')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        return cached || fetch(e.request).then(res => {
          const resClone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, resClone));
          return res;
        });
      })
    );
    return;
  }

  // RULE 3: App ka HTML/JS = Network-Only - Kabhi purana nahi chalega
  // Isse splash screen wala bug 100% khatam
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
