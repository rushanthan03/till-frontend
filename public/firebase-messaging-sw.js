/**
 * firebase-messaging-sw.js — Firebase Service Worker
 * 
 * This file handles BACKGROUND push notifications (when the browser tab is closed).
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Replace the placeholder config below with your actual Firebase config
 * 3. Enable "Cloud Messaging" in your Firebase console
 * 4. Get VAPID key: Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
 * 5. Add Firebase env vars to your .env file
 * 
 * This file must stay in the /public directory so it's served at:
 * https://yourdomain.com/firebase-messaging-sw.js
 */

// ── Placeholder config — replace with real values from Firebase Console ──────
const FIREBASE_CONFIG = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_APP_ID",
};

// ── Service Worker Setup ──────────────────────────────────────────────────────
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp(FIREBASE_CONFIG);
const messaging = firebase.messaging();

// ── Background message handler ────────────────────────────────────────────────
// This fires when a push arrives and the browser tab is closed or in background

messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Background message received:', payload);

  const {
    title = '🆕 New Order',
    body = 'A new order has arrived',
    icon = '/logo.png',
  } = payload.notification || {};

  const data = payload.data || {};

  self.registration.showNotification(title, {
    body,
    icon,
    badge: '/logo.png',
    tag: data.orderId || 'new-order',
    requireInteraction: data.priority === 'urgent',
    data: {
      url: '/',
      orderId: data.orderId,
      orderType: data.orderType,
    },
    actions: [
      { action: 'view', title: '👁 View Order' },
      { action: 'dismiss', title: '✓ Got It' },
    ],
  });
});

// ── Notification click handler ────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
