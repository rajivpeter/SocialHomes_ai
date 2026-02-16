import { useState } from 'react';
import { Droplets, AlertTriangle, ThermometerSun, Building2, History, Cpu, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useDampRisk } from '@/hooks/useApi';

const RISK_COLOURS: Record<string, string> = {
  low: 'text-status-compliant',
  moderate: 'text-status-warning',
  high: 'text-status-critical',
  critical: 'text-status-critical',
};

const RISK_BG: Record<string, string> = {
  low: 'bg-status-compliant/20 border-status-compliant/30',
  moderate: 'bg-status-warning/20 border-status-warning/30',
  high: 'bg-status-critical/20 border-status-critical/30',
  critical: 'bg-status-critical/30 border-status-critical/50',
};

const FACTOR_ICONS: Record<string, any> = {
  Weather: ThermometerSun,
  'Building Fabric': Building2,
  'Repair History': History,
  'Environmental Sensors': Cpu,
  Occupancy: Users,
};

export default function DampIntelligencePanel({ propertyId }: { propertyId: string }) {
  const { data: prediction, isLoading, error } = useDampRisk(propertyId);
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-surface-card rounded-lg border border-border-default p-6 animate-pulse">
        <div className="h-6 bg-surface-elevated rounded w-64 mb-4" />
        <div className="h-20 bg-surface-elevated rounded" />
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="bg-surface-card rounded-lg border border-border-default p-6">
        <h3 className="text-lg font-bold text-brand-peach mb-2">Predictive Damp Intelligence</h3>
        <p className="text-sm text-text-muted">Unable to load prediction — using static risk score.</p>
      </div>
    );
  }

  const riskLevel = prediction.riskLevel ?? 'low';

  return (
    <div className="bg-surface-card rounded-lg border border-border-default p-6">
      <div className="flex items-center gap-2 mb-4">
        <Droplets size={20} className="text-status-ai" />
        <h3 className="text-lg font-bold text-brand-peach">Predictive Damp Intelligence</h3>
        <span className="text-[10px] px-2 py-0.5 bg-status-ai/20 text-status-ai rounded-full font-medium">AI</span>
      </div>

      {/* Score + Risk Level */}
      <div className="flex items-center gap-6 mb-4">
        <div className={`p-5 rounded-lg border-2 ${RISK_BG[riskLevel]}`}>
          <div className={`text-4xl font-bold ${RISK_COLOURS[riskLevel]}`}>{prediction.overallScore}</div>
          <div className="text-xs text-text-muted mt-1">out of 100</div>
        </div>
        <div className="flex-1">
          <div className={`text-sm font-semibold uppercase tracking-wider ${RISK_COLOURS[riskLevel]} mb-1`}>
            {riskLevel} risk
          </div>
          {prediction.isAwaabsLaw && (
            <div className="flex items-center gap-1 text-xs text-status-critical mb-2">
              <AlertTriangle size={14} />
              Awaab's Law timescales apply
            </div>
          )}
          <p className="text-xs text-text-muted leading-relaxed">
            5-factor weighted analysis combining weather, building fabric, repair history, sensors, and occupancy data.
          </p>
        </div>
      </div>

      {/* Factor Bars */}
      <div className="space-y-2 mb-4">
        {(prediction.factors ?? []).map((factor: any) => {
          const Icon = FACTOR_ICONS[factor.name] || Droplets;
          return (
            <div key={factor.name} className="flex items-center gap-3">
              <Icon size={14} className="text-text-muted shrink-0" />
              <div className="text-xs text-text-secondary w-28 shrink-0">{factor.name}</div>
              <div className="flex-1 bg-surface-elevated rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ${
                    factor.rawScore > 70 ? 'bg-status-critical' : factor.rawScore > 40 ? 'bg-status-warning' : 'bg-status-compliant'
                  }`}
                  style={{ width: `${factor.rawScore}%` }}
                />
              </div>
              <span className="text-xs text-text-muted w-8 text-right">{factor.rawScore}</span>
            </div>
          );
        })}
      </div>

      {/* Recommendations */}
      {(prediction.recommendations ?? []).length > 0 && (
        <div className="border-t border-border-default pt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm font-medium text-status-ai hover:text-status-ai/80 transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {prediction.recommendations.length} Recommendation{prediction.recommendations.length !== 1 ? 's' : ''}
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1">
              {prediction.recommendations.map((rec: string, i: number) => (
                <li key={i} className="text-xs text-text-muted flex items-start gap-2">
                  <span className="text-status-ai mt-0.5">-</span>
                  {rec}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="text-[10px] text-text-muted mt-3">
        Predicted: {prediction.predictedAt ? new Date(prediction.predictedAt).toLocaleString('en-GB') : 'N/A'}
      </div>
    </div>
  );
}
