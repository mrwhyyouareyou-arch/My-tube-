// ══════════════════════════════════════════════════════════════
// StreamX — firebase-messaging-sw.js
// Place this file at the SITE ROOT, same folder as index.html
// (i.e. mrwhyyouareyou-arch.github.io/My-tube-/firebase-messaging-sw.js)
// Registered by index.html via:
//   navigator.serviceWorker.register('./firebase-messaging-sw.js', { scope: './' })
// ══════════════════════════════════════════════════════════════

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDx-r77MAJ_7jK7foeBE0P3RiTSPNIQgSE",
  authDomain: "my-tube-e526b.firebaseapp.com",
  projectId: "my-tube-e526b",
  storageBucket: "my-tube-e526b.firebasestorage.app",
  messagingSenderId: "948348267378",
  appId: "1:948348267378:web:2dd25f59a9f510a8694beb"
});

const messaging = firebase.messaging();

// Site root — used to build absolute icon paths and to detect "is a
// StreamX tab already open" when a notification is tapped.
const SITE_ROOT = self.registration.scope; // e.g. https://mrwhyyouareyou-arch.github.io/My-tube-/

// ──────────────────────────────────────────────────────────────
// 1) BACKGROUND MESSAGE — fires when a push arrives while the app
//    is closed or the tab isn't focused. (When the tab IS open and
//    focused, index.html's own messaging.onMessage() handles it
//    with an in-app toast instead — this only covers background.)
// ──────────────────────────────────────────────────────────────
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] background message:', payload);

  const data  = payload.data || {};
  const title = (payload.notification && payload.notification.title) || data.title || 'StreamX';
  const body  = (payload.notification && payload.notification.body)  || data.body  || '';

  const options = {
    body,
    icon: SITE_ROOT + 'icon-192.png',
    badge: SITE_ROOT + 'icon-192.png',
    data,                              // keep click_action/postId/type for the click handler below
    tag: data.postId || data.type || 'streamx-notif',
    renotify: false
  };

  self.registration.showNotification(title, options);
});

// ──────────────────────────────────────────────────────────────
// 2) NOTIFICATION CLICK — this was missing, which is why tapping
//    a push notification did nothing. Works for notifications shown
//    above AND for ones Firebase auto-displays when the FCM payload
//    includes a top-level "notification" field (Firebase copies the
//    original data into event.notification.data in that case too).
// ──────────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  // _sendFCMPush() builds this as:
  //   https://.../My-tube-/?notif=1&postId=<id>&type=<type>
  const targetUrl = data.click_action || (SITE_ROOT + '?notif=1');

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a StreamX tab/window is already open, focus + navigate it
      for (const client of clientList) {
        if (client.url.indexOf(SITE_ROOT) === 0 && 'focus' in client) {
          if ('navigate' in client) {
            return client.navigate(targetUrl).then((c) => c && c.focus());
          }
          return client.focus();
        }
      }
      // Otherwise open a fresh window/tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ──────────────────────────────────────────────────────────────
// 3) Optional: dismiss tracking (handy for debugging, harmless otherwise)
// ──────────────────────────────────────────────────────────────
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] notification dismissed:', event.notification.tag);
});
