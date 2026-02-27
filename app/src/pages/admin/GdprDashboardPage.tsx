import { useState } from 'react';
import {
  Shield, FileText, Clock, CheckCircle, AlertCircle, Download,
  Eye, Trash2, Search, Filter, Calendar, User, Database,
  Lock, Unlock, ArrowRight, BarChart3
} from 'lucide-react';

interface SarRequest {
  id: string;
  reference: string;
  tenantName: string;
  tenantId: string;
  requestDate: string;
  deadlineDate: string;
  status: 'received' | 'processing' | 'complete' | 'overdue';
  assignedTo: string;
  dataCollected: number; // percentage
  notes: string;
}

interface RetentionPolicy {
  id: string;
  dataType: string;
  retentionPeriod: string;
  legalBasis: string;
  lastReview: string;
  recordCount: number;
  nextPurgeDate: string;
}

interface ConsentRecord {
  id: string;
  tenantName: string;
  purpose: string;
  status: 'granted' | 'withdrawn' | 'pending';
  grantedDate: string;
  expiryDate?: string;
}

const mockSarRequests: SarRequest[] = [
  { id: 'sar-001', reference: 'SAR-2026-0041', tenantName: 'Mrs Patricia Wong', tenantId: 't-012', requestDate: '2026-02-15', deadlineDate: '2026-03-15', status: 'processing', assignedTo: 'David Okafor', dataCollected: 65, notes: 'Waiting for communications archive extraction' },
  { id: 'sar-002', reference: 'SAR-2026-0040', tenantName: 'Mr James Peters', tenantId: 't-028', requestDate: '2026-02-10', deadlineDate: '2026-03-10', status: 'processing', assignedTo: 'Amy Chen', dataCollected: 85, notes: 'Final review before sending' },
  { id: 'sar-003', reference: 'SAR-2026-0039', tenantName: 'Ms Angela Dunn', tenantId: 't-045', requestDate: '2026-01-28', deadlineDate: '2026-02-28', status: 'overdue', assignedTo: 'David Okafor', dataCollected: 40, notes: 'Complex case with multiple property histories' },
  { id: 'sar-004', reference: 'SAR-2026-0038', tenantName: 'Mr Steven Harrison', tenantId: 't-007', requestDate: '2026-01-20', deadlineDate: '2026-02-20', status: 'complete', assignedTo: 'Amy Chen', dataCollected: 100, notes: 'Sent via secure email 2026-02-18' },
  { id: 'sar-005', reference: 'SAR-2026-0037', tenantName: 'Mrs Fatima Ali', tenantId: 't-033', requestDate: '2026-01-12', deadlineDate: '2026-02-12', status: 'complete', assignedTo: 'David Okafor', dataCollected: 100, notes: 'Posted registered mail 2026-02-10' },
];

const mockPolicies: RetentionPolicy[] = [
  { id: 'rp-001', dataType: 'Tenancy Records', retentionPeriod: '6 years after end of tenancy', legalBasis: 'Limitation Act 1980', lastReview: '2025-09-15', recordCount: 1247, nextPurgeDate: '2026-09-15' },
  { id: 'rp-002', dataType: 'Repair Records', retentionPeriod: '6 years after completion', legalBasis: 'Limitation Act 1980', lastReview: '2025-09-15', recordCount: 3891, nextPurgeDate: '2026-09-15' },
  { id: 'rp-003', dataType: 'Complaint Records', retentionPeriod: '7 years after closure', legalBasis: 'Housing Ombudsman Code', lastReview: '2025-09-15', recordCount: 456, nextPurgeDate: '2026-09-15' },
  { id: 'rp-004', dataType: 'Financial Records', retentionPeriod: '7 years', legalBasis: 'HMRC Requirements', lastReview: '2025-09-15', recordCount: 8234, nextPurgeDate: '2026-09-15' },
  { id: 'rp-005', dataType: 'CCTV Footage', retentionPeriod: '31 days', legalBasis: 'ICO Guidance', lastReview: '2025-09-15', recordCount: 90, nextPurgeDate: '2026-03-31' },
  { id: 'rp-006', dataType: 'Audit Logs', retentionPeriod: '7 years', legalBasis: 'Regulatory Compliance', lastReview: '2025-09-15', recordCount: 125890, nextPurgeDate: '2033-01-01' },
  { id: 'rp-007', dataType: 'Communication Records', retentionPeriod: '3 years', legalBasis: 'Business Need', lastReview: '2025-09-15', recordCount: 15678, nextPurgeDate: '2029-01-01' },
];

const mockConsents: ConsentRecord[] = [
  { id: 'c-001', tenantName: 'Mrs Patricia Wong', purpose: 'Marketing communications', status: 'granted', grantedDate: '2025-06-15', expiryDate: '2026-06-15' },
  { id: 'c-002', tenantName: 'Mr James Peters', purpose: 'Data sharing with support services', status: 'granted', grantedDate: '2025-08-10' },
  { id: 'c-003', tenantName: 'Ms Angela Dunn', purpose: 'Marketing communications', status: 'withdrawn', grantedDate: '2025-03-20' },
  { id: 'c-004', tenantName: 'Mr Steven Harrison', purpose: 'Photography for repairs', status: 'pending', grantedDate: '2026-02-25' },
];

