// ══════════════════════════════════════════════════════════════
// StreamX — sw.js (general PWA shell service worker)
// Place at the SITE ROOT, same folder as index.html.
// Registered via: navigator.serviceWorker.register('./sw.js',{scope:'./'})
//
// Kept deliberately minimal: it only caches the app shell (index.html
// + manifest + icons) so the PWA is installable and shows something
// on a flaky connection. It does NOT cache Firestore reads, R2/Bunny
// media, or any cross-origin requests — those must always stay live.
// ══════════════════════════════════════════════════════════════

const CACHE_NAME = 'streamx-shell-v1';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES))
      .catch((e) => console.warn('[sw.js] shell cache failed (non-fatal):', e))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle same-origin GET requests for the shell document itself.
  // Everything else (Firestore, R2 images, Bunny HLS, Cloudflare Workers,
  // gstatic/Firebase SDK scripts, etc.) passes straight through to the
  // network untouched — we never want to serve stale dynamic content.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  if (req.mode === 'navigate') {
    // Network-first for navigations, falling back to cached shell when offline.
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Cache-first for the small static shell assets only.
  if (SHELL_FILES.some((f) => req.url.endsWith(f.replace('./', '')))) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
  }
});
