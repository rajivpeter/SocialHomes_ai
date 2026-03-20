import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, FileText, CheckCircle, Clock, X, UserCheck, Edit, TrendingUp, XCircle } from 'lucide-react';
import { allAsbCases as asbCases } from '@/data';
import { useTenants, useProperties } from '@/hooks/useApi';
import AiActionCard from '@/components/shared/AiActionCard';
import ActionModal from '@/components/shared/ActionModal';
import { formatDate } from '@/utils/format';
import { casesApi } from '@/services/api-client';
import type { AsbEscalationStage } from '@/types';

// Escalation pipeline stages
const escalationStages: AsbEscalationStage[] = [
  'warning',
  'abc',
  'cpw',
  'cpn',
  'injunction',
  'possession',
  'closure',
];

const escalationStageLabels: Record<AsbEscalationStage, string> = {
  'warning': 'Warning',
  'abc': 'ABC',
  'cpw': 'CPW',
  'cpn': 'CPN',
  'injunction': 'Injunction',
  'possession': 'Possession',
  'closure': 'Closure',
};

export default function AsbDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: tenants = [] } = useTenants();
  const { data: properties = [] } = useProperties();

  const getPropertyAddress = (propertyId: string) => {
    const property = properties.find((p: any) => p.id === propertyId);
    return property?.address || 'Unknown';
  };

  const getTenantName = (tenantId: string) => {
    const tenant = tenants.find((t: any) => t.id === tenantId);
    if (!tenant) return 'Unknown';
    return `${tenant.title} ${tenant.firstName} ${tenant.lastName}`;
  };
  
  const case_ = asbCases.find((c: any) => c.id === id);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const queryClient = useQueryClient();

  if (!case_) {
    return (
      <div className="space-y-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-surface-card rounded-lg p-6 border border-border-default">
            <h1 className="text-2xl font-bold font-heading text-brand-peach mb-4">Case Not Found</h1>
            <p className="text-text-muted mb-4">The ASB case you're looking for doesn't exist.</p>
            <Link to="/asb" className="text-brand-teal hover:underline">
              ← Back to ASB cases
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStageIndex = escalationStages.indexOf(case_.escalationStage);

  // Mock evidence log
  const evidenceLog = [
    { id: 'ev-1', date: '15/11/2025', type: 'Diary Sheet', description: '8 diary entries from neighbours', officer: 'Sarah Mitchell' },
    { id: 'ev-2', date: '20/11/2025', type: 'Visit Report', description: 'Property visit - noise audible from corridor', officer: 'Sarah Mitchell' },
    { id: 'ev-3', date: '25/11/2025', type: 'Witness Statement', description: 'Statement from Flat 6 tenant', officer: 'Sarah Mitchell' },
    { id: 'ev-4', date: '01/12/2025', type: 'ABC Issued', description: 'Acceptable Behaviour Contract signed', officer: 'Sarah Mitchell' },
  ];

  return (
    <>
    <ActionModal open={activeModal === 'assign'} onClose={() => setActiveModal(null)} title="Assign ASB Case" description={`Assign ${case_.reference}`} icon={<UserCheck size={20} className="text-brand-teal" />} fields={[
      { id: 'handler', label: 'Assign To', type: 'select', required: true, options: [
        { value: 'sarah-mitchell', label: 'Sarah Mitchell — Housing Officer' },
        { value: 'priya-patel', label: 'Priya Patel — Manager' },
        { value: 'james-wright', label: 'James Wright — Head of Housing' },
      ]},
      { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Assignment notes...' },
    ]} submitLabel="Assign" onSubmit={async (v) => { await casesApi.update(case_.id, { handler: v.handler, assignmentNotes: v.notes }); queryClient.invalidateQueries({ queryKey: ['cases'] }); }} />
    <ActionModal open={activeModal === 'update'} onClose={() => setActiveModal(null)} title="Update ASB Case" description={`Update ${case_.reference}`} icon={<Edit size={20} className="text-brand-blue" />} fields={[
      { id: 'status', label: 'Status', type: 'select', defaultValue: case_.status, options: [
        { value: 'open', label: 'Open' },
        { value: 'investigation', label: 'Investigation' },
        { value: 'action-taken', label: 'Action Taken' },
        { value: 'monitoring', label: 'Monitoring' },
      ]},
      { id: 'escalationStage', label: 'Escalation Stage', type: 'select', defaultValue: case_.escalationStage, options: escalationStages.map(s => ({ value: s, label: escalationStageLabels[s] })) },
      { id: 'notes', label: 'Update Notes', type: 'textarea', placeholder: 'Describe the update...' },
    ]} submitLabel="Save" onSubmit={async (v) => { await casesApi.update(case_.id, { status: v.status, escalationStage: v.escalationStage, updateNotes: v.notes }); queryClient.invalidateQueries({ queryKey: ['cases'] }); }} />
    <ActionModal open={activeModal === 'escalate'} onClose={() => setActiveModal(null)} title="Escalate ASB Case" description={`Escalate ${case_.reference} to next stage`} icon={<TrendingUp size={20} className="text-status-warning" />} variant="warning" fields={[
      { id: 'reason', label: 'Escalation Reason', type: 'textarea', required: true, placeholder: 'Why is this being escalated?' },
      { id: 'nextStage', label: 'Escalate To', type: 'select', required: true, options: escalationStages.filter((_, i) => i > currentStageIndex).map(s => ({ value: s, label: escalationStageLabels[s] })) },
    ]} submitLabel="Escalate" onSubmit={async (v) => { await casesApi.update(case_.id, { escalationStage: v.nextStage, escalationReason: v.reason, status: 'action-taken' }); queryClient.invalidateQueries({ queryKey: ['cases'] }); }} />
    <ActionModal open={activeModal === 'close'} onClose={() => setActiveModal(null)} title="Close ASB Case" description={`Close ${case_.reference}`} icon={<CheckCircle size={20} className="text-status-compliant" />} variant="success" fields={[
      { id: 'outcome', label: 'Outcome', type: 'select', required: true, options: [
        { value: 'resolved', label: 'Resolved' },
        { value: 'no-further-action', label: 'No Further Action' },
        { value: 'legal-proceedings', label: 'Referred to Legal' },
        { value: 'transferred', label: 'Transferred' },
      ]},
      { id: 'notes', label: 'Closing Notes', type: 'textarea', placeholder: 'Describe the outcome...' },
    ]} submitLabel="Close Case" onSubmit={async (v) => { await casesApi.update(case_.id, { status: 'closed', outcome: v.outcome, closingNotes: v.notes }); queryClient.invalidateQueries({ queryKey: ['cases'] }); }} />
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-4 mb-4">
            <Link to="/asb" className="text-brand-teal hover:underline text-sm">
              ← Back to ASB cases
            </Link>
          </div>
          <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight mb-1">{case_.reference}</h1>
          <p className="text-text-muted">{case_.subject}</p>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setActiveModal('assign')} className="px-3 py-1.5 text-sm bg-brand-teal text-white rounded-lg hover:bg-brand-teal/80 flex items-center gap-1"><UserCheck size={14} /> Assign</button>
            <button onClick={() => setActiveModal('update')} className="px-3 py-1.5 text-sm bg-brand-blue text-white rounded-lg hover:bg-brand-blue/80 flex items-center gap-1"><Edit size={14} /> Update</button>
            <button onClick={() => setActiveModal('escalate')} className="px-3 py-1.5 text-sm bg-status-warning text-white rounded-lg hover:bg-status-warning/80 flex items-center gap-1"><TrendingUp size={14} /> Escalate</button>
            <button onClick={() => setActiveModal('close')} className="px-3 py-1.5 text-sm bg-status-compliant text-white rounded-lg hover:bg-status-compliant/80 flex items-center gap-1"><CheckCircle size={14} /> Close</button>
          </div>
        </div>

        {/* Case Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Escalation Pipeline */}
            <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
              <h2 className="text-xl font-bold font-heading text-brand-peach mb-4">Escalation Pipeline</h2>
              
              <div className="flex items-center justify-between relative">
                {/* Connection lines */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-border-default z-0" />
                <div 
                  className="absolute top-5 left-0 h-0.5 bg-brand-teal z-10 transition-all duration-500"
                  style={{ width: `${(currentStageIndex / (escalationStages.length - 1)) * 100}%` }}
                />
                
                {/* Stages */}
                {escalationStages.map((stage, index) => {
                  const isActive = index <= currentStageIndex;
                  const isCurrent = index === currentStageIndex;
                  
                  return (
                    <div key={stage} className="relative z-20 flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          isCurrent
                            ? 'bg-brand-teal border-brand-teal text-white scale-110'
                            : isActive
                            ? 'bg-brand-teal/20 border-brand-teal text-brand-teal'
                            : 'bg-surface-elevated border-border-default text-text-muted'
                        }`}
                      >
                        {isActive && !isCurrent ? (
                          <CheckCircle size={20} />
                        ) : isCurrent ? (
                          <AlertTriangle size={20} />
                        ) : (
                          <Clock size={20} />
                        )}
                      </div>
                      <div className={`mt-2 text-xs text-center max-w-[80px] ${
                        isCurrent ? 'font-semibold text-brand-peach' : isActive ? 'text-text-secondary' : 'text-text-muted'
                      }`}>
                        {escalationStageLabels[stage]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Evidence Log */}
            <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold font-heading text-brand-peach">Evidence Log</h2>
                <span className="text-sm text-text-muted">{case_.evidenceCount} items</span>
              </div>
              
              <div className="space-y-3">
                {evidenceLog.map((evidence, index) => (
                  <div
                    key={evidence.id}
                    className="bg-surface-elevated rounded-lg p-4 border border-border-default opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${150 + index * 30}ms`, animationFillMode: 'forwards' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-brand-teal" />
                        <span className="font-semibold text-text-primary">{evidence.type}</span>
                      </div>
                      <span className="text-xs text-text-muted">{typeof evidence.date === 'object' ? String(evidence.date) : evidence.date}</span>
                    </div>
                    <p className="text-sm text-text-secondary mb-2">{evidence.description}</p>
                    <div className="text-xs text-text-muted">Officer: {evidence.officer}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Case Info */}
            <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              <h3 className="font-semibold text-text-primary mb-4">Case Information</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-text-muted mb-1">Tenant</div>
                  <div className="text-text-primary">{getTenantName(case_.tenantId)}</div>
                </div>
                <div>
                  <div className="text-text-muted mb-1">Property</div>
                  <div className="text-text-primary">{getPropertyAddress(case_.propertyId)}</div>
                </div>
                <div>
                  <div className="text-text-muted mb-1">Category</div>
                  <div className="text-text-primary">{case_.category}</div>
                </div>
                <div>
                  <div className="text-text-muted mb-1">Severity</div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    case_.severity === 'cat-1' ? 'bg-status-critical/20 text-status-critical' :
                    case_.severity === 'cat-2' ? 'bg-status-warning/20 text-status-warning' :
                    'bg-status-void/20 text-status-void'
                  }`}>
                    {case_.severity === 'cat-1' ? 'Cat 1' : case_.severity === 'cat-2' ? 'Cat 2' : 'Cat 3'}
                  </span>
                </div>
                <div>
                  <div className="text-text-muted mb-1">Status</div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    case_.status === 'open' ? 'bg-brand-blue/20 text-brand-blue' :
                    case_.status === 'investigation' ? 'bg-status-warning/20 text-status-warning' :
                    'bg-status-void/20 text-status-void'
                  }`}>
                    {case_.status.charAt(0).toUpperCase() + case_.status.slice(1)}
                  </span>
                </div>
                <div>
                  <div className="text-text-muted mb-1">Handler</div>
                  <div className="text-text-primary">{case_.handler}</div>
                </div>
                <div>
                  <div className="text-text-muted mb-1">Created</div>
                  <div className="text-text-primary">{formatDate(case_.createdDate)}</div>
                </div>
                <div>
                  <div className="text-text-muted mb-1">Days Open</div>
                  <div className="text-text-primary">{case_.daysOpen}</div>
                </div>
              </div>
            </div>

            {/* AI Actions */}
            <AiActionCard
              title="AI Recommended Actions"
              actions={[
                {
                  icon: '📦',
                  label: 'Generate Evidence Bundle',
                  description: 'Compile all evidence into a formatted bundle for legal proceedings',
                  preview: 'This will generate a comprehensive evidence bundle including all diary sheets, witness statements, and visit reports.',
                },
                {
                  icon: '🤝',
                  label: 'Refer to Mediation',
                  description: 'Refer case to mediation service to resolve dispute amicably',
                  preview: 'Referral will be sent to local mediation service. Expected response time: 5-7 working days.',
                },
                {
                  icon: '🏛️',
                  label: 'Multi-Agency Referral',
                  description: 'Refer to multi-agency panel for coordinated intervention',
                  preview: 'Case will be referred to multi-agency panel including police, social services, and support agencies.',
                },
              ]}
              prediction={{
                probability: case_.legalActionProbability,
                consequence: `Legal action probability: ${case_.legalActionProbability}%`,
              }}
              warning={case_.communityTrigger ? 'Community Trigger activated - enhanced response required' : undefined}
            />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
