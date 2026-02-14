import { useParams, Link } from 'react-router-dom';
import { Shield, CheckCircle, AlertTriangle, Clock, ArrowLeft } from 'lucide-react';
import { useProperties } from '@/hooks/useApi';
import StatusPill from '@/components/shared/StatusPill';
import { formatPercent, safeText } from '@/utils/format';

const typeLabels: Record<string, string> = {
  gas: 'Gas Safety',
  electrical: 'Electrical Safety (EICR)',
  fire: 'Fire Safety',
  asbestos: 'Asbestos Management',
  legionella: 'Water Safety (Legionella)',
  lifts: 'Lift Safety',
};

const typeIcons: Record<string, string> = {
  gas: '🔥', electrical: '⚡', fire: '🚨', asbestos: '⚠️', legionella: '💧', lifts: '🛗',
};

/** Maps compliance type key to the property field that holds the status */
function getComplianceStatus(property: any, typeKey: string): string {
  switch (typeKey) {
    case 'gas': return property.gasSafety?.status || 'na';
    case 'electrical': return property.eicr?.status || 'na';
    case 'fire': return property.fireSafety?.status || property.compliance?.fire || 'na';
    case 'asbestos': return property.asbestos ? (property.asbestos.riskLevel === 'low' ? 'valid' : 'expiring') : 'na';
    case 'legionella': return property.legionella?.status || property.compliance?.legionella || 'na';
    case 'lifts': return property.lifts?.status || property.compliance?.lifts || 'na';
    default: return 'na';
  }
}

function getExpiryDate(property: any, typeKey: string): string {
  switch (typeKey) {
    case 'gas': return safeText(property.gasSafety?.expiryDate);
    case 'electrical': return safeText(property.eicr?.expiryDate);
    case 'fire': return safeText(property.fireSafety?.expiryDate, 'On file');
    case 'asbestos': return safeText(property.asbestos?.lastSurvey, 'On file');
    case 'legionella': return safeText(property.legionella?.expiryDate, 'On file');
    case 'lifts': return safeText(property.lifts?.expiryDate, 'On file');
    default: return 'N/A';
  }
}

export default function ComplianceTypePage() {
  const { type } = useParams<{ type: string }>();
  const { data: properties = [] } = useProperties();

  const typeKey = type || 'gas';
  const label = typeLabels[typeKey] || typeKey;
  const icon = typeIcons[typeKey] || '🛡️';

  // Categorise properties by compliance status
  const compliant = properties.filter((p: any) => {
    const s = getComplianceStatus(p, typeKey);
    return s === 'valid' || s === 'compliant';
  });
  const expiring = properties.filter((p: any) => {
    const s = getComplianceStatus(p, typeKey);
    return s === 'expiring';
  });
  const nonCompliant = properties.filter((p: any) => {
    const s = getComplianceStatus(p, typeKey);
    return s === 'expired' || s === 'non-compliant';
  });
  const na = properties.filter((p: any) => {
    const s = getComplianceStatus(p, typeKey);
    return s === 'na';
  });

  const totalApplicable = compliant.length + expiring.length + nonCompliant.length;
  const percentage = totalApplicable > 0 ? (compliant.length / totalApplicable) * 100 : 100;

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <Link to="/compliance" className="text-brand-teal hover:underline text-sm mb-4 inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Back to Compliance
          </Link>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-4xl">{icon}</span>
            <div>
              <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight">{label}</h1>
              <p className="text-text-muted">Property-level compliance status</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <div className="bg-status-compliant/10 border border-status-compliant/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={18} className="text-status-compliant" />
              <span className="text-sm text-status-compliant font-medium">Compliant</span>
            </div>
            <div className="text-3xl font-bold text-status-compliant">{compliant.length}</div>
          </div>
          <div className="bg-status-warning/10 border border-status-warning/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={18} className="text-status-warning" />
              <span className="text-sm text-status-warning font-medium">Expiring</span>
            </div>
            <div className="text-3xl font-bold text-status-warning">{expiring.length}</div>
          </div>
          <div className="bg-status-critical/10 border border-status-critical/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className="text-status-critical" />
              <span className="text-sm text-status-critical font-medium">Non-Compliant</span>
            </div>
            <div className="text-3xl font-bold text-status-critical">{nonCompliant.length}</div>
          </div>
          <div className="bg-surface-card border border-border-default rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={18} className="text-brand-teal" />
              <span className="text-sm text-text-muted font-medium">Overall</span>
            </div>
            <div className="text-3xl font-bold text-brand-teal">{formatPercent(percentage)}</div>
          </div>
        </div>

        {/* Non-Compliant properties (show first) */}
        {nonCompliant.length > 0 && (
          <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <h2 className="text-lg font-bold text-status-critical mb-3">Non-Compliant Properties</h2>
            <div className="space-y-2">
              {nonCompliant.map((p: any) => (
                <Link key={p.id} to={`/properties/${p.id}`} className="flex items-center justify-between bg-status-critical/5 border border-status-critical/20 rounded-lg p-4 hover:bg-status-critical/10 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-text-primary">{p.address}</div>
                    <div className="text-xs text-text-muted font-mono">{p.uprn} &middot; {p.postcode}</div>
                  </div>
                  <div className="text-right">
                    <StatusPill status="expired" size="sm" />
                    <div className="text-xs text-text-muted mt-1">Expires: {getExpiryDate(p, typeKey)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Expiring properties */}
        {expiring.length > 0 && (
          <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
            <h2 className="text-lg font-bold text-status-warning mb-3">Expiring Soon</h2>
            <div className="space-y-2">
              {expiring.map((p: any) => (
                <Link key={p.id} to={`/properties/${p.id}`} className="flex items-center justify-between bg-status-warning/5 border border-status-warning/20 rounded-lg p-4 hover:bg-status-warning/10 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-text-primary">{p.address}</div>
                    <div className="text-xs text-text-muted font-mono">{p.uprn} &middot; {p.postcode}</div>
                  </div>
                  <div className="text-right">
                    <StatusPill status="expiring" size="sm" />
                    <div className="text-xs text-text-muted mt-1">Expires: {getExpiryDate(p, typeKey)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Compliant properties */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
          <h2 className="text-lg font-bold text-status-compliant mb-3">Compliant ({compliant.length})</h2>
          <div className="space-y-2">
            {compliant.map((p: any) => (
              <Link key={p.id} to={`/properties/${p.id}`} className="flex items-center justify-between bg-surface-card border border-border-default rounded-lg p-4 hover:bg-surface-hover transition-colors">
                <div>
                  <div className="text-sm font-medium text-text-primary">{p.address}</div>
                  <div className="text-xs text-text-muted font-mono">{p.uprn} &middot; {p.postcode}</div>
                </div>
                <div className="text-right">
                  <StatusPill status="valid" size="sm" />
                  <div className="text-xs text-text-muted mt-1">Expires: {getExpiryDate(p, typeKey)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
