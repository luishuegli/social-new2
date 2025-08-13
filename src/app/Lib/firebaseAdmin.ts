// Server-side Firebase Admin initialization for Firestore writes that bypass security rules
import { getApps, initializeApp, applicationDefault, cert, type App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

function buildAdminApp(): App {
  // If client is using emulators, point Admin SDK at emulators as well to avoid writing to prod
  // Only honor the explicit web flag to decide emulator usage.
  const useEmulators =
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true' ||
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === '1';
  if (useEmulators) {
    // These must be set before Firestore is initialized
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    }
  } else {
    // Ensure we do NOT accidentally point Admin SDK at emulator via inherited env
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      delete process.env.FIRESTORE_EMULATOR_HOST;
    }
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
export { FieldValue } from 'firebase-admin/firestore';

