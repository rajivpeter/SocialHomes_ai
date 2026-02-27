import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import {
  Bell, X, Check, CheckCheck, Settings, Wrench, Shield, PoundSterling,
  AlertTriangle, Sparkles, Info, Volume2, VolumeX
} from 'lucide-react';
import type { Notification } from '@/types';

const categoryIcons: Record<string, typeof Bell> = {
  repair: Wrench,
  compliance: Shield,
  arrears: PoundSterling,
  asb: AlertTriangle,
  ai: Sparkles,
  system: Info,
};

const categoryColors: Record<string, string> = {
  urgent: 'bg-status-critical',
  warning: 'bg-status-warning',
  info: 'bg-status-info',
  ai: 'bg-status-ai',
};

export default function NotificationBell() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [animateCount, setAnimateCount] = useState(false);

  const unreadCount = state.notifications.filter(n => !n.read).length;
  const filtered = filter === 'unread'
    ? state.notifications.filter(n => !n.read)
    : state.notifications;

  // Animate badge when count changes
  useEffect(() => {
    if (unreadCount > 0) {
      setAnimateCount(true);
      const timer = setTimeout(() => setAnimateCount(false), 600);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleNotificationClick = (n: Notification) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: n.id });
    if (n.entityType && n.entityId) {
      const routes: Record<string, string> = {
        repair: '/repairs',
        property: '/properties',
        tenant: '/tenancies',
        complaint: '/complaints',
        case: '/repairs',
      };
      const base = routes[n.entityType] || '/dashboard';
      navigate(`${base}/${n.entityId}`);
    }
    setIsOpen(false);
  };

  const handleMarkAllRead = () => {
    state.notifications.forEach(n => {
      if (!n.read) dispatch({ type: 'MARK_NOTIFICATION_READ', payload: n.id });
    });
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-surface-hover transition-all duration-200"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell size={18} className="text-text-secondary" />
        {unreadCount > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 bg-brand-garnet text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm shadow-brand-garnet/40 ${animateCount ? 'animate-count-up' : ''}`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-96 glass-card-elevated rounded-xl shadow-2xl animate-slide-in-down max-h-[80vh] flex flex-col z-50">
          {/* Header */}
          <div className="p-3 border-b border-border-default flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-brand-garnet/15 text-brand-garnet text-[10px] px-1.5 py-0.5 rounded-full font-bold">{unreadCount}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted transition-all"
                title={soundEnabled ? 'Mute notifications' : 'Unmute notifications'}
              >
                {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted transition-all"
                  title="Mark all as read"
                >
                  <CheckCheck size={13} />
                </button>
              )}
              <button
                onClick={() => { setIsOpen(false); navigate('/admin/notifications'); }}
                className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted transition-all"
                title="Notification preferences"
              >
                <Settings size={13} />
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex px-3 pt-2 gap-1">
            {(['all', 'unread'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  filter === f ? 'bg-brand-teal/15 text-brand-teal' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {f === 'all' ? 'All' : `Unread (${unreadCount})`}
              </button>
            ))}
          </div>

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={24} className="text-text-muted mx-auto mb-2 opacity-30" />
                <p className="text-xs text-text-muted">No {filter === 'unread' ? 'unread ' : ''}notifications</p>
              </div>
            ) : (
              filtered.map(n => {
                const CategoryIcon = categoryIcons[n.entityType || 'system'] || Info;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`px-3 py-2.5 cursor-pointer hover:bg-surface-hover transition-colors border-b border-border-subtle ${
                      !n.read ? 'bg-surface-card/40' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="relative mt-0.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          n.type === 'urgent' ? 'bg-status-critical/10' :
                          n.type === 'warning' ? 'bg-status-warning/10' :
                          n.type === 'ai' ? 'bg-status-ai/10' :
                          'bg-status-info/10'
                        }`}>
                          <CategoryIcon size={13} className={
                            n.type === 'urgent' ? 'text-status-critical' :
                            n.type === 'warning' ? 'text-status-warning' :
                            n.type === 'ai' ? 'text-status-ai' :
                            'text-status-info'
                          } />
                        </div>
                        {!n.read && (
                          <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${categoryColors[n.type] || 'bg-status-info'} ring-2 ring-surface-elevated`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm text-text-primary font-medium truncate">{n.title}</div>
                          <span className="text-[10px] text-text-muted whitespace-nowrap">{getTimeAgo(n.date)}</span>
                        </div>
                        <div className="text-xs text-text-muted mt-0.5 line-clamp-2">{n.message}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-border-default">
            <button
              onClick={() => { setIsOpen(false); navigate('/admin/notifications'); }}
              className="w-full py-1.5 text-xs text-brand-teal hover:text-brand-teal/80 font-medium transition-colors"
            >
              View all & manage preferences →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
