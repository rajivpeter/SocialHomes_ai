import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2, User, Calendar, Wrench, AlertTriangle,
  CheckCircle, Clock, ArrowRight, UserCheck, Edit,
  TrendingUp, XCircle, Home, FileText, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { useRepairs, useProperties, useTenants } from '@/hooks/useApi';
import { activities as activitiesData } from '@/data';
import StatusPill from '@/components/shared/StatusPill';
import CountdownTimer from '@/components/shared/CountdownTimer';
import AiActionCard from '@/components/shared/AiActionCard';
import ActionModal from '@/components/shared/ActionModal';
import type { ActionField } from '@/components/shared/ActionModal';
import { formatDate, formatCurrency } from '@/utils/format';
import { useRepairIntelligence } from '@/hooks/useEntityIntelligence';

export default function RepairDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: repairs = [] } = useRepairs();
  const { data: properties = [] } = useProperties();
  const { data: tenants = [] } = useTenants();

  const repair = repairs.find((r: any) => r.id === id);
  const property = repair ? properties.find((p: any) => p.id === repair.propertyId) : null;
  const tenant = repair ? tenants.find((t: any) => t.id === repair.tenantId) : null;
  const repairActivities = repair ? activitiesData.filter(a => a.caseId === repair.id) : [];

  // Hooks must be called before any conditional return (Rules of Hooks)
  const intel = useRepairIntelligence(repair);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  if (!repair) {
    return (
      <div className="space-y-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-surface-card rounded-lg p-8 border border-border-default text-center">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Repair Not Found</h1>
            <p className="text-text-muted mb-4">The repair you're looking for doesn't exist.</p>
            <Link to="/repairs" className="text-brand-teal hover:underline">
              ← Back to Repairs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-status-critical/20 text-status-critical border-status-critical/30';
      case 'urgent': return 'bg-status-warning/20 text-status-warning border-status-warning/30';
      case 'routine': return 'bg-brand-blue/20 text-brand-blue border-brand-blue/30';
      case 'planned': return 'bg-status-compliant/20 text-status-compliant border-status-compliant/30';
      default: return 'bg-surface-elevated text-text-secondary border-border-default';
    }
  };

  const getTimelineSteps = () => {
    const steps = [
      { id: 'created', label: 'Created', date: repair.createdDate, completed: true },
    ];

    if (repair.status === 'in-progress' || repair.status === 'awaiting-parts' || repair.status === 'completed') {
      steps.push({ id: 'in-progress', label: 'In Progress', date: repair.createdDate, completed: true });
    }

    if (repair.status === 'awaiting-parts' || repair.status === 'completed') {
      steps.push({ id: 'awaiting-parts', label: 'Awaiting Parts', date: repair.appointmentDate || repair.createdDate, completed: true });
    }

    if (repair.status === 'completed') {
      steps.push({ id: 'completed', label: 'Completed', date: repair.completionDate || repair.closedDate || '', completed: true });
    } else {
      const currentStep = repair.status === 'open' ? 'created' : 
                          repair.status === 'in-progress' ? 'in-progress' : 'awaiting-parts';
      steps.push({ id: currentStep, label: currentStep === 'created' ? 'In Progress' : 
                  currentStep === 'in-progress' ? 'Awaiting Parts' : 'Completed', 
                  date: '', completed: false });
    }

    return steps;
  };

  const generateAiActions = () => {
    const actions = [];

    if (repair.recurrenceRisk > 70) {
      actions.push({
        icon: '🔍',
        label: 'Root Cause Analysis',
        description: 'Analyze recurring repair patterns and identify underlying issues',
        preview: `This repair has a ${repair.recurrenceRisk}% recurrence risk. AI analysis suggests investigating root causes such as ${repair.sorDescription.toLowerCase()} patterns.`
      });
    }

    if (repair.recurrenceRisk > 60 && repair.cost && repair.cost > 500) {
      actions.push({
        icon: '🏗️',
        label: 'Create Capital Works Request',
        description: 'Recommend capital works intervention for recurring high-cost repairs',
        preview: `This repair has cost ${formatCurrency(repair.cost)} and shows ${repair.recurrenceRisk}% recurrence risk. Consider capital works intervention.`
      });
    }

    if (repair.daysOpen > 30) {
      actions.push({
        icon: '📧',
        label: 'Send Update to Tenant',
        description: 'Send proactive communication about repair status and timeline',
        preview: `Dear ${tenant ? `${tenant.title} ${tenant.lastName}` : 'Tenant'},\n\nWe wanted to update you on the status of repair ${repair.reference}. We apologise for the delay and are working to resolve this as quickly as possible.\n\nKind regards,\nRCHA Housing Team`
      });
    }

    if (repair.isAwaabsLaw && repair.awaabsLawTimers) {
      actions.push({
        icon: '⚠️',
        label: 'Escalate Awaab\'s Law Case',
        description: 'Flag for immediate management attention due to Awaab\'s Law compliance',
        preview: `This repair is an Awaab's Law case (${repair.awaabsLawCategory}). Immediate escalation required.`
      });
    }

    return actions;
  };

  const aiActions = generateAiActions();

  const assignFields: ActionField[] = [
    { id: 'ref', label: 'Reference', type: 'readonly', defaultValue: repair.reference },
    { id: 'handler', label: 'Assign To', type: 'select', required: true, options: [
      { value: 'sarah-mitchell', label: 'Sarah Mitchell — Housing Officer' },
      { value: 'james-wright', label: 'James Wright — Head of Housing' },
      { value: 'priya-patel', label: 'Priya Patel — Manager' },
      { value: 'mark-johnson', label: 'Mark Johnson — Operative' },
    ]},
    { id: 'operative', label: 'Operative', type: 'select', options: [
      { value: 'mike-carpenter', label: 'Mike Carpenter — Plumber' },
      { value: 'dave-spark', label: 'Dave Spark — Electrician' },
      { value: 'ben-fix', label: 'Ben Fix — General Repairs' },
      { value: 'jane-build', label: 'Jane Build — Roofer' },
    ]},
    { id: 'notes', label: 'Assignment Notes', type: 'textarea', placeholder: 'Add any instructions for the operative...' },
  ];

  const updateFields: ActionField[] = [
    { id: 'ref', label: 'Reference', type: 'readonly', defaultValue: repair.reference },
    { id: 'status', label: 'Status', type: 'select', required: true, defaultValue: repair.status, options: [
      { value: 'open', label: 'Open' },
      { value: 'in-progress', label: 'In Progress' },
      { value: 'awaiting-parts', label: 'Awaiting Parts' },
      { value: 'completed', label: 'Completed' },
    ]},
    { id: 'priority', label: 'Priority', type: 'select', defaultValue: repair.priority, options: [
      { value: 'emergency', label: 'Emergency (24hr)' },
      { value: 'urgent', label: 'Urgent (5 WD)' },
      { value: 'routine', label: 'Routine (20 WD)' },
      { value: 'planned', label: 'Planned (90 days)' },
    ]},
    { id: 'appointmentDate', label: 'Appointment Date', type: 'date' },
    { id: 'appointmentSlot', label: 'Appointment Slot', type: 'select', options: [
      { value: 'am', label: 'Morning (8am-12pm)' },
      { value: 'pm', label: 'Afternoon (12pm-5pm)' },
      { value: 'all-day', label: 'All Day' },
    ]},
    { id: 'notes', label: 'Update Notes', type: 'textarea', placeholder: 'Describe the update...' },
  ];

  const escalateFields: ActionField[] = [
    { id: 'ref', label: 'Reference', type: 'readonly', defaultValue: repair.reference },
    { id: 'escalateTo', label: 'Escalate To', type: 'select', required: true, options: [
      { value: 'manager', label: 'Team Manager' },
      { value: 'head-of-housing', label: 'Head of Housing' },
      { value: 'coo', label: 'Chief Operating Officer' },
      { value: 'contractor', label: 'Contractor Supervisor' },
    ]},
    { id: 'reason', label: 'Reason for Escalation', type: 'select', required: true, options: [
      { value: 'sla-breach', label: 'SLA Breach' },
      { value: 'tenant-complaint', label: 'Tenant Complaint' },
      { value: 'awaabs-law', label: "Awaab's Law Compliance" },
      { value: 'recurring', label: 'Recurring Issue' },
      { value: 'health-safety', label: 'Health & Safety Risk' },
      { value: 'cost', label: 'Cost Exceeds Budget' },
    ]},
    { id: 'notes', label: 'Escalation Details', type: 'textarea', required: true, placeholder: 'Explain why this repair needs escalation...' },
  ];

  const closeFields: ActionField[] = [
    { id: 'ref', label: 'Reference', type: 'readonly', defaultValue: repair.reference },
    { id: 'completionDate', label: 'Completion Date', type: 'date', required: true },
    { id: 'firstTimeFix', label: 'First Time Fix?', type: 'select', required: true, options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No — Recall Required' },
    ]},
    { id: 'satisfaction', label: 'Tenant Satisfaction', type: 'select', options: [
      { value: '5', label: '5 — Very Satisfied' },
      { value: '4', label: '4 — Satisfied' },
      { value: '3', label: '3 — Neutral' },
      { value: '2', label: '2 — Dissatisfied' },
      { value: '1', label: '1 — Very Dissatisfied' },
    ]},
    { id: 'notes', label: 'Completion Notes', type: 'textarea', placeholder: 'Describe the work completed...' },
  ];

  return (
    <>
    <ActionModal open={activeModal === 'assign'} onClose={() => setActiveModal(null)} title="Assign Repair" description={`Assign ${repair.reference} to a handler or operative`} icon={<UserCheck size={20} className="text-brand-teal" />} fields={assignFields} submitLabel="Assign" onSubmit={(v) => { console.log('Assign:', v); setActiveModal(null); }} />
    <ActionModal open={activeModal === 'update'} onClose={() => setActiveModal(null)} title="Update Repair" description={`Update status, priority, or schedule for ${repair.reference}`} icon={<Edit size={20} className="text-brand-blue" />} fields={updateFields} submitLabel="Save Changes" onSubmit={(v) => { console.log('Update:', v); setActiveModal(null); }} />
    <ActionModal open={activeModal === 'escalate'} onClose={() => setActiveModal(null)} title="Escalate Repair" description={`Escalate ${repair.reference} to management`} icon={<TrendingUp size={20} className="text-status-warning" />} fields={escalateFields} submitLabel="Escalate" variant="warning" onSubmit={(v) => { console.log('Escalate:', v); setActiveModal(null); }} />
    <ActionModal open={activeModal === 'close'} onClose={() => setActiveModal(null)} title="Close Repair" description={`Mark ${repair.reference} as completed`} icon={<CheckCircle size={20} className="text-status-compliant" />} fields={closeFields} submitLabel="Close Repair" variant="success" onSubmit={(v) => { console.log('Close:', v); setActiveModal(null); }} />
    <div className={`space-y-6 ${intel.urgencyLevel === 'crisis' ? 'ring-1 ring-brand-garnet/20 rounded-xl p-2' : intel.urgencyLevel === 'urgent' ? 'ring-1 ring-status-warning/10 rounded-xl p-2' : ''}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* AI Warnings */}
        {intel.dynamicWarnings.length > 0 && (
          <div className="space-y-2 opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
            {intel.dynamicWarnings.map((w: string, i: number) => (
              <div key={i} className="flex items-center gap-2 bg-status-critical/10 border border-status-critical/20 rounded-lg px-4 py-2 text-sm text-status-critical">
                <AlertTriangle size={16} />
                {w}
              </div>
            ))}
          </div>
        )}

        {/* Dynamic AI Information Fields */}
        {intel.dynamicFields.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
            {intel.dynamicFields.map((field, i) => (
              <div key={i} className="border-l-[3px] border-status-ai bg-surface-elevated/50 rounded-lg p-3">
                <div className="text-[10px] text-status-ai uppercase tracking-wider font-medium mb-1">&#10022; AI estimate</div>
                <div className="text-lg font-bold text-text-primary">{field.value}</div>
                <div className="text-xs text-text-muted">{field.label}</div>
                <div className="text-[10px] text-text-muted mt-1">{field.source}</div>
              </div>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-4 mb-4">
            <Link to="/repairs" className="text-text-muted hover:text-brand-teal transition-colors">
              ← Back to Repairs
            </Link>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight mb-1">{repair.reference}</h1>
              <p className="text-text-secondary text-lg">{repair.subject}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusPill status={repair.status} size="md" />
              <span className={`px-3 py-1 rounded-lg border text-sm font-medium capitalize ${getPriorityBadgeColor(repair.priority)}`}>
                {repair.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Awaab's Law Timers */}
        {repair.isAwaabsLaw && repair.awaabsLawTimers && (
          <div className="bg-surface-card rounded-lg p-4 border border-status-critical/30 opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-status-critical" />
              <h2 className="text-lg font-bold text-status-critical">Awaab's Law Case</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {repair.awaabsLawTimers.category === 'emergency' && repair.awaabsLawTimers.emergencyDeadline && (
                <CountdownTimer
                  deadline={repair.awaabsLawTimers.emergencyDeadline}
                  label="Emergency Deadline"
                  size="lg"
                />
              )}
              {repair.awaabsLawTimers.category === 'significant' && (
                <>
                  {repair.awaabsLawTimers.investigateDeadline && (
                    <CountdownTimer
                      deadline={repair.awaabsLawTimers.investigateDeadline}
                      label="Investigate"
                      useWorkingDays={true}
                      size="lg"
                    />
                  )}
                  {repair.awaabsLawTimers.summaryDeadline && (
                    <CountdownTimer
                      deadline={repair.awaabsLawTimers.summaryDeadline}
                      label="Summary"
                      useWorkingDays={true}
                      size="lg"
                    />
                  )}
                  {repair.awaabsLawTimers.safetyWorksDeadline && (
                    <CountdownTimer
                      deadline={repair.awaabsLawTimers.safetyWorksDeadline}
                      label="Safety Works"
                      useWorkingDays={true}
                      size="lg"
                    />
                  )}
                  {repair.awaabsLawTimers.fullRepairDeadline && (
                    <CountdownTimer
                      deadline={repair.awaabsLawTimers.fullRepairDeadline}
                      label="Full Repair"
                      size="lg"
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Key Info Bar */}
        <div className="bg-surface-card rounded-lg p-4 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Building2 size={20} className="text-brand-teal" />
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Property</div>
                <Link to={`/properties/${property?.uprn}`} className="text-sm font-medium text-brand-teal hover:underline">
                  {property?.address || 'N/A'}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User size={20} className="text-brand-peach" />
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Tenant</div>
                <Link to={`/tenancies/${tenant?.id}`} className="text-sm font-medium text-brand-peach hover:underline">
                  {tenant ? `${tenant.title} ${tenant.firstName} ${tenant.lastName}` : 'N/A'}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <UserCheck size={20} className="text-brand-blue" />
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Handler</div>
                <div className="text-sm font-medium text-text-primary">{repair.handler}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-status-info" />
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider">SOR Code</div>
                <div className="text-sm font-medium text-text-primary">{repair.sorCode} - {repair.sorDescription}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
          <h2 className="text-lg font-bold text-text-primary mb-4">Repair Timeline</h2>
          <div className="flex items-center gap-4 overflow-x-auto pb-4">
            {getTimelineSteps().map((step, index) => (
              <div key={step.id} className="flex items-center gap-4 min-w-fit">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    step.completed
                      ? 'bg-brand-teal border-brand-teal text-white'
                      : 'bg-surface-dark border-border-default text-text-muted'
                  }`}>
                    {step.completed ? (
                      <CheckCircle size={20} />
                    ) : (
                      <Clock size={20} />
                    )}
                  </div>
                  <div className="text-xs text-text-muted mt-2 text-center max-w-[80px]">{step.label}</div>
                  {step.date && (
                    <div className="text-xs text-text-muted mt-1">{formatDate(step.date)}</div>
                  )}
                </div>
                {index < getTimelineSteps().length - 1 && (
                  <ArrowRight size={20} className="text-border-default flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Case Details (55%) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Case Details */}
            <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              <h2 className="text-lg font-bold text-text-primary mb-4">Case Details</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Description</div>
                  <div className="text-sm text-text-primary">{repair.description}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Trade</div>
                    <div className="text-sm text-text-primary">{repair.trade}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Operative</div>
                    <div className="text-sm text-text-primary">{repair.operative || '-'}</div>
                    {repair.operative && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {(repair.trade?.toLowerCase() === 'plumbing' || repair.trade?.toLowerCase() === 'gas') && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-status-compliant/20 text-status-compliant border border-status-compliant/30">
                            <ShieldCheck size={10} />
                            Gas Safe Registered
                          </span>
                        )}
                        {repair.trade?.toLowerCase() === 'electrical' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-blue/20 text-brand-blue border border-brand-blue/30">
                            <ShieldCheck size={10} />
                            NICEIC Verified
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Created Date</div>
                    <div className="text-sm text-text-primary">{formatDate(repair.createdDate)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Target Date</div>
                    <div className="text-sm text-text-primary">{repair.targetDate ? formatDate(repair.targetDate) : '-'}</div>
                  </div>
                  {repair.appointmentDate && (
                    <>
                      <div>
                        <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Appointment Date</div>
                        <div className="text-sm text-text-primary">{formatDate(repair.appointmentDate)} {repair.appointmentSlot}</div>
                      </div>
                    </>
                  )}
                  {repair.completionDate && (
                    <div>
                      <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Completion Date</div>
                      <div className="text-sm text-text-primary">{formatDate(repair.completionDate)}</div>
                    </div>
                  )}
                  {repair.cost && (
                    <div>
                      <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Cost</div>
                      <div className="text-sm text-text-primary">{formatCurrency(repair.cost)}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Days Open</div>
                    <div className={`text-sm font-medium ${
                      repair.daysOpen > 30 ? 'text-status-critical' :
                      repair.daysOpen > 14 ? 'text-status-warning' :
                      'text-text-primary'
                    }`}>
                      {repair.daysOpen}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-1">First Time Fix</div>
                    <div className="text-sm text-text-primary">{repair.firstTimeFix ? 'Yes' : 'No'}</div>
                  </div>
                  {repair.satisfaction !== undefined && (
                    <div>
                      <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Satisfaction</div>
                      <div className="text-sm text-text-primary">{repair.satisfaction}/5</div>
                    </div>
                  )}
                </div>
                {repair.recurrenceRisk > 0 && (
                  <div className="mt-4 p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={16} className="text-status-warning" />
                      <div className="text-xs font-medium text-status-warning uppercase tracking-wider">Recurrence Risk</div>
                    </div>
                    <div className="text-sm text-text-primary">{repair.recurrenceRisk}% - {repair.recurrenceRisk > 70 ? 'High risk of recurrence' : repair.recurrenceRisk > 40 ? 'Moderate risk' : 'Low risk'}</div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Actions */}
            {aiActions.length > 0 && (
              <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
                <AiActionCard
                  title="AI Recommended Actions"
                  actions={aiActions}
                  prediction={repair.recurrenceRisk > 70 ? {
                    probability: repair.recurrenceRisk,
                    consequence: 'High probability of recurring repairs without intervention'
                  } : undefined}
                  warning={repair.isAwaabsLaw ? 'Awaab\'s Law compliance required' : undefined}
                />
              </div>
            )}
          </div>

          {/* Right Column - Activity Feed (45%) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              <h2 className="text-lg font-bold text-text-primary mb-4">Activity Feed</h2>
              <div className="space-y-4">
                {repairActivities.length > 0 ? (
                  repairActivities.map((activity) => (
                    <div key={activity.id} className="flex gap-3 pb-4 border-b border-border-default last:border-0">
                      <div className="w-8 h-8 rounded-full bg-brand-teal/20 flex items-center justify-center flex-shrink-0">
                        <Clock size={14} className="text-brand-teal" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-text-primary">{activity.subject}</div>
                        <div className="text-xs text-text-secondary mt-1">{activity.description}</div>
                        <div className="text-xs text-text-muted mt-1">{formatDate(activity.date)} • {activity.officer}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-text-muted text-center py-8">
                    No activities logged yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="bg-surface-card rounded-lg p-4 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => setActiveModal('assign')} className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/80 transition-colors">
              <UserCheck size={16} />
              Assign
            </button>
            <button onClick={() => setActiveModal('update')} className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/80 transition-colors">
              <Edit size={16} />
              Update
            </button>
            <button onClick={() => setActiveModal('escalate')} className="flex items-center gap-2 px-4 py-2 bg-status-warning text-white rounded-lg hover:bg-status-warning/80 transition-colors">
              <TrendingUp size={16} />
              Escalate
            </button>
            {repair.status !== 'completed' && (
              <button onClick={() => setActiveModal('close')} className="flex items-center gap-2 px-4 py-2 bg-status-compliant text-white rounded-lg hover:bg-status-compliant/80 transition-colors">
                <CheckCircle size={16} />
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
