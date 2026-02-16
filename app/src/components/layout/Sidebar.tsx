import { NavLink } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import {
  Map, LayoutDashboard, Users, Building2, Wrench, PoundSterling,
  Shield, MessageSquareWarning, Home, AlertTriangle, Mail,
  BarChart3, Brain, Settings, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';

const navSections = [
  {
    label: 'NAVIGATE',
    items: [
      { to: '/explore', icon: Map, label: 'Explore' },
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'MANAGE',
    items: [
      { to: '/tenancies', icon: Users, label: 'Tenancies' },
      { to: '/properties', icon: Building2, label: 'Properties' },
      { to: '/repairs', icon: Wrench, label: 'Repairs', badge: 15 },
      { to: '/rent', icon: PoundSterling, label: 'Rent & Income' },
      { to: '/compliance', icon: Shield, label: 'Compliance' },
      { to: '/complaints', icon: MessageSquareWarning, label: 'Complaints', badge: 5 },
      { to: '/allocations', icon: Home, label: 'Allocations' },
      { to: '/asb', icon: AlertTriangle, label: 'ASB' },
    ],
  },
  {
    label: 'COMMUNICATE',
    items: [
      { to: '/communications', icon: Mail, label: 'Communications', badge: 3 },
    ],
  },
  {
    label: 'ANALYSE',
    items: [
      { to: '/reports', icon: BarChart3, label: 'Reports' },
      { to: '/ai', icon: Brain, label: 'AI Centre' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/admin', icon: Settings, label: 'Admin' },
    ],
  },
];

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const collapsed = state.sidebarCollapsed;

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-surface-card/80 backdrop-blur-xl border-r border-border-default z-40 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-[280px]'
      }`}
    >
      {/* Subtle gradient edge glow on right border */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-brand-teal/20 via-brand-teal/5 to-transparent" />

      {/* Logo area */}
      <div className="p-4 border-b border-border-default flex items-center gap-3 relative">
        {!collapsed && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-teal/10 blur-xl rounded-full" />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 751 772" width="28" height="29" className="shrink-0 relative">
                <path fill="#058995" d="M745.51,390.8l-95.41-91.94-41.32,42.88,48.94,47.16-250.45,254.19-1.31-194.04,12.47-12.74-.31-.3,143.2-143.64.08.08,42.88-42.58-.29-.29,1-1-41.76-41.63-.79.79L377.89,21.94l-1.41,1.4-.43-.44L10.05,385.9l.67.67-2.57,2.54,325.25,328.97-.16.16,12.35,12.17,30.65,31,.41-.4,2.02,1.99,324.99-329.84.55.53,41.32-42.88ZM345.09,452.5l1.28,189.95-251.12-253.99,92.74-91.98,144.76,141.66-1.03,1.03,13.37,13.33ZM375.98,394.78l-144.51-141.42,146.65-145.45,141.65,142.63-143.79,144.23Z"/>
              </svg>
            </div>
            <div>
              <span className="text-brand-teal font-heading font-bold text-sm tracking-wide">
                SocialHomes<span className="text-gradient-ai">.Ai</span>
              </span>
              <span className="text-text-muted text-[10px] block tracking-wider">by Yantra.Works</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto relative">
            <div className="absolute inset-0 bg-brand-teal/10 blur-xl rounded-full" />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 751 772" width="24" height="25" className="relative">
              <path fill="#058995" d="M745.51,390.8l-95.41-91.94-41.32,42.88,48.94,47.16-250.45,254.19-1.31-194.04,12.47-12.74-.31-.3,143.2-143.64.08.08,42.88-42.58-.29-.29,1-1-41.76-41.63-.79.79L377.89,21.94l-1.41,1.4-.43-.44L10.05,385.9l.67.67-2.57,2.54,325.25,328.97-.16.16,12.35,12.17,30.65,31,.41-.4,2.02,1.99,324.99-329.84.55.53,41.32-42.88ZM345.09,452.5l1.28,189.95-251.12-253.99,92.74-91.98,144.76,141.66-1.03,1.03,13.37,13.33ZM375.98,394.78l-144.51-141.42,146.65-145.45,141.65,142.63-143.79,144.23Z"/>
            </svg>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        {navSections.map((section) => (
          <div key={section.label} className="mb-1">
            {!collapsed && (
              <div className="px-5 py-2 text-[10px] uppercase tracking-[0.2em] text-brand-teal/70 font-semibold">
                {section.label}
              </div>
            )}
            {collapsed && <div className="my-1 mx-3 h-px bg-border-default" />}
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 mx-2 rounded-lg text-sm transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-brand-teal/10 text-brand-teal nav-active-indicator'
                      : 'text-text-muted hover:bg-surface-hover hover:text-text-primary'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={18} className="shrink-0 transition-colors duration-200" />
                {!collapsed && (
                  <span className="flex-1 font-medium">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="bg-brand-garnet/90 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-sm shadow-brand-garnet/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border-default p-3">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-all duration-200 text-sm"
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /> <span className="font-medium">Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
