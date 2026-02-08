import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon: React.ReactNode;
  colour?: string;
  delay?: number;
  onClick?: () => void;
}

export default function KpiCard({ label, value, subValue, trend, trendValue, icon, colour = 'brand-teal', delay = 0, onClick }: KpiCardProps) {
  const trendIcon = trend === 'up' ? <TrendingUp size={14} /> : trend === 'down' ? <TrendingDown size={14} /> : <Minus size={14} />;
  const trendColour = trend === 'up' ? 'text-status-compliant' : trend === 'down' ? 'text-status-critical' : 'text-text-muted';

  return (
    <div
      onClick={onClick}
      className={`bg-surface-card rounded-xl p-5 border border-border-default opacity-0 animate-fade-in-up card-hover group relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Top accent gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, var(--color-${colour}), var(--color-${colour})50)`
        }}
      />

      {/* Subtle background glow */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
        style={{ background: `var(--color-${colour})`, opacity: 0.05 }}
      />

      <div className="flex items-start justify-between mb-3 relative">
        <span className="text-text-muted text-[11px] uppercase tracking-wider font-semibold">{label}</span>
        <div className={`text-${colour} p-1.5 rounded-lg bg-${colour}/10`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2 relative">
        <span className="text-2xl font-bold font-heading text-text-primary tracking-tight">{value}</span>
        {subValue && <span className="text-sm text-text-muted">{subValue}</span>}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trendColour}`}>
          {trendIcon}
          <span className="font-medium">{trendValue}</span>
        </div>
      )}
    </div>
  );
}
