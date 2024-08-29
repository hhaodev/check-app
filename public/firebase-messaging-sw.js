importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyDqODf5TIzCqTPNcarXWfoMkfxjTd32E7c",
  authDomain: "check-app-65a52.firebaseapp.com",
  projectId: "check-app-65a52",
  storageBucket: "check-app-65a52.appspot.com",
  messagingSenderId: "150962778943",
  appId: "1:150962778943:web:cb8e4e59aed94866f1d98a",
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
