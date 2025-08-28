// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, setLogLevel } from "firebase/firestore";
import { getAuth, setPersistence, inMemoryPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBdFa73sZEoIv9UuUIqcH89yO6rDTfy9Og",
  authDomain: "yulaa-27231.firebaseapp.com",
  projectId: "yulaa-27231",
  storageBucket: "yulaa-27231.appspot.com",
  messagingSenderId: "1000129823845",
  appId: "1:1000129823845:web:f0474c9d25050dda23b28c",
  databaseURL: "https://yulaa-27231-default-rtdb.firebaseio.com",
};

// ---------- Default app (Storefront) ----------
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const rtdb = getDatabase(app);

// Debug Firestore logs only in dev (Vite)
try {
  if (import.meta?.env?.DEV) {
    setLogLevel("debug");
  }
} catch {
  // ignore if env not available
}

// ---------- Dedicated Admin app (isolated auth) ----------
export const adminApp = initializeApp(firebaseConfig, "admin"); // different name is key
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

// Keep admin auth ephemeral so it never writes to local/session storage
// (no need to await; fire-and-forget with catch to avoid unhandled rejections)
setPersistence(adminAuth, inMemoryPersistence).catch((e) => {
  console.warn("Failed to set in-memory persistence for adminAuth:", e);
});