export default function GdprDashboardPage() {
  const [activeTab, setActiveTab] = useState<'sar' | 'retention' | 'consent' | 'dpr'>('sar');
  const [sarFilter, setSarFilter] = useState<string>('');

  const sarStats = {
    total: mockSarRequests.length,
    processing: mockSarRequests.filter(s => s.status === 'processing').length,
    overdue: mockSarRequests.filter(s => s.status === 'overdue').length,
    complete: mockSarRequests.filter(s => s.status === 'complete').length,
  };

  const statusColors: Record<string, string> = {
    received: 'bg-status-info/15 text-status-info',
    processing: 'bg-status-warning/15 text-status-warning',
    complete: 'bg-status-compliant/15 text-status-compliant',
    overdue: 'bg-status-critical/15 text-status-critical',
    granted: 'bg-status-compliant/15 text-status-compliant',
    withdrawn: 'bg-status-critical/15 text-status-critical',
    pending: 'bg-status-warning/15 text-status-warning',
  };

  const filteredSar = sarFilter
    ? mockSarRequests.filter(s => s.status === sarFilter)
    : mockSarRequests;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-brand-peach flex items-center gap-2">
          <Shield size={24} className="text-brand-teal" /> GDPR Compliance Dashboard
        </h1>
        <p className="text-sm text-text-muted mt-1">Data protection, Subject Access Requests, retention policies, and consent management</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-border-default rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-brand-teal" />
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Active SARs</span>
          </div>
          <div className="text-2xl font-bold font-heading text-brand-teal">{sarStats.processing}</div>
          <div className="text-[10px] text-text-muted mt-1">of {sarStats.total} total requests</div>
        </div>
        <div className="bg-surface-card border border-border-default rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-status-critical" />
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Overdue</span>
          </div>
          <div className="text-2xl font-bold font-heading text-status-critical">{sarStats.overdue}</div>
          <div className="text-[10px] text-text-muted mt-1">requires immediate action</div>
        </div>
        <div className="bg-surface-card border border-border-default rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-status-compliant" />
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Completed</span>
          </div>
          <div className="text-2xl font-bold font-heading text-status-compliant">{sarStats.complete}</div>
          <div className="text-[10px] text-text-muted mt-1">within deadline</div>
        </div>
        <div className="bg-surface-card border border-border-default rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database size={16} className="text-status-ai" />
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Data Records</span>
          </div>
          <div className="text-2xl font-bold font-heading text-status-ai">{(mockPolicies.reduce((s, p) => s + p.recordCount, 0) / 1000).toFixed(0)}k</div>
          <div className="text-[10px] text-text-muted mt-1">across all categories</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-surface-card/60 rounded-xl p-1 border border-border-default">
        {([
          { id: 'sar', label: 'Subject Access Requests', icon: FileText },
          { id: 'retention', label: 'Data Retention', icon: Database },
          { id: 'consent', label: 'Consent Management', icon: Lock },
          { id: 'dpr', label: 'Processing Register', icon: BarChart3 },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id ? 'bg-surface-hover text-text-primary' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* SAR Tab */}
      {activeTab === 'sar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {['', 'processing', 'overdue', 'complete'].map(f => (
                <button
                  key={f}
                  onClick={() => setSarFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    sarFilter === f ? 'bg-brand-teal/15 text-brand-teal' : 'text-text-muted hover:text-text-secondary bg-surface-card border border-border-default'
                  }`}
                >
                  {f || 'All'} {f === 'overdue' && sarStats.overdue > 0 ? `(${sarStats.overdue})` : ''}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-brand-teal text-white rounded-lg text-xs font-medium hover:bg-brand-teal/90 transition-all">
              <Plus size={13} /> New SAR
            </button>
          </div>

          {filteredSar.map(sar => (
            <div key={sar.id} className={`bg-surface-card border rounded-xl p-4 ${sar.status === 'overdue' ? 'border-status-critical/30' : 'border-border-default'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-heading font-bold text-text-primary">{sar.reference}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[sar.status]}`}>
                      {sar.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted transition-all" title="View details">
                    <Eye size={14} />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted transition-all" title="Download data package">
                    <Download size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-xs mb-3">
                <div>
                  <span className="text-text-muted block">Tenant</span>
                  <span className="text-text-primary font-medium">{sar.tenantName}</span>
                </div>
                <div>
                  <span className="text-text-muted block">Requested</span>
                  <span className="text-text-primary">{sar.requestDate}</span>
                </div>
                <div>
                  <span className="text-text-muted block">Deadline</span>
                  <span className={sar.status === 'overdue' ? 'text-status-critical font-medium' : 'text-text-primary'}>{sar.deadlineDate}</span>
                </div>
                <div>
                  <span className="text-text-muted block">Assigned To</span>
                  <span className="text-text-primary">{sar.assignedTo}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-surface-dark rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      sar.status === 'complete' ? 'bg-status-compliant' :
                      sar.status === 'overdue' ? 'bg-status-critical' :
                      'bg-brand-teal'
                    }`}
                    style={{ width: `${sar.dataCollected}%` }}
                  />
                </div>
                <span className="text-[10px] text-text-muted font-mono">{sar.dataCollected}%</span>
              </div>
              {sar.notes && <p className="text-[10px] text-text-muted mt-2 italic">{sar.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Retention Tab */}
      {activeTab === 'retention' && (
        <div className="bg-surface-card border border-border-default rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left p-3 text-text-muted">Data Type</th>
                <th className="text-left p-3 text-text-muted">Retention Period</th>
                <th className="text-left p-3 text-text-muted">Legal Basis</th>
                <th className="text-right p-3 text-text-muted">Records</th>
                <th className="text-left p-3 text-text-muted">Next Purge</th>
                <th className="text-left p-3 text-text-muted">Last Review</th>
              </tr>
            </thead>
            <tbody>
              {mockPolicies.map(p => (
                <tr key={p.id} className="border-b border-border-subtle hover:bg-surface-hover/50 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Database size={14} className="text-brand-teal" />
                      <span className="text-sm font-medium text-text-primary">{p.dataType}</span>
                    </div>
                  </td>
                  <td className="p-3 text-xs text-text-secondary">{p.retentionPeriod}</td>
                  <td className="p-3 text-xs text-text-secondary">{p.legalBasis}</td>
                  <td className="p-3 text-xs text-text-secondary text-right font-mono">{p.recordCount.toLocaleString()}</td>
                  <td className="p-3 text-xs text-text-secondary">{p.nextPurgeDate}</td>
                  <td className="p-3 text-xs text-text-secondary">{p.lastReview}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Consent Tab */}
      {activeTab === 'consent' && (
        <div className="space-y-3">
          {mockConsents.map(c => (
            <div key={c.id} className="bg-surface-card border border-border-default rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${
                  c.status === 'granted' ? 'bg-status-compliant/10' :
                  c.status === 'withdrawn' ? 'bg-status-critical/10' :
                  'bg-status-warning/10'
                }`}>
                  {c.status === 'granted' ? <Unlock size={16} className="text-status-compliant" /> :
                   c.status === 'withdrawn' ? <Lock size={16} className="text-status-critical" /> :
                   <Clock size={16} className="text-status-warning" />}
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">{c.tenantName}</div>
                  <div className="text-xs text-text-muted">{c.purpose}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">
                    Granted: {c.grantedDate}
                    {c.expiryDate && ` • Expires: ${c.expiryDate}`}
                  </div>
                </div>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[c.status]}`}>
                {c.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* DPR Tab */}
      {activeTab === 'dpr' && (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">The Data Processing Register documents all processing activities in accordance with Article 30 GDPR.</p>
          {[
            { activity: 'Tenancy Management', purpose: 'Performance of contract', basis: 'Article 6(1)(b)', categories: 'Name, address, contact, financial', recipients: 'Housing officers, income team', retention: '6 years' },
            { activity: 'Rent Collection', purpose: 'Performance of contract', basis: 'Article 6(1)(b)', categories: 'Financial, bank details, UC data', recipients: 'Income team, DWP (APA)', retention: '7 years' },
            { activity: 'Repairs Management', purpose: 'Performance of contract', basis: 'Article 6(1)(b)', categories: 'Address, contact, photos', recipients: 'Contractors, operatives', retention: '6 years' },
            { activity: 'Vulnerability Assessments', purpose: 'Legitimate interest / vital interest', basis: 'Article 6(1)(d)/(f)', categories: 'Health, welfare, household', recipients: 'Housing officers, support agencies', retention: '6 years' },
            { activity: 'AI Predictions', purpose: 'Legitimate interest', basis: 'Article 6(1)(f)', categories: 'Aggregated property/tenant data', recipients: 'System only (automated)', retention: 'Duration of algorithm model' },
            { activity: 'CCTV Surveillance', purpose: 'Legitimate interest', basis: 'Article 6(1)(f)', categories: 'Video footage', recipients: 'Security team, police', retention: '31 days' },
          ].map((item, i) => (
            <div key={i} className="bg-surface-card border border-border-default rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-heading font-bold text-text-primary">{item.activity}</h3>
                <span className="text-[10px] bg-brand-teal/10 text-brand-teal px-2 py-0.5 rounded-full">{item.basis}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div><span className="text-text-muted block text-[10px]">Purpose</span><span className="text-text-secondary">{item.purpose}</span></div>
                <div><span className="text-text-muted block text-[10px]">Data Categories</span><span className="text-text-secondary">{item.categories}</span></div>
                <div><span className="text-text-muted block text-[10px]">Recipients</span><span className="text-text-secondary">{item.recipients}</span></div>
                <div><span className="text-text-muted block text-[10px]">Retention</span><span className="text-text-secondary">{item.retention}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Plus({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
