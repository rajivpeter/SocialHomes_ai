import { useNavigate } from 'react-router-dom';
import { 
  Home, Users, Wrench, PoundSterling, AlertTriangle, Shield, 
  MessageSquare, Sparkles, TrendingUp, TrendingDown, Clock, 
  AlertCircle, Building2
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { organisation, complianceStats, aiInsights, dampMouldCases, activities } from '@/data';
import { tenants } from '@/data/tenants';
import { usePersonaScope } from '@/hooks/usePersonaScope';
import KpiCard from '@/components/shared/KpiCard';
import StatusPill from '@/components/shared/StatusPill';
import CountdownTimer from '@/components/shared/CountdownTimer';
import { formatCurrency, formatNumber, formatPercent, getInitials } from '@/utils/format';

const rentData = [
  { month: 'Mar', collected: 95.2, target: 97 },
  { month: 'Apr', collected: 94.8, target: 97 },
  { month: 'May', collected: 96.1, target: 97 },
  { month: 'Jun', collected: 95.5, target: 97 },
  { month: 'Jul', collected: 94.3, target: 97 },
  { month: 'Aug', collected: 95.8, target: 97 },
  { month: 'Sep', collected: 96.4, target: 97 },
  { month: 'Oct', collected: 95.1, target: 97 },
  { month: 'Nov', collected: 96.2, target: 97 },
  { month: 'Dec', collected: 94.7, target: 97 },
  { month: 'Jan', collected: 95.8, target: 97 },
  { month: 'Feb', collected: 95.8, target: 97 },
];

const repairsData = [
  { month: 'Sep', emergency: 8, urgent: 28, routine: 62, planned: 15 },
  { month: 'Oct', emergency: 12, urgent: 35, routine: 71, planned: 18 },
  { month: 'Nov', emergency: 10, urgent: 30, routine: 68, planned: 12 },
  { month: 'Dec', emergency: 15, urgent: 38, routine: 55, planned: 10 },
  { month: 'Jan', emergency: 11, urgent: 32, routine: 72, planned: 16 },
  { month: 'Feb', emergency: 9, urgent: 25, routine: 65, planned: 14 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-elevated border border-border-default rounded-xl p-3 shadow-2xl backdrop-blur-sm">
        <p className="text-text-muted text-xs mb-2 font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}{entry.name.includes('Collect') || entry.name.includes('Target') ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { kpis, persona, scopedDampCases } = usePersonaScope();
  const collectionRate = (organisation.rentCollected / organisation.rentTarget) * 100;
  
  const getTenantName = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? `${tenant.title} ${tenant.firstName} ${tenant.lastName}` : 'Unknown';
  };

  const awaabsEmergency = scopedDampCases.filter(c => c.hazardClassification === 'emergency' && c.status !== 'closed');
  const awaabsSignificant = scopedDampCases.filter(c => c.hazardClassification === 'significant' && c.status !== 'closed');

  const complianceRoutes: Record<string, string> = {
    gas: '/compliance/gas', electrical: '/compliance/electrical', fire: '/compliance/fire',
    asbestos: '/compliance/asbestos', legionella: '/compliance/legionella', lifts: '/compliance/lifts',
  };

  return (
    <div className="space-y-6">
      {/* Header with org name */}
      <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight">Dashboard</h1>
          <span className="text-xs text-text-muted bg-surface-card px-2 py-0.5 rounded-full border border-border-default">{kpis.scopeLabel}</span>
        </div>
        <p className="text-text-muted text-sm">{organisation.name} — {organisation.rpNumber} — {organisation.regulatoryGrade}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Properties" value={persona === 'coo' || persona === 'head-of-service' ? formatNumber(organisation.totalUnits) : formatNumber(kpis.totalUnits)} trend="stable" trendValue="+12 this month" icon={<Home size={20} />} colour="brand-teal" delay={0} onClick={() => navigate('/properties')} />
        <KpiCard label="Tenancies" value={persona === 'coo' || persona === 'head-of-service' ? formatNumber(organisation.totalTenancies) : formatNumber(kpis.totalTenancies)} trend="up" trendValue="+8 this month" icon={<Users size={20} />} colour="brand-teal" delay={50} onClick={() => navigate('/tenancies')} />
        <KpiCard label="Active Repairs" value={persona === 'coo' || persona === 'head-of-service' ? formatNumber(organisation.activeRepairs) : formatNumber(kpis.activeRepairs)} trend="down" trendValue="-12 this week" icon={<Wrench size={20} />} colour="brand-blue" delay={100} onClick={() => navigate('/repairs')} />
        <KpiCard label="Rent Collected" value={formatCurrency(organisation.rentCollected)} subValue={`of ${formatCurrency(organisation.rentTarget)}`} trend="up" trendValue={formatPercent(collectionRate)} icon={<PoundSterling size={20} />} colour="brand-teal" delay={150} onClick={() => navigate('/rent')} />
        <KpiCard label="Arrears" value={persona === 'coo' || persona === 'head-of-service' ? formatCurrency(organisation.totalArrears) : formatCurrency(kpis.totalArrears)} trend="down" trendValue="-2.3% this month" icon={<AlertTriangle size={20} />} colour="brand-garnet" delay={200} onClick={() => navigate('/rent/arrears')} />
        <KpiCard label="Compliance" value={formatPercent(persona === 'coo' ? organisation.complianceRate : kpis.complianceRate)} trend="stable" trendValue="Above target" icon={<Shield size={20} />} colour="brand-teal" delay={250} onClick={() => navigate('/compliance')} />
        <KpiCard label="Open Complaints" value={persona === 'coo' || persona === 'head-of-service' ? formatNumber(organisation.openComplaints) : formatNumber(kpis.openComplaints)} trend="down" trendValue="-3 this month" icon={<MessageSquare size={20} />} colour="brand-peach" delay={300} onClick={() => navigate('/complaints')} />
        <KpiCard label="AI Alerts" value={formatNumber(organisation.aiAlerts)} trend="up" trendValue="+2 today" icon={<Sparkles size={20} />} colour="status-ai" delay={350} onClick={() => navigate('/ai/insights')} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-card rounded-xl p-6 border border-border-default opacity-0 animate-fade-in-up relative overflow-hidden" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-teal to-brand-blue" />
          <h2 className="text-lg font-bold font-heading text-brand-peach mb-4 tracking-tight">Rent Collection Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={rentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2A38" />
              <XAxis dataKey="month" stroke="#5E7082" tick={{ fill: '#5E7082', fontSize: 12 }} />
              <YAxis stroke="#5E7082" tick={{ fill: '#5E7082', fontSize: 12 }} domain={[90, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="line" />
              <Line type="monotone" dataKey="collected" stroke="#058995" strokeWidth={2} name="Collected" dot={{ fill: '#058995', r: 4, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="target" stroke="#EFAC92" strokeWidth={2} strokeDasharray="5 5" name="Target (97%)" dot={{ fill: '#EFAC92', r: 4, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-surface-card rounded-xl p-6 border border-border-default opacity-0 animate-fade-in-up relative overflow-hidden" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-peach to-brand-garnet" />
          <h2 className="text-lg font-bold font-heading text-brand-peach mb-4 tracking-tight">Repairs by Priority</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={repairsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2A38" />
              <XAxis dataKey="month" stroke="#5E7082" tick={{ fill: '#5E7082', fontSize: 12 }} />
              <YAxis stroke="#5E7082" tick={{ fill: '#5E7082', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="emergency" stackId="a" fill="#BE3358" name="Emergency" />
              <Bar dataKey="urgent" stackId="a" fill="#EFAC92" name="Urgent" />
              <Bar dataKey="routine" stackId="a" fill="#5BA4AA" name="Routine" />
              <Bar dataKey="planned" stackId="a" fill="#058995" name="Planned" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Three Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Big 6 Compliance */}
        <div className="bg-surface-card rounded-xl p-6 border border-border-default opacity-0 animate-fade-in-up relative overflow-hidden" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-status-compliant to-brand-teal" />
          <h2 className="text-lg font-bold font-heading text-brand-peach mb-4 tracking-tight">Big 6 Compliance</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(complianceStats).map(([key, stat], index) => {
              const getRagColour = (pct: number) => pct >= 99 ? 'bg-status-compliant/10 text-status-compliant border-status-compliant/20' : pct >= 97 ? 'bg-status-warning/10 text-status-warning border-status-warning/20' : 'bg-status-critical/10 text-status-critical border-status-critical/20';
              const labels: Record<string, string> = { gas: 'Gas', electrical: 'Electrical', fire: 'Fire', asbestos: 'Asbestos', legionella: 'Legionella', lifts: 'Lifts' };
              return (
                <div
                  key={key}
                  onClick={() => navigate(complianceRoutes[key] || '/compliance')}
                  className={`rounded-xl border p-4 ${getRagColour(stat.percentage)} opacity-0 animate-fade-in-up transition-all duration-200 hover:scale-[1.02] cursor-pointer`}
                  style={{ animationDelay: `${550 + index * 50}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="text-[10px] uppercase tracking-wider mb-1 opacity-70 font-semibold">{labels[key]}</div>
                  <div className="text-2xl font-bold font-heading">{formatPercent(stat.percentage)}</div>
                  <div className="text-[11px] mt-1 opacity-60">{stat.compliant}/{stat.total} compliant</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Awaab's Law */}
        <div className="bg-surface-card rounded-xl p-6 border border-border-default opacity-0 animate-fade-in-up relative overflow-hidden" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-status-critical to-status-warning" />
          <h2 className="text-lg font-bold font-heading text-brand-peach mb-4 tracking-tight cursor-pointer hover:text-brand-teal transition-colors" onClick={() => navigate('/compliance/awaabs-law')}>Awaab's Law Active Cases</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted font-medium">Emergency</span>
                <span className="text-lg font-bold text-status-critical font-heading">{awaabsEmergency.length}</span>
              </div>
              {awaabsEmergency.slice(0, 3).map((c) => (
                <div key={c.id} className="bg-surface-elevated rounded-lg p-3 border border-border-default mb-2 cursor-pointer hover:bg-surface-hover transition-colors" onClick={() => navigate('/compliance/awaabs-law')}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-mono text-text-muted">{c.reference}</span>
                    <StatusPill status="emergency" size="sm" pulse />
                  </div>
                  <div className="text-sm text-text-primary mb-2">{c.subject}</div>
                  {c.awaabsLawTimers?.emergencyDeadline && <CountdownTimer deadline={c.awaabsLawTimers.emergencyDeadline} label="Emergency Deadline" size="sm" />}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted font-medium">Significant</span>
                <span className="text-lg font-bold text-status-warning font-heading">{awaabsSignificant.length}</span>
              </div>
              {awaabsSignificant.slice(0, 3).map((c) => (
                <div key={c.id} className="bg-surface-elevated rounded-lg p-3 border border-border-default mb-2 cursor-pointer hover:bg-surface-hover transition-colors" onClick={() => navigate('/compliance/awaabs-law')}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-mono text-text-muted">{c.reference}</span>
                    <StatusPill status="significant" size="sm" />
                  </div>
                  <div className="text-sm text-text-primary mb-2">{c.subject}</div>
                  {c.awaabsLawTimers?.investigateDeadline && <CountdownTimer deadline={c.awaabsLawTimers.investigateDeadline} label="Investigate Deadline" useWorkingDays size="sm" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-surface-card rounded-xl p-6 border border-border-default opacity-0 animate-fade-in-up relative overflow-hidden" style={{ animationDelay: '650ms', animationFillMode: 'forwards' }}>
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-status-ai to-status-ai/40" />
          <h2 className="text-lg font-bold font-heading text-brand-peach mb-4 tracking-tight cursor-pointer hover:text-brand-teal transition-colors" onClick={() => navigate('/ai/insights')}>AI Insights</h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {aiInsights.slice(0, 6).map((insight, index) => {
              const col = insight.severity === 'urgent' ? 'border-status-critical' : insight.severity === 'attention' ? 'border-status-warning' : 'border-status-info';
              return (
                <div key={insight.id} className={`bg-surface-elevated rounded-lg p-4 border-l-[3px] ${col} opacity-0 animate-fade-in-up hover:bg-surface-hover transition-colors duration-200 cursor-pointer`} style={{ animationDelay: `${700 + index * 50}ms`, animationFillMode: 'forwards' }} onClick={() => navigate('/ai/insights')}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-status-ai font-semibold">{insight.type}</span>
                    <span className="text-[10px] text-text-muted">{insight.date}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary mb-1">{insight.title}</h3>
                  <p className="text-xs text-text-muted mb-2 line-clamp-2 leading-relaxed">{insight.description}</p>
                  {insight.confidence && (
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <div className="flex-1 h-1 bg-surface-dark rounded-full overflow-hidden">
                        <div className="h-1 bg-status-ai/60 rounded-full" style={{ width: `${insight.confidence}%` }} />
                      </div>
                      <span className="text-status-ai font-mono text-[10px]">{insight.confidence}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-surface-card rounded-xl p-6 border border-border-default opacity-0 animate-fade-in-up relative overflow-hidden" style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}>
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-teal via-brand-peach to-transparent" />
        <h2 className="text-lg font-bold font-heading text-brand-peach mb-5 tracking-tight">Recent Activity</h2>
        <div className="space-y-1">
          {activities.slice(0, 8).map((activity, index) => {
            const tenantName = getTenantName(activity.tenantId);
            const initials = getInitials(tenantName);
            const getIcon = (type: string) => {
              switch (type) {
                case 'call': return <Clock size={16} className="text-brand-teal" />;
                case 'visit': return <Home size={16} className="text-brand-blue" />;
                case 'email': return <MessageSquare size={16} className="text-brand-peach" />;
                case 'system': return <Sparkles size={16} className="text-status-ai" />;
                default: return <AlertCircle size={16} className="text-text-muted" />;
              }
            };
            const handleClick = () => {
              if (activity.tenantId) navigate(`/tenancies/${activity.tenantId}`);
            };
            return (
              <div key={activity.id} className="flex items-start gap-4 py-4 border-b border-border-default last:border-0 opacity-0 animate-fade-in-up hover:bg-surface-hover/30 -mx-2 px-2 rounded-lg transition-colors duration-200 cursor-pointer" style={{ animationDelay: `${850 + index * 50}ms`, animationFillMode: 'forwards' }} onClick={handleClick}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal/20 to-brand-deep/20 flex items-center justify-center text-brand-teal font-semibold text-sm flex-shrink-0 ring-1 ring-brand-teal/10">{initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getIcon(activity.type)}
                    <span className="text-sm font-semibold text-text-primary">{tenantName}</span>
                    <span className="text-[10px] text-text-muted ml-auto">{activity.date}</span>
                  </div>
                  <div className="text-sm text-text-primary font-medium mb-0.5">{activity.subject}</div>
                  <div className="text-xs text-text-muted leading-relaxed">{activity.description}</div>
                  {activity.linkedCaseRef && (
                    <div className="mt-1.5">
                      <span className="text-[10px] font-mono text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded-full">{activity.linkedCaseRef}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
