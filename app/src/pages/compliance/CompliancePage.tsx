import { Link } from 'react-router-dom';
import { 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  Droplets
} from 'lucide-react';
import { complianceStats, dampMouldCases } from '@/data';
import { formatPercent, formatNumber } from '@/utils/format';
import StatusPill from '@/components/shared/StatusPill';
import CountdownTimer from '@/components/shared/CountdownTimer';

const complianceTypes = [
  { key: 'gas', label: 'Gas', route: '/compliance/gas', icon: '🔥' },
  { key: 'electrical', label: 'Electrical', route: '/compliance/electrical', icon: '⚡' },
  { key: 'fire', label: 'Fire', route: '/compliance/fire', icon: '🚨' },
  { key: 'asbestos', label: 'Asbestos', route: '/compliance/asbestos', icon: '⚠️' },
  { key: 'legionella', label: 'Legionella', route: '/compliance/legionella', icon: '💧' },
  { key: 'lifts', label: 'Lifts', route: '/compliance/lifts', icon: '🛗' },
];

export default function CompliancePage() {
  const getRagColour = (percentage: number) => {
    if (percentage >= 99) return 'bg-status-compliant/20 text-status-compliant border-status-compliant/30';
    if (percentage >= 97) return 'bg-status-warning/20 text-status-warning border-status-warning/30';
    return 'bg-status-critical/20 text-status-critical border-status-critical/30';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={16} className="text-status-compliant" />;
      case 'down':
        return <TrendingDown size={16} className="text-status-critical" />;
      default:
        return <Minus size={16} className="text-text-muted" />;
    }
  };

  // Get Awaab's Law active cases
  const activeAwaabsCases = dampMouldCases.filter(
    c => c.status !== 'closed' && (c.hazardClassification === 'emergency' || c.hazardClassification === 'significant')
  );
  const emergencyCases = activeAwaabsCases.filter(c => c.hazardClassification === 'emergency');
  const significantCases = activeAwaabsCases.filter(c => c.hazardClassification === 'significant');

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight mb-1">Compliance</h1>
          <p className="text-text-muted">Big 6 compliance dashboard and Awaab's Law tracker</p>
        </div>

        {/* Big 6 Dashboard */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <h2 className="text-xl font-bold font-heading text-brand-peach mb-4">Big 6 Compliance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {complianceTypes.map((type, index) => {
              const stat = complianceStats[type.key as keyof typeof complianceStats];
              return (
                <Link
                  key={type.key}
                  to={type.route}
                  className={`rounded-xl border p-6 ${getRagColour(stat.percentage)} hover:scale-[1.03] transition-all duration-200 opacity-0 animate-fade-in-up card-hover`}
                  style={{ animationDelay: `${150 + index * 50}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{type.icon}</span>
                      <div>
                        <div className="text-sm font-medium uppercase tracking-wider opacity-70">{type.label}</div>
                        <div className="text-3xl font-bold font-heading mt-1">{formatPercent(stat.percentage)}</div>
                      </div>
                    </div>
                    {getTrendIcon(stat.trend)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="opacity-70">
                      {stat.compliant}/{stat.total} compliant
                    </span>
                    <span className="opacity-70">
                      {stat.expiring > 0 && `${stat.expiring} expiring`}
                      {stat.expired > 0 && `${stat.expired} expired`}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Awaab's Law Section */}
        <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold font-heading text-brand-peach mb-1">Awaab's Law</h2>
              <p className="text-sm text-text-muted">Damp & Mould Tracker</p>
            </div>
            <Link
              to="/compliance/awaabs-law"
              className="px-4 py-2 bg-brand-teal/10 text-brand-teal rounded-lg hover:bg-brand-teal/20 transition-colors text-sm font-medium"
            >
              View All Cases →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Emergency Cases */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-text-primary">Emergency Cases</span>
                <span className="text-2xl font-bold text-status-critical">{emergencyCases.length}</span>
              </div>
              <div className="space-y-2">
                {emergencyCases.slice(0, 3).map((case_, idx) => (
                  <div
                    key={case_.id}
                    className="bg-surface-elevated rounded-lg p-3 border border-border-default opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${550 + idx * 50}ms`, animationFillMode: 'forwards' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-mono text-text-muted">{case_.reference}</span>
                      <StatusPill status="emergency" size="sm" pulse />
                    </div>
                    <div className="text-sm text-text-primary mb-2">{case_.subject}</div>
                    {case_.awaabsLawTimers?.emergencyDeadline && (
                      <CountdownTimer
                        deadline={case_.awaabsLawTimers.emergencyDeadline}
                        label="Emergency Deadline"
                        size="sm"
                      />
                    )}
                  </div>
                ))}
                {emergencyCases.length === 0 && (
                  <div className="text-sm text-text-muted text-center py-4">No emergency cases</div>
                )}
              </div>
            </div>

            {/* Significant Cases */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-text-primary">Significant Cases</span>
                <span className="text-2xl font-bold text-status-warning">{significantCases.length}</span>
              </div>
              <div className="space-y-2">
                {significantCases.slice(0, 5).map((case_, idx) => (
                  <div
                    key={case_.id}
                    className="bg-surface-elevated rounded-lg p-3 border border-border-default opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${600 + idx * 50}ms`, animationFillMode: 'forwards' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-mono text-text-muted">{case_.reference}</span>
                      <StatusPill status="significant" size="sm" />
                    </div>
                    <div className="text-sm text-text-primary mb-2">{case_.subject}</div>
                    {case_.awaabsLawTimers?.investigateDeadline && (
                      <CountdownTimer
                        deadline={case_.awaabsLawTimers.investigateDeadline}
                        label="Investigate"
                        useWorkingDays
                        size="sm"
                      />
                    )}
                  </div>
                ))}
                {significantCases.length === 0 && (
                  <div className="text-sm text-text-muted text-center py-4">No significant cases</div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border-default">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Total Active Cases</span>
              <span className="text-lg font-bold text-text-primary">{activeAwaabsCases.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
