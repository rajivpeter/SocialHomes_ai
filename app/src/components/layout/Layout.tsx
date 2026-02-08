import { Outlet, useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import Sidebar from './Sidebar';
import Header from './Header';
import YantraAssist from './YantraAssist';
import Breadcrumbs from './Breadcrumbs';

export default function Layout() {
  const { state } = useApp();
  const location = useLocation();

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
      <div className="bg-pattern" />
      <Sidebar />
      <Header />
      <YantraAssist />
      <main
        className="pt-14 transition-all duration-300 relative z-10"
        style={{ marginLeft: state.sidebarCollapsed ? 64 : 280 }}
      >
        <Breadcrumbs />
        <div className="p-6 max-w-[1400px] mx-auto">
          <Outlet />
        </div>

        {/* Footer */}
        <footer className="border-t border-border-default py-5 px-6 mt-8 relative">
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
    </div>
  );
}
