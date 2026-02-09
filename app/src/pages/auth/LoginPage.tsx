// ============================================================
// SocialHomes.Ai — Login Page
// Uses FirebaseUI drop-in widget for Email/Password + Google.
// Redirects to /dashboard once authenticated.
// ============================================================

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { firebase, getFirebaseAuth } from '@/services/firebase';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';

export default function LoginPage() {
  const { user, firebaseReady } = useAuth();
  const navigate = useNavigate();
  const uiContainerRef = useRef<HTMLDivElement>(null);
  const uiRef = useRef<firebaseui.auth.AuthUI | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Render FirebaseUI widget
  useEffect(() => {
    if (!firebaseReady || user) return;

    const auth = getFirebaseAuth();
    if (!auth || !uiContainerRef.current) return;

    const uiConfig: firebaseui.auth.Config = {
      signInFlow: 'popup',
      signInSuccessUrl: '/dashboard',
      signInOptions: [
        // Email / Password provider
        // requireDisplayName: false prevents the "First & last name" field
        // from appearing when email enumeration protection is enabled
        // (Firebase can't check if an email exists, so defaults to register form).
        {
          provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
          requireDisplayName: false,
        },
        // Google provider with popup mode
        {
          provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
          customParameters: {
            prompt: 'select_account',
          },
        },
      ],
      // Prevent auto-upgrade for anonymous users
      autoUpgradeAnonymousUsers: false,
      callbacks: {
        signInSuccessWithAuthResult: () => {
          // Don't redirect — let onAuthStateChanged handle navigation
          return false;
        },
      },
      tosUrl: '#',
      privacyPolicyUrl: '#',
    };

    // Get or create FirebaseUI instance
    if (!uiRef.current) {
      uiRef.current =
        firebaseui.auth.AuthUI.getInstance() ||
        new firebaseui.auth.AuthUI(auth);
    }

    // Start the widget
    uiRef.current.start(uiContainerRef.current, uiConfig);

    return () => {
      uiRef.current?.reset();
    };
  }, [firebaseReady, user]);

  // Don't show login page if already authenticated
  if (user) return null;

  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center px-4">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-brand-deep/20 via-transparent to-brand-teal/5 pointer-events-none" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Logo & Branding */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 751 772"
              width="48"
              height="50"
            >
              <path
                fill="#058995"
                d="M745.51,390.8l-95.41-91.94-41.32,42.88,48.94,47.16-250.45,254.19-1.31-194.04,12.47-12.74-.31-.3,143.2-143.64.08.08,42.88-42.58-.29-.29,1-1-41.76-41.63-.79.79L377.89,21.94l-1.41,1.4-.43-.44L10.05,385.9l.67.67-2.57,2.54,325.25,328.97-.16.16,12.35,12.17,30.65,31,.41-.4,2.02,1.99,324.99-329.84.55.53,41.32-42.88ZM345.09,452.5l1.28,189.95-251.12-253.99,92.74-91.98,144.76,141.66-1.03,1.03,13.37,13.33ZM375.98,394.78l-144.51-141.42,146.65-145.45,141.65,142.63-143.79,144.23Z"
              />
            </svg>
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                SocialHomes<span className="text-brand-teal">.Ai</span>
              </h1>
              <p className="text-[10px] text-text-muted uppercase tracking-[0.25em]">
                by Yantra.Works
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-text-secondary text-sm">
              UK Social Housing Management System
            </p>
            <span className="inline-block bg-gradient-to-r from-brand-garnet to-brand-garnet/80 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              BETA
            </span>
          </div>
        </div>

        {/* FirebaseUI Widget Container */}
        <div className="bg-surface-card/80 backdrop-blur-sm rounded-2xl border border-border-default p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-text-primary text-center mb-6">
            Sign in to continue
          </h2>

          {!firebaseReady ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
            </div>
          ) : (
            <div
              ref={uiContainerRef}
              id="firebaseui-auth-container"
              className="firebaseui-dark"
            />
          )}
        </div>

        {/* Demo credentials hint */}
        <div className="bg-surface-card/40 rounded-xl border border-border-subtle p-4 text-center">
          <p className="text-text-muted text-xs mb-2">Demo Accounts</p>
          <div className="space-y-1">
            <p className="text-text-secondary text-xs">
              <span className="text-brand-teal font-mono">sarah.mitchell@rcha.org.uk</span>
            </p>
            <p className="text-text-secondary text-xs">
              Password: <span className="text-brand-teal font-mono">Provided separately</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-text-muted text-[10px]">
          &copy; 2026 Yantra.Works Ltd. All rights reserved.
        </p>
      </div>

      {/* FirebaseUI dark theme overrides */}
      <style>{`
        .firebaseui-dark .firebaseui-container {
          background: transparent !important;
          font-family: inherit !important;
          max-width: 100% !important;
        }
        .firebaseui-dark .firebaseui-card-content {
          padding: 0 !important;
        }
        .firebaseui-dark .firebaseui-card-header {
          display: none !important;
        }
        .firebaseui-dark .firebaseui-card-actions {
          padding: 0 !important;
        }
        .firebaseui-dark .mdl-button--raised.mdl-button--colored {
          background-color: #058995 !important;
          border-radius: 0.75rem !important;
          font-weight: 600 !important;
          text-transform: none !important;
          letter-spacing: 0 !important;
          height: 44px !important;
          font-size: 14px !important;
        }
        .firebaseui-dark .mdl-button--raised.mdl-button--colored:hover {
          background-color: #047a85 !important;
        }
        .firebaseui-dark .firebaseui-idp-button {
          border-radius: 0.75rem !important;
          max-width: 100% !important;
          height: 44px !important;
          border: 1px solid #1E2A3A !important;
          background: #161B22 !important;
        }
        .firebaseui-dark .firebaseui-idp-text {
          color: #E6EDF3 !important;
          font-weight: 500 !important;
          font-size: 14px !important;
        }
        .firebaseui-dark .firebaseui-idp-google > .firebaseui-idp-text {
          color: #E6EDF3 !important;
        }
        .firebaseui-dark .mdl-textfield__input {
          background: #161B22 !important;
          border: 1px solid #1E2A3A !important;
          border-radius: 0.75rem !important;
          color: #E6EDF3 !important;
          padding: 12px 16px !important;
          font-size: 14px !important;
        }
        .firebaseui-dark .mdl-textfield__input:focus {
          border-color: #058995 !important;
          outline: none !important;
          box-shadow: 0 0 0 2px rgba(5, 137, 149, 0.2) !important;
        }
        .firebaseui-dark .mdl-textfield__label {
          color: #6B7B8D !important;
          font-size: 14px !important;
        }
        .firebaseui-dark .mdl-textfield__label:after {
          background-color: #058995 !important;
        }
        .firebaseui-dark .firebaseui-link {
          color: #058995 !important;
        }
        .firebaseui-dark .firebaseui-label {
          color: #8B949E !important;
        }
        .firebaseui-dark .firebaseui-subtitle,
        .firebaseui-dark .firebaseui-text {
          color: #8B949E !important;
        }
        .firebaseui-dark .firebaseui-error {
          color: #BE3358 !important;
        }
        .firebaseui-dark .mdl-progress > .progressbar {
          background-color: #058995 !important;
        }
        .firebaseui-dark .mdl-progress > .bufferbar {
          background: #161B22 !important;
        }
        .firebaseui-dark .mdl-shadow--2dp {
          box-shadow: none !important;
        }
        .firebaseui-dark .firebaseui-tos {
          color: #6B7B8D !important;
        }
        .firebaseui-dark .firebaseui-tos a {
          color: #058995 !important;
        }
      `}</style>
    </div>
  );
}
