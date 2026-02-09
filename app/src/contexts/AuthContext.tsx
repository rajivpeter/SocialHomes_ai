import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthChange, signIn, signOut, getIdToken, type auth } from '../services/firebase';
import type { User } from 'firebase/auth';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  persona: string;
  teamId?: string;
  patchIds?: string[];
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  /** True when using legacy X-Persona mode (no Firebase login) */
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(() => {
    return localStorage.getItem('socialhomes-auth-mode') !== 'firebase';
  });

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser && !isDemoMode) {
        // Fetch user profile from server
        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch('/api/v1/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const profileData = await res.json();
            setProfile(profileData);
            // Sync persona to localStorage for components that read it
            localStorage.setItem('socialhomes-persona', profileData.persona);
          }
        } catch {
          // Profile fetch failed — still authenticated but no profile
          console.warn('Could not fetch user profile');
        }
      } else if (isDemoMode) {
        // In demo mode, use the persona from localStorage
        const persona = localStorage.getItem('socialhomes-persona') || 'housing-officer';
        setProfile({
          uid: 'demo',
          email: `${persona}@rcha.org.uk`,
          displayName: persona.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
          persona,
        });
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [isDemoMode]);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      await signIn(email, password);
      setIsDemoMode(false);
      localStorage.setItem('socialhomes-auth-mode', 'firebase');
    } catch (err: any) {
      const message =
        err.code === 'auth/user-not-found'
          ? 'No account found with this email'
          : err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
          ? 'Incorrect password'
          : err.code === 'auth/too-many-requests'
          ? 'Too many attempts. Please try again later.'
          : 'Login failed. Please try again.';
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    await signOut();
    setProfile(null);
    setIsDemoMode(true);
    localStorage.setItem('socialhomes-auth-mode', 'demo');
    localStorage.setItem('socialhomes-persona', 'housing-officer');
  };

  const setDemoMode = (enabled: boolean) => {
    setIsDemoMode(enabled);
    localStorage.setItem('socialhomes-auth-mode', enabled ? 'demo' : 'firebase');
    if (enabled) {
      setLoading(false);
      const persona = localStorage.getItem('socialhomes-persona') || 'housing-officer';
      setProfile({
        uid: 'demo',
        email: `${persona}@rcha.org.uk`,
        displayName: persona.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
        persona,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        login,
        logout,
        isAuthenticated: isDemoMode || !!user,
        isDemoMode,
        setDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
