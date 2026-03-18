importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAa7tAA1SQ5kEAK33DkMOdkBlyTSV48mJE",
  authDomain: "taskflow-bcc0e.firebaseapp.com",
  projectId: "taskflow-bcc0e",
  storageBucket: "taskflow-bcc0e.firebasestorage.app",
  messagingSenderId: "433422882573",
  appId: "1:433422882573:web:9f34f1f209a850448e0244",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: payload.data
  });
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
