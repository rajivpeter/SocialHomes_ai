import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyB1nfSDqignmcFAvKzh075flVbWOH9aOLs',
  authDomain: 'gen-lang-client-0146156913.firebaseapp.com',
  projectId: 'gen-lang-client-0146156913',
  storageBucket: 'gen-lang-client-0146156913.firebasestorage.app',
  messagingSenderId: '674258130066',
  appId: '1:674258130066:web:c054449140b2921844424b',
  measurementId: 'G-QM7NMBQ5J1',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
  return firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get the current user's ID token for API authentication.
 * Returns null if not signed in.
 */
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
