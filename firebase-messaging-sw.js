// ══════════════════════════════════════════════════════════════
// StreamX — firebase-messaging-sw.js  v2
// GitHub Pages: place at repo ROOT same level as index.html
// URL: mrwhyyouareyou-arch.github.io/My-tube-/firebase-messaging-sw.js
// ══════════════════════════════════════════════════════════════

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyDx-r77MAJ_7jK7foeBE0P3RiTSPNIQgSE",
  authDomain:        "my-tube-e526b.firebaseapp.com",
  projectId:         "my-tube-e526b",
  storageBucket:     "my-tube-e526b.firebasestorage.app",
  messagingSenderId: "948348267378",
  appId:             "1:948348267378:web:2dd25f59a9f510a8694beb"
});

const messaging = firebase.messaging();

// Dynamic site root — works on GitHub Pages subpath AND any custom domain
const SITE_ROOT = self.registration.scope;
// e.g. https://mrwhyyouareyou-arch.github.io/My-tube-/

// ──────────────────────────────────────────────────────────────
// BACKGROUND MESSAGE — app closed or not focused
// ──────────────────────────────────────────────────────────────
messaging.onBackgroundMessage(payload => {
  console.log('[SW] Background message:', payload);

  const data  = payload.data || {};
  const title = payload.notification?.title || data.title || 'StreamX';
  const body  = payload.notification?.body  || data.body  || '';

  // Deep link URL
  let url = SITE_ROOT;
  if      (data.type === 'short'   && data.postId)  url = SITE_ROOT + '?short='   + data.postId;
  else if (data.type === 'post'    && data.postId)  url = SITE_ROOT + '?post='    + data.postId;
  else if (data.type === 'dm'      && data.convId)  url = SITE_ROOT + '?dm='      + data.convId;
  else if (data.type === 'sub'     && data.fromUid) url = SITE_ROOT + '?profile=' + data.fromUid;
  else if (data.click_action)                        url = data.click_action;

  return self.registration.showNotification(title, {
    body,
    icon:      SITE_ROOT + 'icons/icon-192.png',
    badge:     SITE_ROOT + 'icons/icon-96.png',
    tag:       data.postId || data.convId || data.type || 'streamx',
    renotify:  true,
    data:      { url, ...data }
  });
});

// ──────────────────────────────────────────────────────────────
// NOTIFICATION CLICK — open correct screen
// ──────────────────────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || SITE_ROOT;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      // If StreamX tab already open — focus and navigate
      for (const client of list) {
        if (client.url.startsWith(SITE_ROOT) && 'focus' in client) {
          client.focus();
          client.postMessage({ type: 'NOTIF_NAVIGATE', url });
          return;
        }
      }
      // No open tab — open new window
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ──────────────────────────────────────────────────────────────
// NOTIFICATION DISMISS tracking
// ──────────────────────────────────────────────────────────────
self.addEventListener('notificationclose', event => {
  console.log('[SW] Notification dismissed:', event.notification.tag);
});
