// ============================================================
// SocialHomes.Ai — Login Page
// Uses FirebaseUI drop-in widget for Email/Password + Google.
// Redirects to /dashboard once authenticated.
// Includes product showcase, mobile detection, and access info.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { firebase, getFirebaseAuth } from '@/services/firebase';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import {
  BarChart3, Shield, Brain, Building2, Users, Wrench,
  PoundSterling, MessageSquare, Map, Clock, Sparkles,
  Monitor, ChevronLeft, ChevronRight, Mail, Smartphone
} from 'lucide-react';

// ---- Showcase slides (SVG-illustrated feature cards) ----
const showcaseSlides = [
  {
    title: 'AI-Native Housing Management',
    description: 'The UK social housing sector\'s first AI-powered operating system. Dynamic AI buttons, proactive damp prevention, and intelligent case triage.',
    icon: Brain,
    gradient: 'from-brand-teal to-brand-blue',
    features: ['Yantra Assist on every page', '8 AI prediction models', 'Natural language queries'],
  },
  {
    title: 'Geographical Drill-Down',
    description: 'Navigate your entire portfolio visually. Country to Region to Estate to Block to Unit to Tenant — all on an interactive map.',
    icon: Map,
    gradient: 'from-brand-blue to-brand-deep',
    features: ['OpenStreetMap integration', '3D building visualisation', 'Heat maps & risk overlays'],
  },
  {
    title: 'Awaab\'s Law Compliance',
    description: 'Real-time countdown timers for every damp & mould case. Never miss a deadline. Emergency 24hrs, Significant Hazard tracked to the minute.',
    icon: Clock,
    gradient: 'from-brand-garnet to-brand-peach',
    features: ['Emergency deadline tracking', 'Working day calculators', 'Automated escalation alerts'],
  },
  {
    title: 'Big 6 Compliance Dashboard',
    description: 'Gas, Electrical, Fire, Asbestos, Legionella, Lifts — all in one view with RAG status, expiry tracking, and automated alerts.',
    icon: Shield,
    gradient: 'from-status-compliant to-brand-teal',
    features: ['99.2% gas compliance', 'Certificate expiry alerts', 'Regulator-ready reports'],
  },
  {
    title: '5-Persona System',
    description: 'From COO to Housing Officer to Operative — each persona sees exactly what they need. Filtered KPIs, scoped data, role-based actions.',
    icon: Users,
    gradient: 'from-brand-peach to-brand-garnet',
    features: ['COO strategic overview', 'Officer patch-level data', 'Operative job lists'],
  },
  {
    title: '30+ Regulatory Reports',
    description: 'TSM, HCLIC, RSH IDA, Board Reports, Awaab\'s Law, Arrears, Voids — all generated instantly from live data. HACT v3.5 compliant.',
    icon: BarChart3,
    gradient: 'from-brand-deep to-brand-teal',
    features: ['One-click generation', 'HACT data standard', 'Board-ready formatting'],
  },
];

// ---- Feature grid items ----
const featureGrid = [
  { icon: Building2, label: 'Properties', count: '5,000+' },
  { icon: Users, label: 'Tenancies', count: '4,800+' },
  { icon: Wrench, label: 'Repairs', count: 'Live Tracking' },
  { icon: PoundSterling, label: 'Rent & Arrears', count: 'AI Prioritised' },
  { icon: Shield, label: 'Compliance', count: 'Big 6' },
  { icon: MessageSquare, label: 'Complaints', count: 'Ombudsman Ready' },
  { icon: Sparkles, label: 'AI Insights', count: 'Real-Time' },
  { icon: BarChart3, label: 'Reports', count: '30+' },
];

