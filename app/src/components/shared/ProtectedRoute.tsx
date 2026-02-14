// ============================================================
// SocialHomes.Ai — Protected Route
// Redirects unauthenticated users to /login.
// ============================================================

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, firebaseReady } = useAuth();
  const location = useLocation();

  // Still initializing — show nothing (AuthProvider shows spinner)
  if (loading) return null;

  // Firebase not configured — allow access (dev mode / no auth configured)
  if (firebaseReady && !user) {
    // Check if Firebase was actually configured (API key present)
    // If not configured, allow through for backward compatibility
    const authMode = localStorage.getItem('socialhomes-auth-mode');
    if (authMode !== 'firebase' && !user) {
      // No Firebase auth configured or user never logged in via Firebase
      // For now, allow access in dev mode; in production, redirect to login
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
