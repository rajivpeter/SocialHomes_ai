// ============================================================
// SocialHomes.Ai — Firebase Client SDK
// Config is loaded from /api/v1/config (env vars on the server)
// NEVER hardcode Firebase config values in this file.
// ============================================================

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

let _app: firebase.app.App | null = null;
let _auth: firebase.auth.Auth | null = null;
let _initPromise: Promise<void> | null = null;

/**
 * Fetch Firebase config from the Express server.
 * The server reads FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN,
 * FIREBASE_PROJECT_ID from environment variables.
 */
async function fetchFirebaseConfig(): Promise<{
  apiKey: string;
  authDomain: string;
  projectId: string;
}> {
  const response = await fetch('/api/v1/config');
  if (!response.ok) {
    throw new Error(`Failed to load Firebase config: ${response.status}`);
  }
  const data = await response.json();
  return data.firebase;
}

/**
 * Initialize Firebase. Called once; subsequent calls are no-ops.
 * Returns a promise that resolves when Firebase is ready.
 */
export function initFirebase(): Promise<void> {
  if (_initPromise) return _initPromise;

  _initPromise = fetchFirebaseConfig().then((config) => {
    if (!config.apiKey) {
      console.warn('Firebase API key not configured — auth will be unavailable');
      return;
    }

    if (firebase.apps.length === 0) {
      _app = firebase.initializeApp(config);
    } else {
      _app = firebase.apps[0];
    }
    _auth = firebase.auth();
  });

  return _initPromise;
}

/**
 * Get the Firebase Auth instance. Returns null if not yet initialized.
 */
export function getFirebaseAuth(): firebase.auth.Auth | null {
  return _auth;
}

/**
 * Get the current user's ID token for API authentication.
 * Returns null if not signed in or Firebase not initialized.
 */
export async function getIdToken(): Promise<string | null> {
  if (!_auth) return null;
  const user = _auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  if (!_auth) return;
  await _auth.signOut();
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthStateChanged(
  callback: (user: firebase.User | null) => void,
): () => void {
  if (!_auth) {
    // Firebase not initialized yet — return no-op unsubscribe
    return () => {};
  }
  return _auth.onAuthStateChanged(callback);
}

// Re-export firebase compat for FirebaseUI usage
export { firebase };
