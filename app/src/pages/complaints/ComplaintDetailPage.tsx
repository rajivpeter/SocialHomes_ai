import { useParams, Link } from 'react-router-dom';
import { 
  MessageSquareWarning,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Home,
  Calendar,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { useComplaints, useTenants, useProperties } from '@/hooks/useApi';
import { activities } from '@/data';
import CountdownTimer from '@/components/shared/CountdownTimer';
import StatusPill from '@/components/shared/StatusPill';
import AiActionCard from '@/components/shared/AiActionCard';
import { formatDate, formatCurrency, daysUntil, getInitials } from '@/utils/format';
import { useComplaintIntelligence } from '@/hooks/useEntityIntelligence';

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: complaints = [] } = useComplaints();
  const { data: tenants = [] } = useTenants();
  const { data: properties = [] } = useProperties();

  const complaint = complaints.find((c: any) => c.id === id);

  if (!complaint) {
    return (
      <div className="space-y-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-surface-card rounded-lg p-8 border border-border-default text-center">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Complaint Not Found</h1>
            <p className="text-text-muted mb-4">The complaint you're looking for doesn't exist.</p>
            <Link to="/complaints" className="text-brand-teal hover:underline">
              ← Back to Complaints
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tenant = tenants.find((t: any) => t.id === complaint.tenantId);
  const property = properties.find((p: any) => p.id === complaint.propertyId);
  const caseActivities = activities.filter(a => a.caseId === complaint.id);
  const intel = useComplaintIntelligence(complaint);

  const getTenantName = () => {
    return tenant ? `${tenant.title} ${tenant.firstName} ${tenant.lastName}` : 'Unknown';
  };

  const getPropertyAddress = () => {
    return property ? property.address : 'Unknown';
  };

  // Stage 1 deadlines
  const stage1AckDeadline = daysUntil(complaint.acknowledgeDeadline);
  const stage1ResponseDeadline = daysUntil(complaint.responseDeadline);
  const stage1AckMet = complaint.acknowledgedDate ? daysUntil(complaint.acknowledgedDate) <= daysUntil(complaint.acknowledgeDeadline) : false;
  const stage1ResponseMet = complaint.respondedDate ? daysUntil(complaint.respondedDate) <= daysUntil(complaint.responseDeadline) : false;

  // Stage 2 deadlines (if applicable)
  const stage2AckDeadline = complaint.stage === 2 ? daysUntil(complaint.acknowledgeDeadline) : null;
  const stage2ResponseDeadline = complaint.stage === 2 ? daysUntil(complaint.responseDeadline) : null;

  return (
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <Link to="/complaints" className="text-sm text-brand-teal hover:underline mb-2 inline-block">
                ← Back to Complaints
              </Link>
              <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight mb-1">{complaint.reference}</h1>
              <p className="text-text-muted">{complaint.subject}</p>
            </div>
            <StatusPill status={complaint.status} size="md" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Two-Stage Timeline */}
            <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              <h2 className="text-xl font-bold font-heading text-brand-peach mb-4">Complaint Timeline</h2>
              
              {/* Stage 1 */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-medium text-text-primary">Stage 1</span>
                  {complaint.stage === 1 && <StatusPill status="open" size="sm" />}
                  {complaint.stage > 1 && <CheckCircle size={16} className="text-status-compliant" />}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-text-muted">Acknowledge (5WD)</span>
                      {stage1AckMet ? (
                        <CheckCircle size={16} className="text-status-compliant" />
                      ) : stage1AckDeadline < 0 ? (
                        <XCircle size={16} className="text-status-critical" />
                      ) : null}
                    </div>
                    <CountdownTimer
                      deadline={complaint.acknowledgeDeadline}
                      label="Acknowledge Deadline"
                      useWorkingDays
                      size="sm"
                    />
                    {complaint.acknowledgedDate && (
                      <div className="text-xs text-text-muted mt-2">Acknowledged: {formatDate(complaint.acknowledgedDate)}</div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-text-muted">Respond (10WD)</span>
                      {stage1ResponseMet ? (
                        <CheckCircle size={16} className="text-status-compliant" />
                      ) : stage1ResponseDeadline < 0 ? (
                        <XCircle size={16} className="text-status-critical" />
                      ) : null}
                    </div>
                    <CountdownTimer
                      deadline={complaint.responseDeadline}
                      label="Response Deadline"
                      useWorkingDays
                      size="sm"
                    />
                    {complaint.respondedDate && (
                      <div className="text-xs text-text-muted mt-2">Responded: {formatDate(complaint.respondedDate)}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stage 2 */}
              {complaint.stage === 2 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-medium text-text-primary">Stage 2</span>
                    <StatusPill status="investigation" size="sm" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-text-muted">Acknowledge (5WD)</span>
                        {complaint.acknowledgedDate && <CheckCircle size={16} className="text-status-compliant" />}
                      </div>
                      <CountdownTimer
                        deadline={complaint.acknowledgeDeadline}
                        label="Acknowledge Deadline"
                        useWorkingDays
                        size="sm"
                      />
                      {complaint.acknowledgedDate && (
                        <div className="text-xs text-text-muted mt-2">Acknowledged: {formatDate(complaint.acknowledgedDate)}</div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-text-muted">Respond (20WD)</span>
                        {complaint.respondedDate && <CheckCircle size={16} className="text-status-compliant" />}
                      </div>
                      <CountdownTimer
                        deadline={complaint.responseDeadline}
                        label="Response Deadline"
                        useWorkingDays
                        size="sm"
                      />
                      {complaint.respondedDate && (
                        <div className="text-xs text-text-muted mt-2">Responded: {formatDate(complaint.respondedDate)}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Case Details */}
            <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              <h2 className="text-xl font-bold font-heading text-brand-peach mb-4">Case Details</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-text-muted mb-1">Category</div>
                  <div className="text-sm font-medium text-text-primary">{complaint.category}</div>
                </div>
                <div>
                  <div className="text-sm text-text-muted mb-1">Description</div>
                  <div className="text-sm text-text-primary">{complaint.description}</div>
                </div>
                {complaint.finding && (
                  <div>
                    <div className="text-sm text-text-muted mb-1">Finding</div>
                    <StatusPill status={complaint.finding} size="md" />
                  </div>
                )}
                {complaint.remedy && (
                  <div>
                    <div className="text-sm text-text-muted mb-1">Remedy</div>
                    <div className="text-sm text-text-primary">{complaint.remedy}</div>
                  </div>
                )}
                {complaint.compensation && (
                  <div>
                    <div className="text-sm text-text-muted mb-1">Compensation</div>
                    <div className="text-lg font-bold text-text-primary">{formatCurrency(complaint.compensation)}</div>
                  </div>
                )}
                {complaint.learningActions && complaint.learningActions.length > 0 && (
                  <div>
                    <div className="text-sm text-text-muted mb-2">Learning Actions</div>
                    <ul className="space-y-1">
                      {complaint.learningActions.map((action: any, idx: number) => (
                        <li key={idx} className="text-sm text-text-primary flex items-start gap-2">
                          <span className="text-brand-teal mt-1">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <div className="text-sm text-text-muted mb-1">Ombudsman Escalation</div>
                  <div className="text-sm text-text-primary">
                    {complaint.ombudsmanEscalation ? (
                      <span className="text-status-critical">Yes - Escalated</span>
                    ) : (
                      <span className="text-status-compliant">No</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted mb-1">Escalation Risk</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-surface-elevated rounded h-2 overflow-hidden">
                      <div 
                        className={`h-full ${complaint.escalationRisk >= 80 ? 'bg-status-critical' : complaint.escalationRisk >= 60 ? 'bg-status-warning' : 'bg-status-info'}`}
                        style={{ width: `${complaint.escalationRisk}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-text-primary">{complaint.escalationRisk}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Actions */}
            <AiActionCard
              title="AI Actions"
              actions={[
                {
                  icon: '✍️',
                  label: 'Draft Response',
                  description: 'Generate a professional Stage 1 response letter'
                },
                {
                  icon: '📊',
                  label: 'Escalation Risk Analysis',
                  description: 'Analyze risk of Ombudsman escalation'
                }
              ]}
              prediction={{
                probability: complaint.escalationRisk,
                consequence: complaint.escalationRisk >= 80 
                  ? 'High risk of Ombudsman escalation. Immediate action required.'
                  : complaint.escalationRisk >= 60
                  ? 'Moderate escalation risk. Monitor closely.'
                  : 'Low escalation risk.'
              }}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tenant & Property Info */}
            <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
              <h2 className="text-lg font-bold font-heading text-brand-peach mb-4">Details</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-text-muted mb-1">
                    <User size={14} />
                    Tenant
                  </div>
                  <div className="text-sm font-medium text-text-primary">{getTenantName()}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-text-muted mb-1">
                    <Home size={14} />
                    Property
                  </div>
                  <div className="text-sm font-medium text-text-primary">{getPropertyAddress()}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-text-muted mb-1">
                    <Calendar size={14} />
                    Created
                  </div>
                  <div className="text-sm font-medium text-text-primary">{formatDate(complaint.createdDate)}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-text-muted mb-1">
                    <Clock size={14} />
                    Days Open
                  </div>
                  <div className="text-sm font-medium text-text-primary">{complaint.daysOpen}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-text-muted mb-1">
                    <MessageSquareWarning size={14} />
                    Handler
                  </div>
                  <div className="text-sm font-medium text-text-primary">{complaint.handler}</div>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
              <h2 className="text-lg font-bold font-heading text-brand-peach mb-4">Activity Feed</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {caseActivities.length > 0 ? (
                  caseActivities.map((activity, index) => {
                    const initials = getInitials(getTenantName());
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 pb-4 border-b border-border-default last:border-0 opacity-0 animate-fade-in-up"
                        style={{ animationDelay: `${300 + index * 50}ms`, animationFillMode: 'forwards' }}
                      >
                        <div className="w-8 h-8 rounded-full bg-brand-teal/20 flex items-center justify-center text-brand-teal font-semibold text-xs flex-shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-text-muted mb-1">{formatDate(activity.date)}</div>
                          <div className="text-sm font-medium text-text-primary mb-1">{activity.subject}</div>
                          <div className="text-xs text-text-muted">{activity.description}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-text-muted text-center py-4">No activity recorded</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
