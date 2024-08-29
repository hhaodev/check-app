// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDqODf5TIzCqTPNcarXWfoMkfxjTd32E7c",
  authDomain: "check-app-65a52.firebaseapp.com",
  projectId: "check-app-65a52",
  storageBucket: "check-app-65a52.appspot.com",
  messagingSenderId: "150962778943",
  appId: "1:150962778943:web:cb8e4e59aed94866f1d98a",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const messaging = getMessaging(app);

export { db, auth, messaging };
