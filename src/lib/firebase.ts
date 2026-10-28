import { initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

/** Public Firebase web config. These are client identifiers, not server secrets. */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDrKofl6o8TClC-uu0wxepqvYJ6xf_nQxU',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'gemini-dream-477009.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'gemini-dream-477009',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'gemini-dream-477009.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '426536044335',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:426536044335:web:ab38ba409e916bc28243da',
};

export const API_BASE = (import.meta.env.VITE_API_BASE || 'https://api.herbalharbour.co.za').replace(/\/$/, '');

const app = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);

export function getFirebaseAuth(): Auth {
  return auth;
}

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}
