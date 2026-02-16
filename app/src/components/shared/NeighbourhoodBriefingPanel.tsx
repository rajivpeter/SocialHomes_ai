import { useState } from 'react';
import { Map, Cloud, Shield, PoundSterling, Wrench, Droplets, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useNeighbourhoodBriefing } from '@/hooks/useApi';

export default function NeighbourhoodBriefingPanel({ estateId }: { estateId: string }) {
  const { data: briefing, isLoading, error } = useNeighbourhoodBriefing(estateId);
  const [showActions, setShowActions] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-surface-card rounded-lg border border-border-default p-6 animate-pulse">
        <div className="h-6 bg-surface-elevated rounded w-64 mb-4" />
        <div className="h-32 bg-surface-elevated rounded" />
      </div>
    );
  }

  if (error || !briefing) return null;

  const priorityColour: Record<string, string> = {
    urgent: 'bg-status-critical/20 text-status-critical border-status-critical/30',
    high: 'bg-status-warning/20 text-status-warning border-status-warning/30',
    medium: 'bg-status-info/20 text-status-info border-status-info/30',
    low: 'bg-surface-elevated text-text-muted border-border-default',
  };

  return (
    <div className="bg-surface-card rounded-lg border border-border-default p-6">
      <div className="flex items-center gap-2 mb-4">
        <Map size={20} className="text-status-ai" />
        <h3 className="text-lg font-bold text-brand-peach">AI Neighbourhood Briefing</h3>
        <span className="text-[10px] px-2 py-0.5 bg-status-ai/20 text-status-ai rounded-full font-medium">AI</span>
      </div>

      {/* Key Alerts */}
      {(briefing.keyAlerts ?? []).length > 0 && (
        <div className="bg-status-critical/5 border border-status-critical/20 rounded-lg p-3 mb-4">
          {briefing.keyAlerts.map((alert: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-xs text-status-warning mb-1 last:mb-0">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              {alert}
            </div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-surface-elevated rounded-lg p-3 border border-border-default">
          <Cloud size={16} className="text-brand-blue mb-1" />
          <div className="text-xs text-text-muted">Weather</div>
          <div className="text-sm font-bold text-text-primary">{briefing.weatherSummary?.temperature ?? '-'}°C</div>
          <div className="text-[10px] text-text-muted">{briefing.weatherSummary?.humidity ?? '-'}% humidity</div>
        </div>
        <div className="bg-surface-elevated rounded-lg p-3 border border-border-default">
          <Shield size={16} className="text-status-critical mb-1" />
          <div className="text-xs text-text-muted">Crime (1mo)</div>
          <div className="text-sm font-bold text-text-primary">{briefing.crimeSummary?.totalIncidents ?? 0}</div>
          <div className="text-[10px] text-text-muted">{briefing.crimeSummary?.asbIncidents ?? 0} ASB</div>
        </div>
        <div className="bg-surface-elevated rounded-lg p-3 border border-border-default">
          <PoundSterling size={16} className="text-status-warning mb-1" />
          <div className="text-xs text-text-muted">Arrears</div>
          <div className="text-sm font-bold text-text-primary">{briefing.rentSummary?.inArrears ?? 0}</div>
          <div className="text-[10px] text-text-muted">£{(briefing.rentSummary?.totalArrears ?? 0).toFixed(0)} total</div>
        </div>
        <div className="bg-surface-elevated rounded-lg p-3 border border-border-default">
          <Wrench size={16} className="text-brand-teal mb-1" />
          <div className="text-xs text-text-muted">Open Repairs</div>
          <div className="text-sm font-bold text-text-primary">{briefing.repairsSummary?.openRepairs ?? 0}</div>
          <div className="text-[10px] text-text-muted">{briefing.repairsSummary?.slaBreached ?? 0} SLA breached</div>
        </div>
        <div className="bg-surface-elevated rounded-lg p-3 border border-border-default">
          <Droplets size={16} className="text-brand-peach mb-1" />
          <div className="text-xs text-text-muted">Damp Cases</div>
          <div className="text-sm font-bold text-text-primary">{briefing.dampSummary?.activeDampCases ?? 0}</div>
          <div className="text-[10px] text-text-muted">{briefing.dampSummary?.awaabsLawCases ?? 0} Awaab's Law</div>
        </div>
        <div className="bg-surface-elevated rounded-lg p-3 border border-border-default">
          <CheckCircle size={16} className="text-status-compliant mb-1" />
          <div className="text-xs text-text-muted">Compliance</div>
          <div className="text-sm font-bold text-text-primary">{briefing.complianceSummary?.overall ?? 0}%</div>
        </div>
      </div>

      {/* Officer Briefing */}
      <div className="bg-surface-elevated rounded-lg p-4 border border-border-default mb-4">
        <div className="text-xs text-status-ai uppercase tracking-wider font-medium mb-2">Officer Briefing</div>
        <div className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">
          {briefing.officerBriefing ?? 'Briefing not available.'}
        </div>
      </div>

      {/* Action Items */}
      {(briefing.actionItems ?? []).length > 0 && (
        <div className="border-t border-border-default pt-3">
          <button
            onClick={() => setShowActions(!showActions)}
            className="flex items-center gap-2 text-sm font-medium text-status-ai hover:text-status-ai/80 transition-colors"
          >
            {showActions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {briefing.actionItems.length} Action Item{briefing.actionItems.length !== 1 ? 's' : ''}
          </button>
          {showActions && (
            <div className="mt-2 space-y-1">
              {briefing.actionItems.map((item: any, i: number) => (
                <div key={i} className={`text-xs rounded border px-2 py-1 ${priorityColour[item.priority] ?? priorityColour.low}`}>
                  <span className="uppercase font-semibold">{item.priority}</span>: {item.action}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="text-[10px] text-text-muted mt-3">
        Generated: {briefing.generatedAt ? new Date(briefing.generatedAt).toLocaleString('en-GB') : 'N/A'}
      </div>
    </div>
  );
}
