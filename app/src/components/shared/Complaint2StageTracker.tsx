import { CheckCircle, XCircle, AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { formatDate, daysUntil, workingDaysUntil } from '@/utils/format';

interface Complaint2StageTrackerProps {
  stage: 1 | 2;
  status: string;
  receivedDate: string;
  acknowledgementDate?: string;
  responseDeadline: string;
  respondedDate?: string;
  escalatedDate?: string;
}

interface MilestoneProps {
  label: string;
  slaLabel: string;
  deadline: string;
  completedDate?: string;
  useWorkingDays?: boolean;
}

function Milestone({ label, slaLabel, deadline, completedDate, useWorkingDays = true }: MilestoneProps) {
  const daysLeft = useWorkingDays ? workingDaysUntil(deadline) : daysUntil(deadline);
  const isComplete = !!completedDate;
  const isBreached = !isComplete && daysLeft <= 0;
  const isApproaching = !isComplete && !isBreached && daysLeft <= 2;

  return (
    <div className={`rounded-lg border p-3 ${
      isComplete
        ? 'bg-status-compliant/8 border-status-compliant/20'
        : isBreached
        ? 'bg-status-critical/8 border-status-critical/20 animate-pulse-critical'
        : isApproaching
        ? 'bg-status-warning/8 border-status-warning/20'
        : 'bg-surface-elevated border-border-default'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          {label}
        </span>
        <span className="text-[10px] text-text-muted">{slaLabel}</span>
      </div>

      {isComplete ? (
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="text-status-compliant" />
          <span className="text-sm font-medium text-status-compliant">Completed</span>
          <span className="text-xs text-text-muted ml-auto">{formatDate(completedDate)}</span>
        </div>
      ) : isBreached ? (
        <div className="flex items-center gap-2">
          <XCircle size={16} className="text-status-critical" />
          <span className="text-sm font-bold text-status-critical">
            BREACHED ({Math.abs(daysLeft)}{useWorkingDays ? 'WD' : 'd'} overdue)
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Clock size={16} className={isApproaching ? 'text-status-warning' : 'text-text-muted'} />
          <span className={`text-lg font-mono font-bold ${
            isApproaching ? 'text-status-warning' : 'text-text-primary'
          }`}>
            {daysLeft}{useWorkingDays ? 'WD' : 'd'}
          </span>
          <span className="text-xs text-text-muted ml-auto">Due: {formatDate(deadline)}</span>
        </div>
      )}
    </div>
  );
}

export default function Complaint2StageTracker({
  stage,
  status,
  receivedDate,
  acknowledgementDate,
  responseDeadline,
  respondedDate,
  escalatedDate,
}: Complaint2StageTrackerProps) {
  // Compute acknowledgement deadline: 5 working days from received or escalated date
  const stageStartDate = stage === 2 && escalatedDate ? escalatedDate : receivedDate;
  const ackDeadlineDate = computeWorkingDaysFromDate(stageStartDate, 5);

  // Response SLA: Stage 1 = 10 WD, Stage 2 = 20 WD (from the complaint's responseDeadline)
  const responseSlaLabel = stage === 1 ? '10 Working Days' : '20 Working Days';
  const responseDaysLeft = workingDaysUntil(responseDeadline);
  const isResponsePending = !respondedDate && responseDaysLeft > 0;

  // Auto-escalation warning for stage 1
  const showAutoEscalationWarning = stage === 1 && !respondedDate && status !== 'closed';

  return (
    <div className="bg-surface-card rounded-lg border border-border-default p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold font-heading text-text-primary">
          Complaint Progress
        </h2>
        <a
          href="https://www.housing-ombudsman.org.uk/landlords/complaint-handling-code/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-text-muted hover:text-brand-teal transition-colors"
        >
          Housing Ombudsman Code
          <ExternalLink size={10} />
        </a>
      </div>

      {/* Two-stage visual */}
      <div className="flex items-center gap-3 mb-6">
        {/* Stage 1 indicator */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${
          stage === 1
            ? 'bg-brand-teal/20 border-brand-teal/30 text-brand-teal'
            : 'bg-status-compliant/15 border-status-compliant/30 text-status-compliant'
        }`}>
          {stage > 1 ? <CheckCircle size={14} /> : <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[10px] font-bold">1</span>}
          Stage 1
        </div>

        {/* Connector */}
        <div className={`flex-1 h-0.5 ${stage === 2 ? 'bg-brand-teal' : 'bg-border-default'}`} />

        {/* Stage 2 indicator */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${
          stage === 2
            ? 'bg-brand-teal/20 border-brand-teal/30 text-brand-teal'
            : 'bg-surface-elevated border-border-default text-text-muted'
        }`}>
          <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[10px] font-bold">2</span>
          Stage 2
        </div>
      </div>

      {/* Active stage details */}
      <div className="mb-4">
        <div className="text-xs text-text-muted uppercase tracking-wider mb-1 font-semibold">
          Stage {stage} — {stage === 1 ? 'Initial Response' : 'Review / Appeal'}
        </div>
        <div className="text-xs text-text-muted">
          Received: {formatDate(stageStartDate)}
          {escalatedDate && stage === 2 && ` (Escalated: ${formatDate(escalatedDate)})`}
        </div>
      </div>

      {/* Milestones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <Milestone
          label="Acknowledgement"
          slaLabel="5 Working Days"
          deadline={ackDeadlineDate}
          completedDate={acknowledgementDate}
          useWorkingDays
        />
        <Milestone
          label="Response"
          slaLabel={responseSlaLabel}
          deadline={responseDeadline}
          completedDate={respondedDate}
          useWorkingDays
        />
      </div>

      {/* Auto-escalation warning */}
      {showAutoEscalationWarning && isResponsePending && (
        <div className="flex items-start gap-2 bg-status-warning/10 border border-status-warning/20 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle size={16} className="text-status-warning flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-status-warning">Auto-Escalation Warning</div>
            <div className="text-text-secondary text-xs mt-0.5">
              This complaint will auto-escalate to Stage 2 in{' '}
              <span className="font-mono font-bold text-status-warning">
                {responseDaysLeft}WD
              </span>
              {' '}if not responded to. The tenant has the right to escalate at any time after 10 working days.
            </div>
          </div>
        </div>
      )}

      {/* Breached warning */}
      {!respondedDate && responseDaysLeft <= 0 && (
        <div className="flex items-start gap-2 bg-status-critical/10 border border-status-critical/20 rounded-lg px-4 py-3 text-sm">
          <XCircle size={16} className="text-status-critical flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-status-critical">SLA Breached</div>
            <div className="text-text-secondary text-xs mt-0.5">
              The Stage {stage} response deadline has been breached by{' '}
              <span className="font-mono font-bold text-status-critical">
                {Math.abs(responseDaysLeft)}WD
              </span>.
              This is a Complaint Handling Code failure and must be reported to the Housing Ombudsman.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compute an ISO date string that is N working days from a given date string.
 */
function computeWorkingDaysFromDate(dateStr: string, workingDays: number): string {
  let d: Date;

  // Parse DD/MM/YYYY format
  if (typeof dateStr === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const parts = dateStr.split('/');
    d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  } else {
    d = new Date(dateStr);
  }

  let added = 0;
  while (added < workingDays) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }

  return d.toISOString().split('T')[0];
}
