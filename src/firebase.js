// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { getDatabase } from "firebase/database"; // ✅ Realtime Database import

const firebaseConfig = {
  apiKey: "AIzaSyBdFa73sZEoIv9UuUIqcH89yO6rDTfy9Og",
  authDomain: "yulaa-27231.firebaseapp.com",
  projectId: "yulaa-27231",
  storageBucket: "yulaa-27231.appspot.com",
  messagingSenderId: "1000129823845",
  appId: "1:1000129823845:web:f0474c9d25050dda23b28c",
  databaseURL: "https://yulaa-27231-default-rtdb.firebaseio.com" // ✅ Add from console
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);
const rtdb = getDatabase(app); // ✅ Initialize Realtime Database

export { auth, db, storage, functions, rtdb };
