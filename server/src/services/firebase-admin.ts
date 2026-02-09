import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

let app: App;
let auth: Auth;

// Initialize Firebase Admin SDK.
// On Cloud Run: auto-authenticates via metadata server (no credentials needed).
// Locally: uses GOOGLE_APPLICATION_CREDENTIALS env var.
export function getFirebaseAdmin(): { app: App; auth: Auth } {
  if (!app) {
    if (getApps().length === 0) {
      app = initializeApp({
        projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.FIRESTORE_PROJECT_ID,
      });
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
  }
  return { app, auth };
}

/**
 * Verify a Firebase ID token and return the decoded claims.
 * Throws if the token is invalid or expired.
 */
export async function verifyIdToken(idToken: string) {
  const { auth } = getFirebaseAdmin();
  return auth.verifyIdToken(idToken);
}

/**
 * Create a new Firebase Auth user (for admin seeding of demo accounts).
 */
export async function createAuthUser(email: string, password: string, displayName: string) {
  const { auth } = getFirebaseAdmin();
  return auth.createUser({ email, password, displayName });
}

/**
 * Set custom claims on a Firebase Auth user (e.g. persona role).
 */
export async function setCustomClaims(uid: string, claims: Record<string, any>) {
  const { auth } = getFirebaseAdmin();
  await auth.setCustomUserClaims(uid, claims);
}

/**
 * Get a Firebase Auth user by email.
 */
export async function getUserByEmail(email: string) {
  const { auth } = getFirebaseAdmin();
  try {
    return await auth.getUserByEmail(email);
  } catch {
    return null;
  }
}
