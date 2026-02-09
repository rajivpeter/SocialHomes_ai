import { Link } from 'react-router-dom';
import { 
  MessageSquareWarning, 
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useComplaints, useTenants, useTsmReport } from '@/hooks/useApi';
import StatusPill from '@/components/shared/StatusPill';
import { formatNumber, formatPercent, daysUntil, formatDate } from '@/utils/format';

export default function ComplaintsPage() {
  const { data: complaints = [] } = useComplaints();
  const { data: tenants = [] } = useTenants();
  const { data: tsmMeasures = [] } = useTsmReport();

  const stage1Count = complaints.filter((c: any) => c.stage === 1 && c.status !== 'closed').length;
  const stage2Count = complaints.filter((c: any) => c.stage === 2 && c.status !== 'closed').length;
  
  const respondedWithinTimescale = complaints.filter(c => {
    if (c.status === 'closed' && c.respondedDate && c.responseDeadline) {
      const responded = daysUntil(c.respondedDate);
      const deadline = daysUntil(c.responseDeadline);
      return responded <= deadline;
    }
    return false;
  }).length;
  
  const totalClosed = complaints.filter(c => c.status === 'closed').length;
  const responseRate = totalClosed > 0 ? (respondedWithinTimescale / totalClosed) * 100 : 0;

  const ch01 = tsmMeasures.find(m => m.code === 'CH01');
  const ch02 = tsmMeasures.find(m => m.code === 'CH02');

  const getTenantName = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? `${tenant.title} ${tenant.firstName} ${tenant.lastName}` : 'Unknown';
  };

  const getCategoryBreakdown = () => {
    const breakdown: Record<string, number> = {};
    complaints.forEach(c => {
      breakdown[c.category] = (breakdown[c.category] || 0) + 1;
    });
    return breakdown;
  };

  const categoryBreakdown = getCategoryBreakdown();

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <h1 className="text-3xl font-bold font-heading text-gradient-brand mb-1 tracking-tight">Complaints</h1>
          <p className="text-text-muted text-sm">Complaint management and TSM tracking</p>
        </div>

        {/* Dashboard Header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <div className="bg-surface-card rounded-xl p-5 border border-border-default relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-peach to-brand-peach/40" />
            <div className="text-[11px] text-text-muted uppercase tracking-wider font-semibold mb-1">Stage 1</div>
            <div className="text-2xl font-bold text-text-primary font-heading">{stage1Count}</div>
          </div>
          <div className="bg-surface-card rounded-xl p-5 border border-border-default relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-blue to-brand-blue/40" />
            <div className="text-[11px] text-text-muted uppercase tracking-wider font-semibold mb-1">Stage 2</div>
            <div className="text-2xl font-bold text-text-primary font-heading">{stage2Count}</div>
          </div>
          <div className="bg-surface-card rounded-xl p-5 border border-border-default relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-status-compliant to-status-compliant/40" />
            <div className="text-[11px] text-text-muted uppercase tracking-wider font-semibold mb-1">Response Within Timescale</div>
            <div className="text-2xl font-bold text-status-compliant font-heading">{formatPercent(responseRate)}</div>
          </div>
          <div className="bg-surface-card rounded-xl p-5 border border-border-default relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-garnet to-brand-garnet/40" />
            <div className="text-[11px] text-text-muted uppercase tracking-wider font-semibold mb-1">Total Open</div>
            <div className="text-2xl font-bold text-text-primary font-heading">{stage1Count + stage2Count}</div>
          </div>
        </div>

        {/* TSM Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
          {ch01 && (
            <div className="bg-surface-card rounded-lg p-4 border border-border-default">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary">CH01 - Complaints per 1000</span>
                <span className={`text-lg font-bold ${ch01.actual <= ch01.target ? 'text-status-compliant' : 'text-status-warning'}`}>
                  {ch01.actual} {ch01.unit}
                </span>
              </div>
              <div className="text-xs text-text-muted">Target: {ch01.target} {ch01.unit}</div>
            </div>
          )}
          {ch02 && (
            <div className="bg-surface-card rounded-lg p-4 border border-border-default">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary">CH02 - Response Within Timescale</span>
                <span className={`text-lg font-bold ${ch02.actual >= ch02.target ? 'text-status-compliant' : 'text-status-warning'}`}>
                  {formatPercent(ch02.actual)}
                </span>
              </div>
              <div className="text-xs text-text-muted">Target: {formatPercent(ch02.target)}</div>
            </div>
          )}
        </div>

        {/* Complaints Table */}
        <div className="bg-surface-card rounded-lg border border-border-default overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          <div className="p-4 border-b border-border-default">
            <h2 className="text-xl font-bold font-heading text-brand-peach">All Complaints</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-elevated border-b border-border-default">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Tenant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Days Open</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Deadline</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Finding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {complaints.map((complaint, index) => {
                  const deadlineDays = daysUntil(complaint.responseDeadline);
                  const isBreached = deadlineDays < 0 && complaint.status !== 'closed';
                  
                  return (
                    <tr
                      key={complaint.id}
                      onClick={() => { window.location.href = `/complaints/${complaint.id}`; }}
                      className="hover:bg-surface-hover transition-colors opacity-0 animate-fade-in-up cursor-pointer"
                      style={{ animationDelay: `${250 + index * 30}ms`, animationFillMode: 'forwards' }}
                    >
                      <td className="px-4 py-3">
                        <Link
                          to={`/complaints/${complaint.id}`}
                          className="text-sm font-mono text-brand-teal hover:underline"
                        >
                          {complaint.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">{getTenantName(complaint.tenantId)}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{complaint.category}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-text-primary">Stage {complaint.stage}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={complaint.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">{complaint.daysOpen}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${isBreached ? 'text-status-critical' : 'text-text-primary'}`}>
                            {formatDate(complaint.responseDeadline)}
                          </span>
                          {isBreached && <XCircle size={14} className="text-status-critical" />}
                          {!isBreached && deadlineDays <= 3 && <AlertCircle size={14} className="text-status-warning" />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {complaint.finding ? (
                          <StatusPill status={complaint.finding} size="sm" />
                        ) : (
                          <span className="text-sm text-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Breakdown */}
        {Object.keys(categoryBreakdown).length > 0 && (
          <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: `${300 + complaints.length * 30}ms`, animationFillMode: 'forwards' }}>
            <h2 className="text-xl font-bold font-heading text-brand-peach mb-4">Category Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(categoryBreakdown).map(([category, count], index) => (
                <div
                  key={category}
                  className="bg-surface-elevated rounded-lg p-3 border border-border-default opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${350 + complaints.length * 30 + index * 50}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="text-sm text-text-muted mb-1">{category}</div>
                  <div className="text-2xl font-bold text-text-primary">{count}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
