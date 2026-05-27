// ============================================================
//  AUTH GUARD — Suraj Kumar Mahto Portfolio
//  Handles login state and protects private pages
// ============================================================

import { auth } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ── Guard: redirect to login if not authenticated ──────────
export function requireAuth(redirectTo = 'login.html') {
  return new Promise((resolve, reject) => {
    if (!auth) {
      // Firebase not configured — block access
      window.location.href = redirectTo;
      return reject(new Error('Auth not configured'));
    }
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (user) {
        resolve(user);
      } else {
        window.location.href = redirectTo;
        reject(new Error('Not authenticated'));
      }
    });
  });
}

// ── Guard: redirect to dashboard if already logged in ──────
export function redirectIfLoggedIn(redirectTo = 'dashboard.html') {
  if (!auth) return;
  const unsub = onAuthStateChanged(auth, (user) => {
    unsub();
    if (user) window.location.href = redirectTo;
  });
}

// ── Login ───────────────────────────────────────────────────
export async function login(email, password) {
  if (!auth) throw new Error('Firebase not configured. Please follow SETUP.md.');
  await setPersistence(auth, browserSessionPersistence);
  return signInWithEmailAndPassword(auth, email, password);
}

// ── Logout ──────────────────────────────────────────────────
export async function logout() {
  if (!auth) return;
  await signOut(auth);
  window.location.href = 'index.html';
}

// ── Get current user ────────────────────────────────────────
export function getCurrentUser() {
  return auth ? auth.currentUser : null;
}
