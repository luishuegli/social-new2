// Server-side Firebase Admin initialization for Firestore writes that bypass security rules
import { getApps, initializeApp, applicationDefault, cert, type App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

function buildAdminApp(): App {
  // Server should only use emulators if explicitly requested via FIRESTORE_EMULATOR_HOST or SERVER flag
  const serverWantsEmulator =
    !!process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.USE_FIREBASE_EMULATORS_SERVER === 'true' ||
    process.env.USE_FIREBASE_EMULATORS_SERVER === '1';

  if (!serverWantsEmulator && process.env.FIRESTORE_EMULATOR_HOST) {
    // Ensure we do NOT accidentally point Admin SDK at emulator via inherited env
    delete process.env.FIRESTORE_EMULATOR_HOST;
  }

  // Prefer explicit service account credentials if provided, otherwise fall back to ADC
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  }

  // Fallback to Application Default Credentials (e.g., `gcloud auth application-default login`)
  return initializeApp({
    credential: applicationDefault(),
    projectId,
  });
}

const adminApp: App = getApps().length === 0 ? buildAdminApp() : getApps()[0]!;

// Export Firestore instance and FieldValue for server timestamps, etc.
export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
export const adminStorage = getStorage(adminApp);
export { FieldValue } from 'firebase-admin/firestore';

