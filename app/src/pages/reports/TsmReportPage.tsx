import { useTsmReport } from '@/hooks/useApi';
import { formatPercent } from '@/utils/format';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

const getRagColour = (actual: number, target: number): string => {
  const diff = actual - target;
  if (diff >= 0) return 'bg-status-compliant/20 text-status-compliant border-status-compliant/30';
  if (diff >= -5) return 'bg-status-warning/20 text-status-warning border-status-warning/30';
  return 'bg-status-critical/20 text-status-critical border-status-critical/30';
};

const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return <TrendingUp size={14} className="text-status-compliant" />;
    case 'down':
      return <TrendingDown size={14} className="text-status-critical" />;
    default:
      return <Minus size={14} className="text-text-muted" />;
  }
};

const getPerformanceSummary = (tsmMeasures: any[]) => {
  const total = tsmMeasures.length;
  const meetingTarget = tsmMeasures.filter((m: any) => m.actual >= m.target).length;
  const within5Percent = tsmMeasures.filter((m: any) => m.actual < m.target && m.actual >= m.target - 5).length;
  const belowTarget = tsmMeasures.filter((m: any) => m.actual < m.target - 5).length;
  
  return {
    total,
    meetingTarget,
    within5Percent,
    belowTarget,
    overallRate: total > 0 ? (meetingTarget / total) * 100 : 0,
  };
};

export default function TsmReportPage() {
  const { data: tsmMeasures = [] } = useTsmReport();
  const summary = getPerformanceSummary(tsmMeasures);

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight mb-1">
            Tenant Satisfaction Measures — Annual Return
          </h1>
          <p className="text-text-muted">Regulatory return showing performance against sector benchmarks</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-surface-card rounded-xl border border-border-default p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Meeting Target</div>
            <div className="flex items-center gap-2">
              <CheckCircle size={20} className="text-status-compliant" />
              <div className="text-2xl font-bold font-heading text-text-primary">
                {summary.meetingTarget}/{summary.total}
              </div>
            </div>
            <div className="text-xs text-text-muted mt-1">
              {formatPercent(summary.overallRate)}
            </div>
          </div>
          <div className="bg-surface-card rounded-lg border border-border-default p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Within 5%</div>
            <div className="flex items-center gap-2">
              <AlertCircle size={20} className="text-status-warning" />
              <div className="text-2xl font-bold font-heading text-text-primary">
                {summary.within5Percent}
              </div>
            </div>
          </div>
          <div className="bg-surface-card rounded-lg border border-border-default p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Below Target</div>
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-status-critical" />
              <div className="text-2xl font-bold font-heading text-text-primary">
                {summary.belowTarget}
              </div>
            </div>
          </div>
          <div className="bg-surface-card rounded-lg border border-border-default p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
            <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Overall Performance</div>
            <div className="text-2xl font-bold font-heading text-brand-teal">
              {formatPercent(summary.overallRate)}
            </div>
            <div className="text-xs text-text-muted mt-1">of measures meeting target</div>
          </div>
        </div>

        {/* TSM Measures Table */}
        <div className="bg-surface-card rounded-lg border border-border-default overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-elevated border-b border-border-default">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Actual</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Target</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Sector Median</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Upper Quartile</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Lower Quartile</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {tsmMeasures.map((measure, index) => {
                  const ragColour = getRagColour(measure.actual, measure.target);
                  const diff = measure.actual - measure.target;
                  
                  return (
                    <tr
                      key={measure.id}
                      className={`hover:bg-surface-elevated transition-colors opacity-0 animate-fade-in-up`}
                      style={{ animationDelay: `${350 + index * 20}ms`, animationFillMode: 'forwards' }}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-semibold text-text-primary">{measure.code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-text-primary font-medium">{measure.name}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${ragColour}`}>
                          {measure.actual.toFixed(1)}{measure.unit}
                          {diff < 0 && (
                            <span className="ml-1 text-[10px]">
                              ({diff.toFixed(1)})
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-text-secondary">{measure.target.toFixed(1)}{measure.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-text-muted">{measure.sectorMedian.toFixed(1)}{measure.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-text-muted">{measure.upperQuartile.toFixed(1)}{measure.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-text-muted">{measure.lowerQuartile.toFixed(1)}{measure.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center">
                          {getTrendIcon(measure.trend)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-surface-card rounded-lg border border-border-default p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
          <div className="text-xs text-text-muted space-y-1">
            <p><strong className="text-text-secondary">RAG Status:</strong> Green = Meeting target, Amber = Within 5% of target, Red = Below target by more than 5%</p>
            <p><strong className="text-text-secondary">Trend:</strong> Up = Improving, Down = Declining, Stable = No significant change</p>
            <p><strong className="text-text-secondary">Sector Benchmarks:</strong> Based on latest available sector data from Regulator of Social Housing</p>
          </div>
        </div>
      </div>
    </div>
  );
}
