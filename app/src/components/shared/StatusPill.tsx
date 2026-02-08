import { getStatusColour } from '@/utils/format';

interface StatusPillProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export default function StatusPill({ status, label, size = 'sm', pulse }: StatusPillProps) {
  const colour = getStatusColour(status);
  return (
    <span className={`status-pill ${colour} ${size === 'md' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-[11px]'} ${pulse ? 'animate-pulse-critical' : ''} font-semibold`}>
      {label || status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
}
