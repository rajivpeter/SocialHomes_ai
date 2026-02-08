import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Search, Bell, Sparkles, ChevronDown, User } from 'lucide-react';
import type { Persona } from '@/types';
import { getInitials } from '@/utils/format';

const personas: { id: Persona; label: string; description: string }[] = [
  { id: 'coo', label: 'Chief Operating Officer', description: 'Strategic portfolio view' },
  { id: 'head-of-service', label: 'Head of Housing', description: 'Service area operations' },
  { id: 'manager', label: 'Team Manager', description: 'Team management view' },
  { id: 'housing-officer', label: 'Housing Officer', description: 'Frontline caseload view' },
  { id: 'operative', label: 'Repairs Operative', description: 'Mobile job view' },
];

export default function Header() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPersona, setShowPersona] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const unreadCount = state.notifications.filter(n => !n.read).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: searchValue });
      navigate('/search');
    }
  };

  return (
    <header
      className="fixed top-0 right-0 h-14 bg-surface-dark/80 backdrop-blur-xl border-b border-border-default z-30 flex items-center px-5 gap-4"
      style={{ left: state.sidebarCollapsed ? 64 : 280 }}
    >
      {/* Subtle bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-teal/15 to-transparent" />

      {/* Branding (mobile) */}
      <div className="lg:hidden flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 751 772" width="24" height="25">
          <path fill="#058995" d="M745.51,390.8l-95.41-91.94-41.32,42.88,48.94,47.16-250.45,254.19-1.31-194.04,12.47-12.74-.31-.3,143.2-143.64.08.08,42.88-42.58-.29-.29,1-1-41.76-41.63-.79.79L377.89,21.94l-1.41,1.4-.43-.44L10.05,385.9l.67.67-2.57,2.54,325.25,328.97-.16.16,12.35,12.17,30.65,31,.41-.4,2.02,1.99,324.99-329.84.55.53,41.32-42.88ZM345.09,452.5l1.28,189.95-251.12-253.99,92.74-91.98,144.76,141.66-1.03,1.03,13.37,13.33ZM375.98,394.78l-144.51-141.42,146.65-145.45,141.65,142.63-143.79,144.23Z"/>
        </svg>
      </div>

      {/* BETA badge */}
      <span className="bg-gradient-to-r from-brand-garnet to-brand-garnet/80 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm shadow-brand-garnet/20">BETA</span>

      {/* Global Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto">
        <div className="relative group">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-brand-teal" />
          <input
            type="text"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            placeholder="Search tenants, properties, cases..."
            className="w-full bg-surface-card/60 border border-border-default rounded-xl pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus-ring"
          />
        </div>
      </form>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-surface-hover transition-all duration-200"
          >
            <Bell size={18} className="text-text-secondary" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-brand-garnet text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm shadow-brand-garnet/40">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 glass-card-elevated rounded-xl shadow-2xl animate-slide-in-down max-h-96 overflow-y-auto z-50">
              <div className="p-3 border-b border-border-default">
                <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
              </div>
              {state.notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => { dispatch({ type: 'MARK_NOTIFICATION_READ', payload: n.id }); setShowNotifications(false); }}
                  className={`p-3 border-b border-border-subtle cursor-pointer hover:bg-surface-hover transition-colors ${!n.read ? 'bg-surface-card/40' : ''}`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      n.type === 'urgent' ? 'bg-status-critical shadow-sm shadow-status-critical/50' : n.type === 'warning' ? 'bg-status-warning' : n.type === 'ai' ? 'bg-status-ai' : 'bg-status-info'
                    }`} />
                    <div>
                      <div className="text-sm text-text-primary font-medium">{n.title}</div>
                      <div className="text-xs text-text-muted mt-0.5">{n.message}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Assist trigger */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_YANTRA_ASSIST' })}
          className="relative p-2 rounded-lg hover:bg-surface-hover transition-all duration-200"
        >
          <div className={`${state.yantraAssistOpen ? '' : 'animate-pulse-glow'} rounded-lg`}>
            <Sparkles size={18} className="text-status-ai" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-br from-status-ai to-status-ai/70 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm shadow-status-ai/30">
            8
          </span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-border-default mx-1" />

        {/* User / Persona */}
        <div className="relative">
          <button
            onClick={() => setShowPersona(!showPersona)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-surface-hover transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal/30 to-brand-deep/30 flex items-center justify-center text-brand-teal text-xs font-bold ring-1 ring-brand-teal/20">
              {getInitials(state.user.name)}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm text-text-primary leading-tight font-medium">{state.user.name}</div>
              <div className="text-[10px] text-text-muted">{state.user.role}</div>
            </div>
            <ChevronDown size={14} className="text-text-muted" />
          </button>

          {showPersona && (
            <div className="absolute right-0 top-12 w-72 glass-card-elevated rounded-xl shadow-2xl animate-slide-in-down z-50">
              <div className="p-3 border-b border-border-default">
                <h3 className="text-sm font-semibold text-text-primary">Switch Persona</h3>
                <p className="text-[10px] text-text-muted mt-0.5">Changes what you see across the entire system</p>
              </div>
              {personas.map(p => (
                <button
                  key={p.id}
                  onClick={() => { dispatch({ type: 'SET_PERSONA', payload: p.id }); setShowPersona(false); }}
                  className={`w-full text-left p-3 flex items-center gap-3 hover:bg-surface-hover transition-all duration-200 ${
                    state.persona === p.id ? 'bg-brand-teal/8' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                    state.persona === p.id
                      ? 'bg-gradient-to-br from-brand-teal to-brand-deep text-white shadow-sm shadow-brand-teal/30'
                      : 'bg-surface-card text-text-muted'
                  }`}>
                    <User size={14} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-text-primary">{p.label}</div>
                    <div className="text-[10px] text-text-muted">{p.description}</div>
                  </div>
                  {state.persona === p.id && (
                    <span className="text-brand-teal text-[10px] font-semibold uppercase tracking-wider">Active</span>
                  )}
                </button>
              ))}
              <div className="p-3 border-t border-border-default">
                <button
                  onClick={() => { navigate('/tenant-portal'); setShowPersona(false); }}
                  className="text-xs text-brand-teal hover:text-brand-teal/80 transition-colors font-medium"
                >
                  Open Tenant Portal →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      {(showNotifications || showPersona) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowNotifications(false); setShowPersona(false); }}
        />
      )}
    </header>
  );
}
