// ============================================================
// SocialHomes.Ai — Authentication Context
// Manages Firebase Auth state across the application.
// Wraps the app in main.tsx — all components can useAuth().
// ============================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  initFirebase,
  getFirebaseAuth,
  getIdToken,
  signOut as firebaseSignOut,
  firebase,
} from '@/services/firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  /** The currently authenticated Firebase user (null = not signed in) */
  user: AuthUser | null;
  /** True while Firebase is initializing or checking auth state */
  loading: boolean;
  /** True when Firebase has been initialized (config loaded) */
  firebaseReady: boolean;
  /** Sign out and clear auth state */
  signOut: () => Promise<void>;
  /** Get the current ID token for API calls */
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    initFirebase()
      .then(() => {
        setFirebaseReady(true);
        const auth = getFirebaseAuth();
        if (!auth) {
          // Firebase not configured — allow app to work without auth
          setLoading(false);
          return;
        }

        unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
          if (fbUser) {
            setUser({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              photoURL: fbUser.photoURL,
            });

            // Store auth mode so api-client knows to send Bearer token
            localStorage.setItem('socialhomes-auth-mode', 'firebase');

            // Create profile in Firestore on first sign-in
            try {
              const token = await fbUser.getIdToken();
              await fetch('/api/v1/auth/profile', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  name: fbUser.displayName || '',
                  email: fbUser.email || '',
                }),
              });
            } catch (err) {
              console.error('Failed to sync user profile:', err);
            }
          } else {
            setUser(null);
            localStorage.removeItem('socialhomes-auth-mode');
          }
          setLoading(false);
        });
      })
      .catch((err) => {
        console.error('Firebase initialization failed:', err);
        setLoading(false);
      });

    return () => {
      unsubscribe?.();
    };
  }, []);

  const handleSignOut = async () => {
    await firebaseSignOut();
    setUser(null);
    localStorage.removeItem('socialhomes-auth-mode');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        firebaseReady,
        signOut: handleSignOut,
        getToken: getIdToken,
      }}
    >
      {loading ? (
        <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
            <p className="text-text-muted text-sm">Loading SocialHomes.Ai...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
