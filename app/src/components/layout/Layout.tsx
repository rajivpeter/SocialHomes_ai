/**
 * Layout — Main application shell
 * 5.3.8: Enhanced with mobile-responsive adaptations
 * - Collapsible sidebar (hamburger on tablet/mobile)
 * - Touch-friendly controls
 * - Bottom navigation bar on mobile
 * - Responsive content padding
 */

import { useEffect } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import Sidebar from './Sidebar';
import Header from './Header';
import YantraAssist from './YantraAssist';
import Breadcrumbs from './Breadcrumbs';
import {
  LayoutDashboard, Building2, Wrench, Users, Brain, BarChart3, Map, Shield
} from 'lucide-react';

const mobileNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/properties', icon: Building2, label: 'Properties' },
  { to: '/repairs', icon: Wrench, label: 'Repairs' },
  { to: '/tenancies', icon: Users, label: 'Tenancies' },
  { to: '/ai', icon: Brain, label: 'AI' },
];

export default function Layout() {
  const { state, dispatch } = useApp();
  const location = useLocation();

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && !state.sidebarCollapsed) {
        dispatch({ type: 'TOGGLE_SIDEBAR' });
      }
    };
    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Run only on mount

  // Full-screen pages (no shell)
  const fullScreenPaths = ['/briefing', '/tenant-portal'];
  const isFullScreen = fullScreenPaths.some(p => location.pathname.startsWith(p));

  if (isFullScreen) {
    return (
      <>
        <div className="bg-pattern" />
        <YantraAssist />
        <Outlet />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-surface-dark">
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
      <div className="bg-pattern" />

      {/* Mobile overlay when sidebar is open */}
      {!state.sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        />
      )}

      {/* Sidebar — hidden on mobile when collapsed */}
      <div className={`hidden lg:block`}>
        <Sidebar />
      </div>
      <div className={`lg:hidden ${state.sidebarCollapsed ? 'hidden' : 'block'}`}>
        <Sidebar />
      </div>

      <Header />
      <YantraAssist />

      <main
        id="main-content"
        className="pt-14 pb-16 lg:pb-0 transition-all duration-300 relative z-10"
        style={{ marginLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 ? (state.sidebarCollapsed ? 64 : 280) : 0 }}
      >
        <Breadcrumbs />
        <div className="p-3 sm:p-4 md:p-6 max-w-[1400px] mx-auto">
          <Outlet />
        </div>

        {/* Footer — hidden on mobile */}
        <footer className="hidden md:block border-t border-border-default py-5 px-6 mt-8 relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-teal/10 to-transparent" />
          <div className="max-w-[1400px] mx-auto flex items-center justify-between text-xs text-text-muted">
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 751 772" width="12" height="12" className="opacity-40">
                <path fill="currentColor" d="M745.51,390.8l-95.41-91.94-41.32,42.88,48.94,47.16-250.45,254.19-1.31-194.04,12.47-12.74-.31-.3,143.2-143.64.08.08,42.88-42.58-.29-.29,1-1-41.76-41.63-.79.79L377.89,21.94l-1.41,1.4-.43-.44L10.05,385.9l.67.67-2.57,2.54,325.25,328.97-.16.16,12.35,12.17,30.65,31,.41-.4,2.02,1.99,324.99-329.84.55.53,41.32-42.88ZM345.09,452.5l1.28,189.95-251.12-253.99,92.74-91.98,144.76,141.66-1.03,1.03,13.37,13.33ZM375.98,394.78l-144.51-141.42,146.65-145.45,141.65,142.63-143.79,144.23Z"/>
              </svg>
              SocialHomes.Ai is an open-source project by Yantra.Works — www.socialhomes.ai
            </span>
            <span className="text-[10px] text-text-muted/60 tracking-wider uppercase">AI-native. Human-assured.</span>
          </div>
        </footer>
      </main>

      {/* Mobile bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-14 bg-surface-card/95 backdrop-blur-xl border-t border-border-default z-30 flex items-center justify-around lg:hidden" aria-label="Mobile navigation">
        {mobileNavItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${
                isActive ? 'text-brand-teal' : 'text-text-muted'
              }`
            }
          >
            <item.icon size={20} />
            <span className="text-[9px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
