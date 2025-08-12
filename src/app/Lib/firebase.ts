"use client";

// src/lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const;

// Add error handling for missing environment variables
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  // Surface a descriptive error at runtime so it's clear which var is missing
  const masked = (value?: string) => (value ? `${value.slice(0, 6)}…` : 'undefined');
  const message = `Missing Firebase env vars. apiKey=${masked(firebaseConfig.apiKey)}, authDomain=${masked(firebaseConfig.authDomain)}, projectId=${masked(firebaseConfig.projectId)}`;
  // eslint-disable-next-line no-console
  console.error(message);
  throw new Error(message);
}

// Initialize Firebase
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  throw error;
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Connect to emulators in development (and only in browser contexts)
const shouldUseEmulators =
  typeof window !== 'undefined' &&
  process.env.NODE_ENV === 'development' &&
  (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true' || process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === '1');

if (shouldUseEmulators) {
  try {
    // Avoid duplicate connections (Next.js fast refresh)
    const authAny = auth as unknown as { emulatorConfig?: unknown };
    if (!authAny.emulatorConfig) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    }
    const dbAny = db as unknown as { _settings?: { host?: string } };
    const host = dbAny?._settings?.host || '';
    if (!host.includes('localhost')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
    console.log('Connected to Firebase emulators (auth:9099, firestore:8080)');
  } catch (e) {
    console.warn('Failed to connect to emulators:', e);
  }
}

export { app, auth, db, storage };