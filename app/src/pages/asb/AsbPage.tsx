import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, User, MapPin } from 'lucide-react';
import { asbCases } from '@/data';
import { useTenants, useProperties } from '@/hooks/useApi';
import { formatDate } from '@/utils/format';
import type { AsbSeverity } from '@/types';

// Get severity colour
const getSeverityColor = (severity: AsbSeverity) => {
  switch (severity) {
    case 'cat-1':
      return 'bg-status-critical/20 text-status-critical border-status-critical/30';
    case 'cat-2':
      return 'bg-status-warning/20 text-status-warning border-status-warning/30';
    case 'cat-3':
      return 'bg-status-void/20 text-status-void border-status-void/30';
    default:
      return 'bg-status-void/20 text-status-void border-status-void/30';
  }
};

// Get severity label
const getSeverityLabel = (severity: AsbSeverity) => {
  switch (severity) {
    case 'cat-1':
      return 'Cat 1';
    case 'cat-2':
      return 'Cat 2';
    case 'cat-3':
      return 'Cat 3';
    default:
      return severity;
  }
};

export default function AsbPage() {
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

  // Calculate summary stats
  const totalCases = asbCases.length;
  const cat1Cases = asbCases.filter(c => c.severity === 'cat-1').length;
  const cat2Cases = asbCases.filter(c => c.severity === 'cat-2').length;
  const cat3Cases = asbCases.filter(c => c.severity === 'cat-3').length;

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight mb-1">Anti-Social Behaviour</h1>
          <p className="text-text-muted">ASB case management and tracking</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-status-info/20 rounded-lg">
                <AlertTriangle size={20} className="text-status-info" />
              </div>
              <div>
                <div className="text-sm text-text-muted">Total</div>
                <div className="text-2xl font-bold text-brand-peach">{totalCases}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-status-critical/20 rounded-lg">
                <AlertTriangle size={20} className="text-status-critical" />
              </div>
              <div>
                <div className="text-sm text-text-muted">Cat 1</div>
                <div className="text-2xl font-bold text-status-critical">{cat1Cases}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-status-warning/20 rounded-lg">
                <AlertTriangle size={20} className="text-status-warning" />
              </div>
              <div>
                <div className="text-sm text-text-muted">Cat 2</div>
                <div className="text-2xl font-bold text-status-warning">{cat2Cases}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-status-void/20 rounded-lg">
                <AlertTriangle size={20} className="text-status-void" />
              </div>
              <div>
                <div className="text-sm text-text-muted">Cat 3</div>
                <div className="text-2xl font-bold text-status-void">{cat3Cases}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Case List */}
        <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
          <h2 className="text-xl font-bold font-heading text-brand-peach mb-4">Case List</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Ref</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Location</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Severity</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Handler</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Days Open</th>
                </tr>
              </thead>
              <tbody>
                {asbCases.map((case_, index) => (
                  <tr
                    key={case_.id}
                    className="border-b border-border-default hover:bg-surface-elevated transition-colors opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${300 + index * 30}ms`, animationFillMode: 'forwards' }}
                  >
                    <td className="py-3 px-4">
                      <Link
                        to={`/asb/${case_.id}`}
                        className="font-mono text-sm text-brand-teal hover:underline"
                      >
                        {case_.reference}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <MapPin size={14} />
                        {getPropertyAddress(case_.propertyId)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary">{case_.category}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold border ${getSeverityColor(case_.severity)}`}>
                        {getSeverityLabel(case_.severity)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        case_.status === 'open' ? 'bg-brand-blue/20 text-brand-blue' :
                        case_.status === 'investigation' ? 'bg-status-warning/20 text-status-warning' :
                        case_.status === 'closed' ? 'bg-status-void/20 text-status-void' :
                        'bg-status-info/20 text-status-info'
                      }`}>
                        {case_.status.charAt(0).toUpperCase() + case_.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <User size={14} />
                        {case_.handler}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-text-muted" />
                        <span className={case_.daysOpen > 60 ? 'text-status-critical' : case_.daysOpen > 30 ? 'text-status-warning' : 'text-text-secondary'}>
                          {case_.daysOpen}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