export default function LoginPage() {
  const { user, firebaseReady } = useAuth();
  const navigate = useNavigate();
  const uiContainerRef = useRef<HTMLDivElement>(null);
  const uiRef = useRef<firebaseui.auth.AuthUI | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % showcaseSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Render FirebaseUI widget
  useEffect(() => {
    if (!firebaseReady || user || isMobile) return;

    const auth = getFirebaseAuth();
    if (!auth || !uiContainerRef.current) return;

    const uiConfig: firebaseui.auth.Config = {
      signInFlow: 'popup',
      signInSuccessUrl: '/dashboard',
      signInOptions: [
        {
          provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
          requireDisplayName: false,
        },
        {
          provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
          customParameters: { prompt: 'select_account' },
        },
      ],
      autoUpgradeAnonymousUsers: false,
      callbacks: {
        signInSuccessWithAuthResult: () => false,
      },
      tosUrl: '#',
      privacyPolicyUrl: '#',
    };

    if (!uiRef.current) {
      uiRef.current =
        firebaseui.auth.AuthUI.getInstance() ||
        new firebaseui.auth.AuthUI(auth);
    }

    uiRef.current.start(uiContainerRef.current, uiConfig);

    return () => {
      uiRef.current?.reset();
    };
  }, [firebaseReady, user, isMobile]);

  if (user) return null;

  const slide = showcaseSlides[currentSlide];
  const SlideIcon = slide.icon;

  // ---- Mobile Block Screen ----
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center px-6 text-center">
        <div className="fixed inset-0 bg-gradient-to-br from-brand-deep/20 via-transparent to-brand-teal/5 pointer-events-none" />

        <div className="relative z-10 space-y-8 max-w-sm">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 751 772" width="40" height="42">
              <path fill="#058995" d="M745.51,390.8l-95.41-91.94-41.32,42.88,48.94,47.16-250.45,254.19-1.31-194.04,12.47-12.74-.31-.3,143.2-143.64.08.08,42.88-42.58-.29-.29,1-1-41.76-41.63-.79.79L377.89,21.94l-1.41,1.4-.43-.44L10.05,385.9l.67.67-2.57,2.54,325.25,328.97-.16.16,12.35,12.17,30.65,31,.41-.4,2.02,1.99,324.99-329.84.55.53,41.32-42.88ZM345.09,452.5l1.28,189.95-251.12-253.99,92.74-91.98,144.76,141.66-1.03,1.03,13.37,13.33ZM375.98,394.78l-144.51-141.42,146.65-145.45,141.65,142.63-143.79,144.23Z" />
            </svg>
            <div>
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                SocialHomes<span className="text-brand-teal">.Ai</span>
              </h1>
              <p className="text-[9px] text-text-muted uppercase tracking-[0.25em]">by Yantra.Works</p>
            </div>
          </div>

          {/* Mobile Warning */}
          <div className="bg-surface-card/80 backdrop-blur-sm rounded-2xl border border-brand-teal/30 p-8 shadow-2xl space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-teal/10 flex items-center justify-center">
              <Monitor size={32} className="text-brand-teal" />
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-bold text-text-primary">Desktop Required</h2>
              <p className="text-text-secondary text-sm leading-relaxed">
                SocialHomes.Ai is a full housing operating system designed for desktop and laptop computers. 
                The dashboard, maps, reports, and AI tools require a larger screen for the best experience.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-surface-elevated rounded-xl p-4 border border-border-default">
              <Smartphone size={20} className="text-brand-peach shrink-0" />
              <p className="text-xs text-text-muted leading-relaxed text-left">
                A dedicated mobile app for housing officers in the field is on our roadmap. 
                For now, please log in from a desktop or laptop.
              </p>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-2">
            <p className="text-text-muted text-xs">Need help?</p>
            <a href="mailto:support@yantra.works" className="inline-flex items-center gap-2 text-brand-teal text-sm hover:underline">
              <Mail size={14} />
              support@yantra.works
            </a>
          </div>

          <p className="text-text-muted text-[10px]">&copy; 2026 Yantra.Works Ltd.</p>
        </div>
      </div>
    );
  }

  // ---- Desktop Login Page ----
  return (
    <div className="min-h-screen bg-[#0D1117] flex">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-brand-deep/20 via-transparent to-brand-teal/5 pointer-events-none" />

      {/* Left Panel — Product Showcase */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative z-10 flex-col justify-between p-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 751 772" width="40" height="42">
            <path fill="#058995" d="M745.51,390.8l-95.41-91.94-41.32,42.88,48.94,47.16-250.45,254.19-1.31-194.04,12.47-12.74-.31-.3,143.2-143.64.08.08,42.88-42.58-.29-.29,1-1-41.76-41.63-.79.79L377.89,21.94l-1.41,1.4-.43-.44L10.05,385.9l.67.67-2.57,2.54,325.25,328.97-.16.16,12.35,12.17,30.65,31,.41-.4,2.02,1.99,324.99-329.84.55.53,41.32-42.88ZM345.09,452.5l1.28,189.95-251.12-253.99,92.74-91.98,144.76,141.66-1.03,1.03,13.37,13.33ZM375.98,394.78l-144.51-141.42,146.65-145.45,141.65,142.63-143.79,144.23Z" />
          </svg>
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              SocialHomes<span className="text-brand-teal">.Ai</span>
            </h1>
            <p className="text-[10px] text-text-muted uppercase tracking-[0.25em]">by Yantra.Works</p>
          </div>
        </div>

        {/* Showcase Carousel */}
        <div className="flex-1 flex flex-col justify-center max-w-xl">
          <div className="space-y-8">
            {/* Slide */}
            <div className="opacity-0 animate-fade-in-up" key={currentSlide} style={{ animationFillMode: 'forwards' }}>
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                <SlideIcon size={28} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-text-primary tracking-tight mb-3 font-heading">
                {slide.title}
              </h2>
              <p className="text-text-secondary text-base leading-relaxed mb-6">
                {slide.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {slide.features.map((f, i) => (
                  <span key={i} className="text-xs bg-brand-teal/10 text-brand-teal px-3 py-1.5 rounded-full border border-brand-teal/20 font-medium">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Slide Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentSlide(prev => (prev - 1 + showcaseSlides.length) % showcaseSlides.length)}
                className="w-8 h-8 rounded-full border border-border-default flex items-center justify-center text-text-muted hover:text-brand-teal hover:border-brand-teal transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex gap-2">
                {showcaseSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentSlide ? 'w-8 bg-brand-teal' : 'w-3 bg-border-default hover:bg-text-muted'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => setCurrentSlide(prev => (prev + 1) % showcaseSlides.length)}
                className="w-8 h-8 rounded-full border border-border-default flex items-center justify-center text-text-muted hover:text-brand-teal hover:border-brand-teal transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-4 gap-3 pt-4">
              {featureGrid.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="bg-surface-card/40 rounded-xl border border-border-subtle p-3 text-center hover:border-brand-teal/30 transition-colors group">
                    <Icon size={18} className="mx-auto mb-1.5 text-text-muted group-hover:text-brand-teal transition-colors" />
                    <div className="text-[10px] text-text-muted font-medium">{f.label}</div>
                    <div className="text-[10px] text-brand-teal font-bold mt-0.5">{f.count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <p className="text-text-muted text-[10px]">
          &copy; 2026 Yantra.Works Ltd. All rights reserved. Open Source under MIT License.
        </p>
      </div>

      {/* Right Panel — Login */}
      <div className="w-full lg:w-[45%] xl:w-[40%] relative z-10 flex flex-col items-center justify-center px-6 lg:px-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile-only logo (shown when left panel is hidden) */}
          <div className="lg:hidden text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 751 772" width="48" height="50">
                <path fill="#058995" d="M745.51,390.8l-95.41-91.94-41.32,42.88,48.94,47.16-250.45,254.19-1.31-194.04,12.47-12.74-.31-.3,143.2-143.64.08.08,42.88-42.58-.29-.29,1-1-41.76-41.63-.79.79L377.89,21.94l-1.41,1.4-.43-.44L10.05,385.9l.67.67-2.57,2.54,325.25,328.97-.16.16,12.35,12.17,30.65,31,.41-.4,2.02,1.99,324.99-329.84.55.53,41.32-42.88ZM345.09,452.5l1.28,189.95-251.12-253.99,92.74-91.98,144.76,141.66-1.03,1.03,13.37,13.33ZM375.98,394.78l-144.51-141.42,146.65-145.45,141.65,142.63-143.79,144.23Z" />
              </svg>
              <div>
                <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                  SocialHomes<span className="text-brand-teal">.Ai</span>
                </h1>
                <p className="text-[10px] text-text-muted uppercase tracking-[0.25em]">by Yantra.Works</p>
              </div>
            </div>
            <p className="text-text-secondary text-sm">UK Social Housing Management System</p>
          </div>

          {/* Login Card */}
          <div className="bg-surface-card/80 backdrop-blur-sm rounded-2xl border border-border-default p-8 shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-text-primary mb-1">Welcome back</h2>
              <p className="text-text-muted text-sm">Sign in to your housing management system</p>
            </div>

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

          {/* BETA Badge & Access Info */}
          <div className="space-y-4">
            <div className="text-center">
              <span className="inline-block bg-gradient-to-r from-brand-garnet to-brand-garnet/80 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                BETA
              </span>
            </div>

            <div className="bg-surface-card/40 rounded-xl border border-border-subtle p-5 space-y-3">
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-brand-teal shrink-0 mt-0.5" />
                <div>
                  <p className="text-text-secondary text-sm font-medium mb-1">Request Access</p>
                  <p className="text-text-muted text-xs leading-relaxed">
                    SocialHomes.Ai is currently in closed beta. To request access, 
                    please email us with your organisation name and role.
                  </p>
                  <a
                    href="mailto:support@yantra.works?subject=SocialHomes.Ai%20Access%20Request"
                    className="inline-flex items-center gap-1.5 text-brand-teal text-sm font-medium mt-2 hover:underline"
                  >
                    support@yantra.works
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-text-muted text-[10px]">
            &copy; 2026 Yantra.Works Ltd. All rights reserved.
          </p>
        </div>
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
