import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Phone, Mail, MapPin, User, Calendar, AlertTriangle, 
  FileText, Activity, Receipt, Scale, Clock, Home,
  MessageSquare, Wrench, AlertCircle, DollarSign, Droplets
} from 'lucide-react';
import { useTenantIntelligence } from '@/hooks/useEntityIntelligence';
import { generateCommunicationDraft } from '@/services/ai-drafting';
import { useTenants, useProperties, useCases } from '@/hooks/useApi';
import { activities as activitiesData, rentTransactionsSample } from '@/data';
import AiActionCard from '@/components/shared/AiActionCard';
import StatusPill from '@/components/shared/StatusPill';
import { formatCurrency, formatDate, getCaseTypeColour } from '@/utils/format';

export default function TenancyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'cases' | 'activities' | 'statement' | 'orders'>('overview');

  const { data: tenants = [] } = useTenants();
  const { data: properties = [] } = useProperties();
  const { data: allCases = [] } = useCases();

  const tenant = tenants.find((t: any) => t.id === id);
  const property = tenant ? properties.find((p: any) => p.id === tenant.propertyId) : null;
  const tenantCases = tenant ? allCases.filter((c: any) => c.tenantId === tenant.id) : [];
  const tenantActivities = tenant ? activitiesData.filter(a => a.tenantId === tenant.id) : [];
  const tenantTransactions = tenant ? rentTransactionsSample.filter(t => t.tenantId === tenant.id) : [];

  if (!tenant) {
    return (
      <div className="space-y-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-surface-card rounded-lg p-8 border border-border-default text-center">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Tenant Not Found</h1>
            <p className="text-text-muted mb-4">The tenant you're looking for doesn't exist.</p>
            <Link to="/tenancies" className="text-brand-teal hover:underline">
              ← Back to Tenancies
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getCaseIcon = (type: string) => {
    switch (type) {
      case 'complaint': return <MessageSquare size={16} className="text-orange-500" />;
      case 'repair': return <Wrench size={16} className="text-brand-blue" />;
      case 'asb': return <AlertCircle size={16} className="text-status-critical" />;
      case 'financial': return <DollarSign size={16} className="text-status-warning" />;
      case 'damp-mould': return <Droplets size={16} className="text-brand-teal" />;
      default: return <FileText size={16} className="text-status-void" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone size={16} className="text-brand-teal" />;
      case 'visit': return <Home size={16} className="text-brand-blue" />;
      case 'email': return <Mail size={16} className="text-brand-peach" />;
      case 'letter': return <FileText size={16} className="text-status-warning" />;
      case 'sms': return <MessageSquare size={16} className="text-status-info" />;
      case 'system': return <AlertCircle size={16} className="text-status-ai" />;
      default: return <Activity size={16} className="text-text-muted" />;
    }
  };

  const getRentBalanceColor = (balance: number) => {
    if (balance === 0) return 'text-status-compliant';
    if (Math.abs(balance) < 500) return 'text-status-warning';
    return 'text-status-critical';
  };

  const getRentBalanceBgColor = (balance: number) => {
    if (balance === 0) return 'bg-status-compliant/10 border-status-compliant/30';
    if (Math.abs(balance) < 500) return 'bg-status-warning/10 border-status-warning/30';
    return 'bg-status-critical/10 border-status-critical/30';
  };

  // Generate AI Actions based on tenant data
  const generateAiActions = () => {
    const actions = [];
    
    if (tenant.rentBalance < -500) {
      actions.push({
        icon: '📧',
        label: 'Send Holding Update',
        description: 'Send proactive communication about arrears status and support available',
        preview: generateCommunicationDraft({ 
          tenant, 
          property: property || undefined, 
          communicationType: 'holding-update', 
          tone: tenant.vulnerabilityFlags.length > 0 ? 'supportive' : 'formal' 
        })
      });
    }

    if (tenant.ucStatus === 'claiming' || tenant.ucStatus === 'transitioning') {
      actions.push({
        icon: '💰',
        label: 'Income Maximisation Check',
        description: 'Review UC claim and ensure all eligible benefits are being claimed',
        preview: generateCommunicationDraft({ 
          tenant, 
          property: property || undefined, 
          communicationType: 'arrears-support', 
          tone: 'supportive' 
        })
      });
    }

    if (tenant.arrearsRisk > 70) {
      actions.push({
        icon: '⚠️',
        label: 'Arrears Prevention Call',
        description: 'Proactive call to discuss payment plan and prevent further arrears',
        preview: generateCommunicationDraft({ 
          tenant, 
          property: property || undefined, 
          communicationType: 'arrears-support', 
          tone: tenant.vulnerabilityFlags.length > 0 ? 'supportive' : 'formal' 
        })
      });
    }

    if (tenant.vulnerabilityFlags.length > 0) {
      actions.push({
        icon: '🤝',
        label: 'Welfare Check',
        description: 'Schedule a welfare check visit to assess support needs',
        preview: generateCommunicationDraft({ 
          tenant, 
          communicationType: 'welfare-check', 
          tone: 'supportive' 
        })
      });
    }

    return actions;
  };

  const navigate = useNavigate();
  const intel = useTenantIntelligence(tenant, tenantCases);
  const aiActions = generateAiActions();

  return (
    <div className={`space-y-6 ${intel.urgencyLevel === 'crisis' ? 'ring-1 ring-brand-garnet/20 rounded-xl p-1' : ''}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <Link to="/tenancies" className="text-brand-teal hover:underline text-sm mb-4 inline-block">
            ← Back to Tenancies
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight mb-1">
                {tenant.title} {tenant.firstName} {tenant.lastName}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <StatusPill status={tenant.tenancyStatus} size="md" />
                {property && (
                  <div className="flex items-center gap-2 text-text-muted">
                    <MapPin size={16} />
                    <span>{property.address}, {property.postcode}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-text-muted">
                  <User size={16} />
                  <span>Officer: {tenant.assignedOfficer}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Dynamic Actions */}
        {aiActions.length > 0 && (
          <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
            <AiActionCard
              title="AI Dynamic Actions"
              actions={aiActions}
              prediction={tenant.arrearsRisk > 70 ? {
                probability: tenant.arrearsRisk,
                consequence: `High risk of arrears escalation. Proactive action recommended.`
              } : undefined}
            />
          </div>
        )}

        {/* AI Dynamic Information Fields */}
        {intel.dynamicFields.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '75ms', animationFillMode: 'forwards' }}>
            {intel.dynamicFields.map((field, idx) => (
              <div key={idx} className="border-l-[3px] border-status-ai bg-surface-elevated/50 rounded-lg p-3">
                <div className="text-[10px] text-status-ai uppercase tracking-wider font-semibold">✦ AI estimate</div>
                <div className={`text-lg font-bold ${field.severity === 'critical' ? 'text-status-critical' : field.severity === 'warning' ? 'text-status-warning' : 'text-text-primary'}`}>{field.value}</div>
                <div className="text-xs text-text-muted">{field.label} — {field.source}</div>
              </div>
            ))}
          </div>
        )}

        {/* Warnings Banner */}
        {intel.dynamicWarnings.length > 0 && (
          <div className="bg-status-critical/5 border border-status-critical/20 rounded-lg p-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '80ms', animationFillMode: 'forwards' }}>
            {intel.dynamicWarnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-status-warning">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-surface-card rounded-lg border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <div className="border-b border-border-default">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', label: 'Overview', icon: FileText },
                { id: 'cases', label: 'Cases', icon: AlertCircle },
                { id: 'activities', label: 'Activities', icon: Activity },
                { id: 'statement', label: 'Statement', icon: Receipt },
                { id: 'orders', label: 'Orders', icon: Scale }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-brand-teal text-brand-teal'
                        : 'border-transparent text-text-muted hover:text-text-primary hover:border-border-default'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Details */}
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Personal Details</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Date of Birth:</span>
                        <span className="text-text-primary">{tenant.dob}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Email:</span>
                        <span className="text-text-primary">{tenant.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Phone:</span>
                        <span className="text-text-primary">{tenant.phone}</span>
                      </div>
                      {tenant.mobile && (
                        <div className="flex justify-between">
                          <span className="text-text-muted">Mobile:</span>
                          <span className="text-text-primary">{tenant.mobile}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-text-muted">Communication Preference:</span>
                        <span className="text-text-primary capitalize">{tenant.communicationPreference}</span>
                      </div>
                    </div>
                  </div>

                  {/* Key Dates */}
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Key Dates</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Tenancy Start:</span>
                        <span className="text-text-primary">{tenant.tenancyStartDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Tenure Type:</span>
                        <span className="text-text-primary capitalize">{tenant.tenancyType}</span>
                      </div>
                      {tenant.lastContact && (
                        <div className="flex justify-between">
                          <span className="text-text-muted">Last Contact:</span>
                          <span className="text-text-primary">{tenant.lastContact}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-text-muted">Contacts (30 days):</span>
                        <span className="text-text-primary">{tenant.contactCount30Days}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Household Members */}
                {tenant.household.length > 0 && (
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Household Members</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border-default">
                            <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase">Relationship</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase">Date of Birth</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase">Dependent</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tenant.household.map((member: any, idx: number) => (
                            <tr key={idx} className="border-b border-border-default last:border-0">
                              <td className="px-4 py-2 text-sm text-text-primary">{member.name}</td>
                              <td className="px-4 py-2 text-sm text-text-secondary">{member.relationship}</td>
                              <td className="px-4 py-2 text-sm text-text-secondary">{member.dob}</td>
                              <td className="px-4 py-2 text-sm text-text-secondary">{member.isDependent ? 'Yes' : 'No'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Emergency Contact */}
                <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Emergency Contact</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Name:</span>
                      <span className="text-text-primary">{tenant.emergencyContact.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Phone:</span>
                      <span className="text-text-primary">{tenant.emergencyContact.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Relationship:</span>
                      <span className="text-text-primary">{tenant.emergencyContact.relationship}</span>
                    </div>
                  </div>
                </div>

                {/* Vulnerability Flags */}
                {tenant.vulnerabilityFlags.length > 0 && (
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                      <AlertTriangle size={18} className="text-status-warning" />
                      Vulnerability Flags
                    </h3>
                    <div className="space-y-2">
                      {tenant.vulnerabilityFlags.map((flag: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-status-warning/10 rounded border border-status-warning/20">
                          <div>
                            <span className="text-sm font-medium text-text-primary">{flag.type}</span>
                            <span className="text-xs text-text-muted ml-2 capitalize">({flag.severity})</span>
                          </div>
                          <span className="text-xs text-text-muted">{flag.dateIdentified}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cases Tab */}
            {activeTab === 'cases' && (
              <div className="space-y-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
                {tenantCases.length === 0 ? (
                  <div className="text-center py-12 text-text-muted">
                    No cases found for this tenant.
                  </div>
                ) : (
                  tenantCases.map((case_, index) => (
                    <div
                      key={case_.id}
                      onClick={() => {
                        const routes: Record<string, string> = { repair: '/repairs/', complaint: '/complaints/', asb: '/asb/' };
                        const prefix = routes[case_.type] || '/';
                        navigate(prefix + case_.id);
                      }}
                      className={`bg-surface-elevated rounded-lg p-4 border-l-4 ${getCaseTypeColour(case_.type)} border border-border-default opacity-0 animate-fade-in-up cursor-pointer hover:bg-surface-hover transition-colors`}
                      style={{ animationDelay: `${150 + index * 50}ms`, animationFillMode: 'forwards' }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {getCaseIcon(case_.type)}
                          <span className="font-mono text-sm text-text-muted">{case_.reference}</span>
                          <StatusPill status={case_.status} />
                        </div>
                        <span className="text-xs text-text-muted">{case_.createdDate}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-text-primary mb-1">{case_.subject}</h4>
                      <p className="text-xs text-text-muted mb-2">{case_.description}</p>
                      <div className="flex items-center gap-4 text-xs text-text-muted">
                        <span>Handler: {case_.handler}</span>
                        <span>Days open: {case_.daysOpen}</span>
                        {case_.slaStatus && (
                          <StatusPill status={case_.slaStatus} size="sm" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Activities Tab */}
            {activeTab === 'activities' && (
              <div className="space-y-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
                {tenantActivities.length === 0 ? (
                  <div className="text-center py-12 text-text-muted">
                    No activities found for this tenant.
                  </div>
                ) : (
                  tenantActivities.map((activity, index) => (
                    <div
                      key={activity.id}
                      className="bg-surface-elevated rounded-lg p-4 border border-border-default opacity-0 animate-fade-in-up"
                      style={{ animationDelay: `${150 + index * 50}ms`, animationFillMode: 'forwards' }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-text-primary">{activity.subject}</span>
                            <span className="text-xs text-text-muted">{activity.date}</span>
                          </div>
                          <p className="text-xs text-text-muted mb-2">{activity.description}</p>
                          <div className="flex items-center gap-4 text-xs text-text-muted">
                            <span className="capitalize">{activity.type}</span>
                            {activity.direction && (
                              <span className="capitalize">{activity.direction}</span>
                            )}
                            <span>Officer: {activity.officer}</span>
                            {activity.linkedCaseRef && (
                              <span className="font-mono text-brand-teal">{activity.linkedCaseRef}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Statement Tab */}
            {activeTab === 'statement' && (
              <div className="space-y-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
                {/* Rent Balance Card */}
                <div className={`rounded-lg p-6 border-2 ${getRentBalanceBgColor(tenant.rentBalance)}`}>
                  <div className="text-sm text-text-muted mb-2">Current Balance</div>
                  <div className={`text-4xl font-bold ${getRentBalanceColor(tenant.rentBalance)}`}>
                    {formatCurrency(Math.abs(tenant.rentBalance))}
                  </div>
                </div>

                {/* Rent Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <div className="text-xs text-text-muted mb-1">Weekly Charge</div>
                    <div className="text-lg font-semibold text-text-primary">{formatCurrency(tenant.weeklyCharge)}</div>
                  </div>
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <div className="text-xs text-text-muted mb-1">Payment Method</div>
                    <div className="text-lg font-semibold text-text-primary capitalize">
                      {tenant.paymentMethod === 'dd' ? 'Direct Debit' : 
                       tenant.paymentMethod === 'uc' ? 'Universal Credit' :
                       tenant.paymentMethod === 'so' ? 'Standing Order' :
                       tenant.paymentMethod === 'hb' ? 'Housing Benefit' :
                       tenant.paymentMethod}
                    </div>
                  </div>
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <div className="text-xs text-text-muted mb-1">UC Status</div>
                    <div className="text-lg font-semibold text-text-primary capitalize">
                      {tenant.ucStatus || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Transaction Table */}
                <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Transaction History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border-default">
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase">Week</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase">Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase">Description</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-text-muted uppercase">Debit</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-text-muted uppercase">Credit</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-text-muted uppercase">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenantTransactions.map((transaction, idx) => (
                          <tr key={transaction.id} className="border-b border-border-default last:border-0">
                            <td className="px-4 py-2 text-sm text-text-secondary">{transaction.date}</td>
                            <td className="px-4 py-2 text-sm text-text-secondary">{transaction.week}</td>
                            <td className="px-4 py-2 text-sm text-text-secondary capitalize">{transaction.type}</td>
                            <td className="px-4 py-2 text-sm text-text-primary">{transaction.description}</td>
                            <td className="px-4 py-2 text-sm text-text-secondary text-right">
                              {transaction.debit > 0 ? formatCurrency(transaction.debit) : '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-text-secondary text-right">
                              {transaction.credit > 0 ? formatCurrency(transaction.credit) : '-'}
                            </td>
                            <td className={`px-4 py-2 text-sm font-medium text-right ${getRentBalanceColor(transaction.balance)}`}>
                              {formatCurrency(Math.abs(transaction.balance))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
                <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Rent Order Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Tenure Type:</span>
                      <span className="text-text-primary capitalize">{tenant.tenancyType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Weekly Rent:</span>
                      <span className="text-text-primary">{formatCurrency(property?.weeklyRent || 0)}</span>
                    </div>
                    {property && property.serviceCharge > 0 && (
                      <div className="flex justify-between">
                        <span className="text-text-muted">Service Charge:</span>
                        <span className="text-text-primary">{formatCurrency(property.serviceCharge)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-text-muted">Total Weekly Charge:</span>
                      <span className="text-text-primary font-semibold">{formatCurrency(tenant.weeklyCharge)}</span>
                    </div>
                  </div>
                </div>

                {property && property.serviceCharge > 0 && (
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Service Charges</h3>
                    <div className="text-sm text-text-muted">
                      Service charges are included in your weekly payment. For a detailed breakdown, please contact your housing officer.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
