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

        {/* Yantra Works Footer */}
        <footer className="border-t border-border-default py-5 px-4 sm:px-6 mt-8 mb-14 lg:mb-0 relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-teal/10 to-transparent" />
          <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
            <a href="https://yantra.works" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-brand-teal transition-colors">
              <img src="/yantra-logo-teal.svg" alt="Yantra Works" width="16" height="16" className="opacity-60 hover:opacity-100 transition-opacity" />
              <span>Made by <strong className="text-text-secondary">Yantra Works</strong></span>
            </a>
            <div className="flex items-center gap-3 text-[10px] sm:text-xs">
              <span>© 2026 Yantra Works. All rights reserved.</span>
              <span className="text-border-default">|</span>
              <a href="https://yantra.works/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-brand-teal transition-colors">Privacy Policy</a>
            </div>
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
