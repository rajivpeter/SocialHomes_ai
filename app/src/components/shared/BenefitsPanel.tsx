import { useState } from 'react';
import { PoundSterling, ChevronDown, ChevronUp, CheckCircle, HelpCircle, XCircle } from 'lucide-react';
import { useBenefitsCheck } from '@/hooks/useApi';

const STATUS_ICON: Record<string, any> = {
  'currently-claiming': <CheckCircle size={14} className="text-status-compliant" />,
  'likely-eligible': <HelpCircle size={14} className="text-status-warning" />,
  'potentially-eligible': <HelpCircle size={14} className="text-status-info" />,
  'not-eligible': <XCircle size={14} className="text-text-muted" />,
};

const STATUS_LABEL: Record<string, string> = {
  'currently-claiming': 'Claiming',
  'likely-eligible': 'Likely eligible',
  'potentially-eligible': 'Possibly eligible',
  'not-eligible': 'Not eligible',
};

const STATUS_BG: Record<string, string> = {
  'currently-claiming': 'bg-status-compliant/10 border-status-compliant/20',
  'likely-eligible': 'bg-status-warning/10 border-status-warning/20',
  'potentially-eligible': 'bg-status-info/10 border-status-info/20',
  'not-eligible': 'bg-surface-elevated border-border-default',
};

export default function BenefitsPanel({ tenantId }: { tenantId: string }) {
  const { data: assessment, isLoading, error } = useBenefitsCheck(tenantId);
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-surface-card rounded-lg border border-border-default p-6 animate-pulse">
        <div className="h-6 bg-surface-elevated rounded w-48 mb-4" />
        <div className="h-16 bg-surface-elevated rounded" />
      </div>
    );
  }

  if (error || !assessment) return null;

  const unclaimed = (assessment.entitlements ?? []).filter(
    (e: any) => e.status === 'likely-eligible' || e.status === 'potentially-eligible',
  );

  return (
    <div className="bg-surface-card rounded-lg border border-border-default p-6">
      <div className="flex items-center gap-2 mb-4">
        <PoundSterling size={20} className="text-status-ai" />
        <h3 className="text-lg font-bold text-brand-peach">Benefits Entitlement Check</h3>
        <span className="text-[10px] px-2 py-0.5 bg-status-ai/20 text-status-ai rounded-full font-medium">AI</span>
      </div>

      {/* Unclaimed Summary */}
      {assessment.estimatedUnclaimedWeekly > 0 && (
        <div className="bg-status-warning/10 border border-status-warning/20 rounded-lg p-4 mb-4">
          <div className="text-xs text-status-warning uppercase tracking-wider font-medium mb-1">Estimated Unclaimed Benefits</div>
          <div className="text-2xl font-bold text-status-warning">
            £{assessment.estimatedUnclaimedWeekly.toFixed(2)}<span className="text-sm font-normal">/week</span>
          </div>
          <div className="text-xs text-text-muted mt-1">
            £{assessment.estimatedUnclaimedAnnual.toFixed(2)} annually across {unclaimed.length} potential entitlement{unclaimed.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Entitlements */}
      <div className="space-y-2 mb-4">
        {(assessment.entitlements ?? [])
          .filter((e: any) => e.status !== 'not-eligible')
          .map((ent: any, i: number) => (
            <div key={i} className={`rounded-lg border p-3 ${STATUS_BG[ent.status]}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {STATUS_ICON[ent.status]}
                  <span className="text-sm font-medium text-text-primary">{ent.benefit}</span>
                </div>
                <span className="text-xs text-text-muted">{STATUS_LABEL[ent.status]}</span>
              </div>
              {ent.estimatedWeeklyAmount && (
                <div className="text-xs text-text-secondary">Est. £{ent.estimatedWeeklyAmount.toFixed(2)}/week</div>
              )}
              <div className="text-xs text-text-muted mt-1">{ent.reason}</div>
            </div>
          ))}
      </div>

      {/* Actions */}
      {(assessment.recommendedActions ?? []).length > 0 && (
        <div className="border-t border-border-default pt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm font-medium text-status-ai hover:text-status-ai/80 transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {assessment.recommendedActions.length} Action{assessment.recommendedActions.length !== 1 ? 's' : ''}
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1">
              {assessment.recommendedActions.map((action: string, i: number) => (
                <li key={i} className="text-xs text-text-muted flex items-start gap-2">
                  <span className="text-status-ai mt-0.5">-</span>
                  {action}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
