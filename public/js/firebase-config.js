// ============================================================
//  FIREBASE CONFIGURATION — Suraj Kumar Mahto Portfolio
//  Replace the placeholder values below with your own config
//  See SETUP.md for step-by-step instructions
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// ⚠️  REPLACE THESE WITH YOUR FIREBASE PROJECT CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBJLitOZ7VLF1l3NLGfz3EfVERFKP53Jo8",
  authDomain: "suraj-portfolio-df5e3.firebaseapp.com",
  projectId: "suraj-portfolio-df5e3",
  storageBucket: "suraj-portfolio-df5e3.firebasestorage.app",
  messagingSenderId: "525142119071",
  appId: "1:525142119071:web:0b092c2b31730bd53b48aa",
  measurementId: "G-RJF1SR6HT9"
};

let auth, db, storage;

try {
  if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
    throw new Error("Firebase not configured yet.");
  }
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  console.log("✅ Firebase connected.");
} catch (e) {
  console.warn("⚠️  Firebase not configured — running in offline/demo mode.", e.message);
  // Stub objects so the rest of the app doesn't throw
  auth = null;
  db = null;
  storage = null;
}

export { auth, db, storage };
