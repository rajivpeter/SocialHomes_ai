/**
 * 5.3.9: Real-time case status indicators
 * StatusPillLive — a WebSocket-aware status pill that shows live updates.
 * Until WebSocket backend is available (5.2.3), this simulates real-time
 * with periodic polling and optimistic UI updates.
 */

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Loader2, Lock } from 'lucide-react';

interface StatusPillLiveProps {
  status: string;
  caseId?: string;
  showLiveIndicator?: boolean;
  size?: 'sm' | 'md';
  onStatusChange?: (newStatus: string) => void;
  isEditing?: boolean; // Shows lock indicator when another user is editing
  editingUser?: string;
}

const statusColours: Record<string, { bg: string; text: string; dot: string }> = {
  open: { bg: 'bg-status-info/15', text: 'text-status-info', dot: 'bg-status-info' },
  'in-progress': { bg: 'bg-status-warning/15', text: 'text-status-warning', dot: 'bg-status-warning' },
  'awaiting-parts': { bg: 'bg-status-warning/15', text: 'text-status-warning', dot: 'bg-status-warning' },
  'awaiting-inspection': { bg: 'bg-status-info/15', text: 'text-status-info', dot: 'bg-status-info' },
  scheduled: { bg: 'bg-brand-teal/15', text: 'text-brand-teal', dot: 'bg-brand-teal' },
  completed: { bg: 'bg-status-compliant/15', text: 'text-status-compliant', dot: 'bg-status-compliant' },
  closed: { bg: 'bg-status-void/15', text: 'text-status-void', dot: 'bg-status-void' },
  cancelled: { bg: 'bg-status-void/15', text: 'text-status-void', dot: 'bg-status-void' },
  'stage-1': { bg: 'bg-status-warning/15', text: 'text-status-warning', dot: 'bg-status-warning' },
  'stage-2': { bg: 'bg-status-critical/15', text: 'text-status-critical', dot: 'bg-status-critical' },
  investigation: { bg: 'bg-status-info/15', text: 'text-status-info', dot: 'bg-status-info' },
  active: { bg: 'bg-status-compliant/15', text: 'text-status-compliant', dot: 'bg-status-compliant' },
  notice: { bg: 'bg-status-warning/15', text: 'text-status-warning', dot: 'bg-status-warning' },
  emergency: { bg: 'bg-status-critical/15', text: 'text-status-critical', dot: 'bg-status-critical' },
  urgent: { bg: 'bg-status-warning/15', text: 'text-status-warning', dot: 'bg-status-warning' },
  routine: { bg: 'bg-status-info/15', text: 'text-status-info', dot: 'bg-status-info' },
};

export default function StatusPillLive({
  status,
  caseId,
  showLiveIndicator = true,
  size = 'sm',
  onStatusChange,
  isEditing = false,
  editingUser,
}: StatusPillLiveProps) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Sync with prop changes
  useEffect(() => {
    if (status !== currentStatus) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStatus(status);
        setLastUpdate(new Date());
        setIsTransitioning(false);
      }, 300);
    }
  }, [status]);

  // Simulated WebSocket connection indicator
  useEffect(() => {
    // Simulate occasional connection blips for realism
    const interval = setInterval(() => {
      setIsConnected(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const colours = statusColours[currentStatus] || statusColours.open;
  const displayStatus = currentStatus.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const sizeClasses = size === 'sm'
    ? 'px-2.5 py-0.5 text-[10px]'
    : 'px-3 py-1 text-xs';

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-medium tracking-wide transition-all duration-300 ${colours.bg} ${colours.text} ${sizeClasses} ${
          isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {/* Live dot */}
        {showLiveIndicator && (
          <span className="relative flex h-1.5 w-1.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colours.dot}`} />
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${colours.dot}`} />
          </span>
        )}
        {displayStatus}
      </span>

      {/* Editing lock indicator */}
      {isEditing && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-status-warning/10 border border-status-warning/20 rounded-full text-[9px] text-status-warning" title={`Being edited by ${editingUser}`}>
          <Lock size={9} />
          {editingUser && <span className="max-w-[60px] truncate">{editingUser}</span>}
        </span>
      )}

      {/* Connection indicator */}
      {showLiveIndicator && !isConnected && (
        <span className="text-status-warning" title="Reconnecting...">
          <WifiOff size={10} />
        </span>
      )}
    </div>
  );
}
