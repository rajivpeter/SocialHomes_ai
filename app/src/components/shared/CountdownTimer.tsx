import { daysUntil, workingDaysUntil } from '@/utils/format';

interface CountdownTimerProps {
  deadline: string;
  label: string;
  useWorkingDays?: boolean;
  size?: 'sm' | 'lg';
}

export default function CountdownTimer({ deadline, label, useWorkingDays = false, size = 'sm' }: CountdownTimerProps) {
  const days = useWorkingDays ? workingDaysUntil(deadline) : daysUntil(deadline);
  const isBreached = days <= 0;
  const isUrgent = days > 0 && days <= 2;
  const isApproaching = days > 2 && days <= 5;

  const colour = isBreached
    ? 'text-status-critical'
    : isUrgent
    ? 'text-status-critical'
    : isApproaching
    ? 'text-status-warning'
    : 'text-status-compliant';

  const bgColour = isBreached
    ? 'bg-status-critical/8 border-status-critical/20'
    : isUrgent
    ? 'bg-status-critical/8 border-status-critical/20'
    : isApproaching
    ? 'bg-status-warning/8 border-status-warning/20'
    : 'bg-status-compliant/8 border-status-compliant/20';

  return (
    <div className={`rounded-lg border ${bgColour} ${size === 'lg' ? 'p-3' : 'p-2'} ${isBreached ? 'animate-pulse-critical' : ''}`}>
      <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1 font-semibold">{label}</div>
      <div className={`font-mono font-bold ${colour} ${size === 'lg' ? 'text-2xl' : 'text-lg'} tracking-tight`}>
        {isBreached ? (
          <span>BREACHED ({Math.abs(days)}d overdue)</span>
        ) : (
          <span>{days}{useWorkingDays ? 'WD' : 'd'}</span>
        )}
      </div>
      <div className="text-[10px] text-text-muted mt-0.5">Due: {deadline}</div>
    </div>
  );
}
