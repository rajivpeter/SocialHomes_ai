import { useParams, Link } from 'react-router-dom';
import { AlertTriangle, FileText, CheckCircle, Clock, X } from 'lucide-react';
import { allAsbCases as asbCases } from '@/data';
import { useTenants, useProperties } from '@/hooks/useApi';
import AiActionCard from '@/components/shared/AiActionCard';
import { formatDate } from '@/utils/format';
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
  );
}
