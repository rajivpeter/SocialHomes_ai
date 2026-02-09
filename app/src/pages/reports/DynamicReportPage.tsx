import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Clock, Shield, Wrench, Home, Users, PoundSterling, BarChart3, FileText } from 'lucide-react';
import { useProperties, useTenants, useCases, useComplianceOverview, useRentDashboard, useTsmReport } from '@/hooks/useApi';
import { formatCurrency, formatPercent, formatNumber, safeText } from '@/utils/format';
import StatusPill from '@/components/shared/StatusPill';

/* ───── Report Config ───── */
interface ReportConfig {
  title: string;
  category: string;
  description: string;
  icon: React.ReactNode;
}

const reportConfigs: Record<string, ReportConfig> = {
  'hclic':              { title: 'H-CLIC Returns', category: 'Regulatory Returns', description: 'Homelessness case-level information collection for DLUHC', icon: <FileText size={24} /> },
  'rsh':                { title: 'Regulator of Social Housing Returns', category: 'Regulatory Returns', description: 'Annual return to the Regulator of Social Housing', icon: <FileText size={24} /> },
  'core':               { title: 'CORE Lettings Log', category: 'Regulatory Returns', description: 'Continuous Recording of lettings and sales', icon: <FileText size={24} /> },
  'repairs':            { title: 'Repairs Performance Dashboard', category: 'Operational', description: 'Repairs SLA, volumes, and contractor performance', icon: <Wrench size={24} /> },
  'voids':              { title: 'Void Management Report', category: 'Operational', description: 'Void turnaround times, costs, and pipeline', icon: <Home size={24} /> },
  'allocations':        { title: 'Allocations Performance', category: 'Operational', description: 'Lettings, allocations waiting list, and outcomes', icon: <Users size={24} /> },
  'ftf':                { title: 'First-Time-Fix Analysis', category: 'Operational', description: 'Percentage of repairs completed on first visit', icon: <CheckCircle size={24} /> },
  'sla':                { title: 'SLA Compliance Report', category: 'Operational', description: 'Service level agreement adherence across all case types', icon: <Clock size={24} /> },
  'compliance':         { title: 'Big 6 Compliance Dashboard', category: 'Compliance', description: 'Overview of all six landlord safety obligations', icon: <Shield size={24} /> },
  'gas':                { title: 'Gas Safety Compliance', category: 'Compliance', description: 'Gas Safety (Installation and Use) Regulations 1998 compliance', icon: <Shield size={24} /> },
  'eicr':               { title: 'Electrical Safety (EICR)', category: 'Compliance', description: 'Electrical Installation Condition Report compliance', icon: <Shield size={24} /> },
  'fire':               { title: 'Fire Safety Compliance', category: 'Compliance', description: 'Fire Risk Assessment and Regulatory Reform compliance', icon: <Shield size={24} /> },
  'asbestos':           { title: 'Asbestos Management Report', category: 'Compliance', description: 'Control of Asbestos Regulations 2012 compliance', icon: <Shield size={24} /> },
  'awaabs-law':         { title: "Awaab's Law Compliance", category: 'Compliance', description: 'Damp & mould hazard response timescales', icon: <AlertTriangle size={24} /> },
  'rent-collection':    { title: 'Rent Collection Report', category: 'Financial', description: 'Collection rates, payment methods, and trends', icon: <PoundSterling size={24} /> },
  'arrears':            { title: 'Arrears Analysis', category: 'Financial', description: 'Arrears by band, age, tenure type, and recovery actions', icon: <PoundSterling size={24} /> },
  'income-exp':         { title: 'Income & Expenditure', category: 'Financial', description: 'Revenue, costs, and surplus/deficit analysis', icon: <PoundSterling size={24} /> },
  'service-charge':     { title: 'Service Charge Reconciliation', category: 'Financial', description: 'Service charge budgets vs actuals', icon: <PoundSterling size={24} /> },
  'uc-impact':          { title: 'Universal Credit Impact', category: 'Financial', description: 'UC claimant analysis, payment timeliness, and arrears impact', icon: <PoundSterling size={24} /> },
  'board':              { title: 'Board Performance Pack', category: 'Governance', description: 'Executive KPIs for board oversight', icon: <BarChart3 size={24} /> },
  'risk':               { title: 'Risk Register Report', category: 'Governance', description: 'Organisational risk matrix and mitigations', icon: <AlertTriangle size={24} /> },
  'satisfaction':       { title: 'Customer Satisfaction Trends', category: 'Governance', description: 'Satisfaction scores over time across services', icon: <TrendingUp size={24} /> },
  'strategic-kpis':     { title: 'Strategic KPIs Dashboard', category: 'Governance', description: 'Top-level organisational performance indicators', icon: <BarChart3 size={24} /> },
  'tenant-satisfaction':{ title: 'Tenant Satisfaction Survey Results', category: 'Tenant-Facing', description: 'Detailed TSM survey responses and analysis', icon: <Users size={24} /> },
  'service-performance':{ title: 'Service Performance Summary', category: 'Tenant-Facing', description: 'Performance against published service standards', icon: <CheckCircle size={24} /> },
  'community-impact':   { title: 'Community Impact Report', category: 'Tenant-Facing', description: 'Social value, community investment, and outcomes', icon: <Users size={24} /> },
};

/* ───── Shared Components ───── */
function StatCard({ label, value, color = 'text-text-primary', sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
      <div className="text-xs text-text-muted uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-text-muted mt-1">{sub}</div>}
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead><tr className="border-b border-border-default">{headers.map((h, i) => <th key={i} className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-border-default last:border-0">
              {row.map((cell, ci) => <td key={ci} className="px-4 py-2 text-sm text-text-primary">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProgressBar({ value, max, color = 'bg-brand-teal' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-surface-elevated rounded-full h-2.5 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-sm text-text-muted w-12 text-right">{formatPercent(pct)}</span>
    </div>
  );
}

/* ───── Report Body Renderers ───── */

function RepairsReport({ cases }: { cases: any[] }) {
  const repairs = cases.filter((c: any) => c.type === 'repair');
  const emergency = repairs.filter((r: any) => r.priority === 'emergency');
  const urgent = repairs.filter((r: any) => r.priority === 'urgent');
  const routine = repairs.filter((r: any) => r.priority === 'routine');
  const planned = repairs.filter((r: any) => r.priority === 'planned');
  const completed = repairs.filter((r: any) => r.status === 'completed' || r.status === 'closed');
  const openRepairs = repairs.filter((r: any) => r.status !== 'completed' && r.status !== 'closed');
  const avgDaysOpen = openRepairs.length > 0 ? Math.round(openRepairs.reduce((s: number, r: any) => s + (r.daysOpen || 0), 0) / openRepairs.length) : 0;
  const slaBreached = repairs.filter((r: any) => r.slaStatus === 'breached').length;

  return (<>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Total Repairs" value={repairs.length} />
      <StatCard label="Completed" value={completed.length} color="text-status-compliant" />
      <StatCard label="Open" value={openRepairs.length} color="text-brand-teal" />
      <StatCard label="SLA Breached" value={slaBreached} color="text-status-critical" />
    </div>
    <div className="bg-surface-card rounded-lg p-6 border border-border-default">
      <h3 className="text-lg font-bold text-text-primary mb-4">By Priority</h3>
      <div className="space-y-3">
        <div><div className="flex justify-between text-sm mb-1"><span className="text-text-muted">Emergency (24hr)</span><span className="text-text-primary font-medium">{emergency.length}</span></div><ProgressBar value={emergency.length} max={repairs.length} color="bg-status-critical" /></div>
        <div><div className="flex justify-between text-sm mb-1"><span className="text-text-muted">Urgent (5 WD)</span><span className="text-text-primary font-medium">{urgent.length}</span></div><ProgressBar value={urgent.length} max={repairs.length} color="bg-status-warning" /></div>
        <div><div className="flex justify-between text-sm mb-1"><span className="text-text-muted">Routine (20 WD)</span><span className="text-text-primary font-medium">{routine.length}</span></div><ProgressBar value={routine.length} max={repairs.length} color="bg-brand-blue" /></div>
        <div><div className="flex justify-between text-sm mb-1"><span className="text-text-muted">Planned (90 days)</span><span className="text-text-primary font-medium">{planned.length}</span></div><ProgressBar value={planned.length} max={repairs.length} color="bg-status-compliant" /></div>
      </div>
    </div>
    <div className="bg-surface-card rounded-lg p-6 border border-border-default">
      <h3 className="text-lg font-bold text-text-primary mb-2">Performance</h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div><div className="text-3xl font-bold text-brand-teal">{repairs.length > 0 ? formatPercent((completed.length / repairs.length) * 100) : '0%'}</div><div className="text-xs text-text-muted">Completion Rate</div></div>
        <div><div className="text-3xl font-bold text-text-primary">{avgDaysOpen}</div><div className="text-xs text-text-muted">Avg Days Open</div></div>
        <div><div className="text-3xl font-bold text-status-compliant">{repairs.length > 0 ? formatPercent(((repairs.length - slaBreached) / repairs.length) * 100) : '100%'}</div><div className="text-xs text-text-muted">SLA Compliance</div></div>
      </div>
    </div>
  </>);
}

function VoidsReport({ properties }: { properties: any[] }) {
  const voids = properties.filter((p: any) => p.isVoid);
  const totalStock = properties.length;
  const voidRate = totalStock > 0 ? (voids.length / totalStock) * 100 : 0;
  return (<>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Total Voids" value={voids.length} color="text-status-warning" />
      <StatCard label="Total Stock" value={totalStock} />
      <StatCard label="Void Rate" value={formatPercent(voidRate)} color={voidRate > 3 ? 'text-status-critical' : 'text-status-compliant'} />
      <StatCard label="Avg Turnaround" value="28 days" sub="Target: 21 days" />
    </div>
    <div className="bg-surface-card rounded-lg p-6 border border-border-default">
      <h3 className="text-lg font-bold text-text-primary mb-4">Void Properties</h3>
      {voids.length > 0 ? (
        <DataTable headers={['Address', 'Postcode', 'Type', 'Bedrooms']} rows={voids.map((v: any) => [v.address, v.postcode, v.type, v.bedrooms])} />
      ) : (
        <p className="text-text-muted text-sm">No void properties currently.</p>
      )}
    </div>
  </>);
}

function ComplianceReport({ properties, type }: { properties: any[]; type?: string }) {
  const getStatus = (p: any, key: string) => {
    switch (key) {
      case 'gas': return p.gasSafety?.status || 'na';
      case 'eicr': case 'electrical': return p.eicr?.status || 'na';
      case 'fire': return p.fireSafety?.status || p.compliance?.fire || 'na';
      case 'asbestos': return p.asbestos ? 'valid' : 'na';
      default: return p.compliance?.overall || 'na';
    }
  };
  const key = type || 'overall';
  const compliant = properties.filter((p: any) => ['valid', 'compliant'].includes(getStatus(p, key)));
  const expiring = properties.filter((p: any) => getStatus(p, key) === 'expiring');
  const nonCompliant = properties.filter((p: any) => ['expired', 'non-compliant'].includes(getStatus(p, key)));
  const total = compliant.length + expiring.length + nonCompliant.length;
  const rate = total > 0 ? (compliant.length / total) * 100 : 100;

  return (<>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Compliant" value={compliant.length} color="text-status-compliant" />
      <StatCard label="Expiring" value={expiring.length} color="text-status-warning" />
      <StatCard label="Non-Compliant" value={nonCompliant.length} color="text-status-critical" />
      <StatCard label="Compliance Rate" value={formatPercent(rate)} color={rate >= 99 ? 'text-status-compliant' : rate >= 95 ? 'text-status-warning' : 'text-status-critical'} />
    </div>
    {nonCompliant.length > 0 && (
      <div className="bg-surface-card rounded-lg p-6 border border-status-critical/30">
        <h3 className="text-lg font-bold text-status-critical mb-3">Non-Compliant Properties</h3>
        <DataTable headers={['Address', 'Postcode', 'UPRN', 'Type']} rows={nonCompliant.map((p: any) => [p.address, p.postcode, p.uprn, p.type])} />
      </div>
    )}
    {expiring.length > 0 && (
      <div className="bg-surface-card rounded-lg p-6 border border-status-warning/30">
        <h3 className="text-lg font-bold text-status-warning mb-3">Expiring Soon</h3>
        <DataTable headers={['Address', 'Postcode', 'UPRN', 'Type']} rows={expiring.map((p: any) => [p.address, p.postcode, p.uprn, p.type])} />
      </div>
    )}
  </>);
}

function FinancialReport({ tenants, type }: { tenants: any[]; type: string }) {
  const totalRent = tenants.reduce((s: number, t: any) => s + (t.weeklyCharge || 0), 0) * 52;
  const inArrears = tenants.filter((t: any) => (t.rentBalance || 0) < -50);
  const totalArrears = inArrears.reduce((s: number, t: any) => s + Math.abs(t.rentBalance || 0), 0);
  const collectionRate = totalRent > 0 ? ((totalRent - totalArrears) / totalRent) * 100 : 100;
  const ucClaimants = tenants.filter((t: any) => t.ucStatus === 'claiming' || t.ucStatus === 'transitioning');
  const ddPayers = tenants.filter((t: any) => t.paymentMethod === 'dd');
  const soPayers = tenants.filter((t: any) => t.paymentMethod === 'so');
  const hbPayers = tenants.filter((t: any) => t.paymentMethod === 'hb');

  if (type === 'uc-impact') {
    const ucArrears = ucClaimants.filter((t: any) => (t.rentBalance || 0) < -50);
    const nonUcArrears = tenants.filter((t: any) => t.ucStatus !== 'claiming' && t.ucStatus !== 'transitioning' && (t.rentBalance || 0) < -50);
    return (<>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="UC Claimants" value={ucClaimants.length} color="text-brand-teal" sub={`${tenants.length > 0 ? formatPercent((ucClaimants.length / tenants.length) * 100) : '0%'} of tenants`} />
        <StatCard label="UC In Arrears" value={ucArrears.length} color="text-status-critical" sub={`${ucClaimants.length > 0 ? formatPercent((ucArrears.length / ucClaimants.length) * 100) : '0%'} of UC claimants`} />
        <StatCard label="Non-UC In Arrears" value={nonUcArrears.length} sub={`${(tenants.length - ucClaimants.length) > 0 ? formatPercent((nonUcArrears.length / (tenants.length - ucClaimants.length)) * 100) : '0%'} of non-UC`} />
        <StatCard label="UC Arrears Total" value={formatCurrency(ucArrears.reduce((s: number, t: any) => s + Math.abs(t.rentBalance || 0), 0))} color="text-status-critical" />
      </div>
      <div className="bg-surface-card rounded-lg p-6 border border-border-default">
        <h3 className="text-lg font-bold text-text-primary mb-3">UC Claimants In Arrears</h3>
        <DataTable headers={['Name', 'Balance', 'UC Status', 'Risk Score']} rows={ucArrears.sort((a: any, b: any) => (a.rentBalance || 0) - (b.rentBalance || 0)).slice(0, 20).map((t: any) => [`${t.title} ${t.firstName} ${t.lastName}`, formatCurrency(Math.abs(t.rentBalance || 0)), t.ucStatus, t.arrearsRisk || 'N/A'])} />
      </div>
    </>);
  }

  if (type === 'arrears') {
    const bands = [
      { label: '£0 - £250', min: 0, max: 250 },
      { label: '£250 - £500', min: 250, max: 500 },
      { label: '£500 - £1,000', min: 500, max: 1000 },
      { label: '£1,000 - £2,500', min: 1000, max: 2500 },
      { label: '£2,500+', min: 2500, max: Infinity },
    ];
    return (<>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Tenants In Arrears" value={inArrears.length} color="text-status-critical" />
        <StatCard label="Total Arrears" value={formatCurrency(totalArrears)} color="text-status-critical" />
        <StatCard label="Avg Arrears" value={formatCurrency(inArrears.length > 0 ? totalArrears / inArrears.length : 0)} />
        <StatCard label="Arrears Rate" value={formatPercent(tenants.length > 0 ? (inArrears.length / tenants.length) * 100 : 0)} />
      </div>
      <div className="bg-surface-card rounded-lg p-6 border border-border-default">
        <h3 className="text-lg font-bold text-text-primary mb-3">Arrears by Band</h3>
        <div className="space-y-3">
          {bands.map(b => {
            const count = inArrears.filter((t: any) => { const abs = Math.abs(t.rentBalance || 0); return abs >= b.min && abs < b.max; }).length;
            return (<div key={b.label}><div className="flex justify-between text-sm mb-1"><span className="text-text-muted">{b.label}</span><span className="font-medium text-text-primary">{count} tenants</span></div><ProgressBar value={count} max={inArrears.length} color="bg-status-critical" /></div>);
          })}
        </div>
      </div>
      <div className="bg-surface-card rounded-lg p-6 border border-border-default">
        <h3 className="text-lg font-bold text-text-primary mb-3">Top 15 Arrears Cases</h3>
        <DataTable headers={['Name', 'Balance', 'Payment Method', 'Risk Score']} rows={inArrears.sort((a: any, b: any) => (a.rentBalance || 0) - (b.rentBalance || 0)).slice(0, 15).map((t: any) => [`${t.title} ${t.firstName} ${t.lastName}`, formatCurrency(Math.abs(t.rentBalance || 0)), t.paymentMethod, t.arrearsRisk || 'N/A'])} />
      </div>
    </>);
  }

  // Default: rent collection / income-exp / service-charge
  return (<>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Annual Rental Income" value={formatCurrency(totalRent)} color="text-brand-teal" />
      <StatCard label="Collection Rate" value={formatPercent(collectionRate)} color={collectionRate > 98 ? 'text-status-compliant' : 'text-status-warning'} />
      <StatCard label="Total Arrears" value={formatCurrency(totalArrears)} color="text-status-critical" />
      <StatCard label="Tenants In Arrears" value={inArrears.length} color="text-status-warning" />
    </div>
    <div className="bg-surface-card rounded-lg p-6 border border-border-default">
      <h3 className="text-lg font-bold text-text-primary mb-3">Payment Methods</h3>
      <div className="space-y-3">
        <div><div className="flex justify-between text-sm mb-1"><span className="text-text-muted">Direct Debit</span><span className="font-medium text-text-primary">{ddPayers.length}</span></div><ProgressBar value={ddPayers.length} max={tenants.length} color="bg-status-compliant" /></div>
        <div><div className="flex justify-between text-sm mb-1"><span className="text-text-muted">Standing Order</span><span className="font-medium text-text-primary">{soPayers.length}</span></div><ProgressBar value={soPayers.length} max={tenants.length} color="bg-brand-blue" /></div>
        <div><div className="flex justify-between text-sm mb-1"><span className="text-text-muted">Housing Benefit</span><span className="font-medium text-text-primary">{hbPayers.length}</span></div><ProgressBar value={hbPayers.length} max={tenants.length} color="bg-brand-peach" /></div>
        <div><div className="flex justify-between text-sm mb-1"><span className="text-text-muted">Universal Credit</span><span className="font-medium text-text-primary">{ucClaimants.length}</span></div><ProgressBar value={ucClaimants.length} max={tenants.length} color="bg-status-warning" /></div>
      </div>
    </div>
  </>);
}

function GovernanceReport({ properties, tenants, cases, tsmMeasures, type }: { properties: any[]; tenants: any[]; cases: any[]; tsmMeasures: any[]; type: string }) {
  const repairs = cases.filter((c: any) => c.type === 'repair');
  const complaints = cases.filter((c: any) => c.type === 'complaint');
  const inArrears = tenants.filter((t: any) => (t.rentBalance || 0) < -50);
  const totalArrears = inArrears.reduce((s: number, t: any) => s + Math.abs(t.rentBalance || 0), 0);
  const meetingTarget = tsmMeasures.filter((m: any) => m.actual >= m.target).length;

  if (type === 'risk') {
    const risks = [
      { id: 'R001', name: 'Building Safety Compliance', likelihood: 2, impact: 5, score: 10, status: 'Mitigating', owner: 'Head of Assets' },
      { id: 'R002', name: 'Rent Arrears Increase', likelihood: 3, impact: 4, score: 12, status: 'Monitoring', owner: 'Head of Income' },
      { id: 'R003', name: 'Damp & Mould Claims', likelihood: 4, impact: 4, score: 16, status: 'Active', owner: 'Head of Repairs' },
      { id: 'R004', name: 'Regulatory Intervention', likelihood: 2, impact: 5, score: 10, status: 'Monitoring', owner: 'COO' },
      { id: 'R005', name: 'Staff Retention', likelihood: 3, impact: 3, score: 9, status: 'Mitigating', owner: 'HR Director' },
      { id: 'R006', name: 'Cyber Security Breach', likelihood: 2, impact: 5, score: 10, status: 'Mitigating', owner: 'IT Manager' },
      { id: 'R007', name: 'Housing Ombudsman Orders', likelihood: 3, impact: 3, score: 9, status: 'Monitoring', owner: 'Head of Complaints' },
      { id: 'R008', name: 'Supply Chain Disruption', likelihood: 3, impact: 3, score: 9, status: 'Monitoring', owner: 'Procurement' },
    ];
    return (<>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="High Risks (12+)" value={risks.filter(r => r.score >= 12).length} color="text-status-critical" />
        <StatCard label="Medium Risks (6-11)" value={risks.filter(r => r.score >= 6 && r.score < 12).length} color="text-status-warning" />
        <StatCard label="Low Risks (<6)" value={risks.filter(r => r.score < 6).length} color="text-status-compliant" />
      </div>
      <div className="bg-surface-card rounded-lg p-6 border border-border-default">
        <h3 className="text-lg font-bold text-text-primary mb-3">Risk Register</h3>
        <DataTable headers={['ID', 'Risk', 'L', 'I', 'Score', 'Status', 'Owner']} rows={risks.sort((a, b) => b.score - a.score).map(r => [r.id, r.name, r.likelihood, r.impact, r.score, r.status, r.owner])} />
      </div>
    </>);
  }

  if (type === 'satisfaction') {
    return (<>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="TSM Measures" value={tsmMeasures.length} />
        <StatCard label="Meeting Target" value={meetingTarget} color="text-status-compliant" />
        <StatCard label="Below Target" value={tsmMeasures.length - meetingTarget} color="text-status-critical" />
        <StatCard label="Target Rate" value={tsmMeasures.length > 0 ? formatPercent((meetingTarget / tsmMeasures.length) * 100) : 'N/A'} />
      </div>
      <div className="bg-surface-card rounded-lg p-6 border border-border-default">
        <h3 className="text-lg font-bold text-text-primary mb-3">All TSM Measures</h3>
        <DataTable headers={['Code', 'Measure', 'Actual', 'Target', 'Status']} rows={tsmMeasures.map((m: any) => [m.code, m.name, typeof m.actual === 'number' ? formatPercent(m.actual) : m.actual, typeof m.target === 'number' ? formatPercent(m.target) : m.target, m.actual >= m.target ? 'Meeting' : 'Below'])} />
      </div>
    </>);
  }

  // Board pack / Strategic KPIs
  return (<>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Properties" value={formatNumber(properties.length)} color="text-brand-teal" />
      <StatCard label="Tenancies" value={formatNumber(tenants.length)} />
      <StatCard label="Open Repairs" value={repairs.filter((r: any) => r.status !== 'completed' && r.status !== 'closed').length} color="text-status-warning" />
      <StatCard label="Open Complaints" value={complaints.filter((c: any) => c.status !== 'closed').length} color="text-status-critical" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <StatCard label="Collection Rate" value="97.8%" color="text-status-compliant" />
      <StatCard label="Total Arrears" value={formatCurrency(totalArrears)} color="text-status-warning" />
      <StatCard label="TSM Meeting Target" value={tsmMeasures.length > 0 ? formatPercent((meetingTarget / tsmMeasures.length) * 100) : 'N/A'} />
    </div>
    <div className="bg-surface-card rounded-lg p-6 border border-border-default">
      <h3 className="text-lg font-bold text-text-primary mb-3">Key Performance Indicators</h3>
      <div className="space-y-4">
        {[
          { label: 'Occupancy Rate', value: properties.length > 0 ? ((properties.length - properties.filter((p: any) => p.isVoid).length) / properties.length) * 100 : 0, target: 98 },
          { label: 'Rent Collection', value: 97.8, target: 99 },
          { label: 'Repairs Completed in SLA', value: 89, target: 95 },
          { label: 'Complaint Response Rate', value: 91, target: 95 },
          { label: 'Gas Safety Compliance', value: 99.5, target: 100 },
          { label: 'Tenant Satisfaction', value: 72, target: 80 },
        ].map(kpi => (
          <div key={kpi.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-muted">{kpi.label}</span>
              <span className={`font-medium ${kpi.value >= kpi.target ? 'text-status-compliant' : 'text-status-warning'}`}>{formatPercent(kpi.value)} / {formatPercent(kpi.target)}</span>
            </div>
            <ProgressBar value={kpi.value} max={100} color={kpi.value >= kpi.target ? 'bg-status-compliant' : 'bg-status-warning'} />
          </div>
        ))}
      </div>
    </div>
  </>);
}

function RegulatoryReport({ properties, tenants, cases, type }: { properties: any[]; tenants: any[]; cases: any[]; type: string }) {
  if (type === 'core') {
    const lettings = tenants.filter((t: any) => t.tenancyStartDate && t.tenancyStartDate.includes('2025'));
    return (<>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Lettings (YTD)" value={lettings.length > 0 ? lettings.length : 12} />
        <StatCard label="New Tenancies" value={8} color="text-brand-teal" />
        <StatCard label="Transfers" value={3} />
        <StatCard label="Mutual Exchanges" value={1} />
      </div>
      <div className="bg-surface-card rounded-lg p-6 border border-border-default">
        <h3 className="text-lg font-bold text-text-primary mb-3">Lettings by Property Type</h3>
        <DataTable headers={['Property Type', 'Lettings', 'Avg Let Time (days)']} rows={[['Flat', '7', '24'], ['House', '3', '31'], ['Maisonette', '2', '28']]} />
      </div>
    </>);
  }
  if (type === 'hclic') {
    return (<>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Homelessness Approaches" value={3} />
        <StatCard label="Prevention Cases" value={2} color="text-status-compliant" />
        <StatCard label="Relief Cases" value={1} color="text-status-warning" />
        <StatCard label="Temporary Accommodation" value={0} color="text-brand-teal" />
      </div>
      <div className="bg-surface-card rounded-lg p-6 border border-border-default">
        <p className="text-sm text-text-muted">H-CLIC quarterly return for DLUHC. Data covers approaches to the housing service where homelessness prevention or relief duty was owed. RCHA referred 2 cases to the local authority for statutory assessment.</p>
      </div>
    </>);
  }
  // RSH return
  return (<>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Total Stock" value={formatNumber(properties.length)} />
      <StatCard label="Tenancies" value={formatNumber(tenants.length)} />
      <StatCard label="Open Cases" value={cases.filter((c: any) => c.status !== 'closed' && c.status !== 'completed').length} />
      <StatCard label="Compliance Rate" value="98.7%" color="text-status-compliant" />
    </div>
    <div className="bg-surface-card rounded-lg p-6 border border-border-default">
      <h3 className="text-lg font-bold text-text-primary mb-3">Annual Return Summary</h3>
      <DataTable headers={['Metric', 'Value', 'Prior Year', 'Change']} rows={[
        ['Total social housing units', String(properties.length), '73', '+2'],
        ['Occupied units', String(properties.filter((p: any) => !p.isVoid).length), '70', '+2'],
        ['Average re-let time (days)', '28', '31', '-3'],
        ['Tenant satisfaction (overall)', '72%', '69%', '+3%'],
        ['Complaints received', String(cases.filter((c: any) => c.type === 'complaint').length), '28', '+6'],
        ['Complaints upheld', '12', '10', '+2'],
      ]} />
    </div>
  </>);
}

function SlaReport({ cases }: { cases: any[] }) {
  const types = ['repair', 'complaint', 'damp-mould', 'asb'];
  const stats = types.map(t => {
    const typeCases = cases.filter((c: any) => c.type === t);
    const breached = typeCases.filter((c: any) => c.slaStatus === 'breached');
    return { type: t, total: typeCases.length, breached: breached.length, rate: typeCases.length > 0 ? ((typeCases.length - breached.length) / typeCases.length) * 100 : 100 };
  });
  return (<>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(s => <StatCard key={s.type} label={`${s.type.charAt(0).toUpperCase() + s.type.slice(1)} SLA`} value={formatPercent(s.rate)} color={s.rate >= 95 ? 'text-status-compliant' : s.rate >= 85 ? 'text-status-warning' : 'text-status-critical'} sub={`${s.breached} of ${s.total} breached`} />)}
    </div>
    <div className="bg-surface-card rounded-lg p-6 border border-border-default">
      <h3 className="text-lg font-bold text-text-primary mb-3">SLA by Case Type</h3>
      <div className="space-y-3">
        {stats.map(s => (
          <div key={s.type}><div className="flex justify-between text-sm mb-1"><span className="text-text-muted capitalize">{s.type.replace('-', ' ')}</span><span className="font-medium">{formatPercent(s.rate)}</span></div><ProgressBar value={s.rate} max={100} color={s.rate >= 95 ? 'bg-status-compliant' : 'bg-status-warning'} /></div>
        ))}
      </div>
    </div>
  </>);
}

function FtfReport({ cases }: { cases: any[] }) {
  const repairs = cases.filter((c: any) => c.type === 'repair');
  const completed = repairs.filter((r: any) => r.status === 'completed' || r.status === 'closed');
  // Simulate FTF rate based on priority
  const ftfRate = 78; // Simulated
  return (<>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="First-Time-Fix Rate" value={formatPercent(ftfRate)} color="text-brand-teal" sub="Target: 85%" />
      <StatCard label="Total Completed" value={completed.length} />
      <StatCard label="Fixed First Visit" value={Math.round(completed.length * 0.78)} color="text-status-compliant" />
      <StatCard label="Required Recall" value={Math.round(completed.length * 0.22)} color="text-status-warning" />
    </div>
    <div className="bg-surface-card rounded-lg p-6 border border-border-default">
      <h3 className="text-lg font-bold text-text-primary mb-3">FTF by Priority</h3>
      <div className="space-y-3">
        {[{ label: 'Emergency', rate: 65 }, { label: 'Urgent', rate: 72 }, { label: 'Routine', rate: 84 }, { label: 'Planned', rate: 92 }].map(p => (
          <div key={p.label}><div className="flex justify-between text-sm mb-1"><span className="text-text-muted">{p.label}</span><span className="font-medium">{formatPercent(p.rate)}</span></div><ProgressBar value={p.rate} max={100} color={p.rate >= 85 ? 'bg-status-compliant' : 'bg-status-warning'} /></div>
        ))}
      </div>
    </div>
  </>);
}

function TenantFacingReport({ tenants, tsmMeasures, type }: { tenants: any[]; tsmMeasures: any[]; type: string }) {
  if (type === 'community-impact') {
    return (<>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Tenancies Sustained (12m)" value={formatPercent(96.5)} color="text-status-compliant" />
        <StatCard label="Community Events" value="14" sub="Last 12 months" />
        <StatCard label="Residents Engaged" value="412" />
      </div>
      <div className="bg-surface-card rounded-lg p-6 border border-border-default">
        <h3 className="text-lg font-bold text-text-primary mb-3">Social Value Delivered</h3>
        <DataTable headers={['Initiative', 'Beneficiaries', 'Social Value']} rows={[['Financial inclusion support', '34 tenants', '£42,000'], ['Employment & training referrals', '12 tenants', '£18,000'], ['Digital inclusion programme', '28 tenants', '£8,400'], ['Community garden project', '56 residents', '£5,200'], ['Anti-social behaviour mediation', '8 cases', '£12,000']]} />
      </div>
    </>);
  }
  // Service performance / tenant satisfaction
  const meetingTarget = tsmMeasures.filter((m: any) => m.actual >= m.target).length;
  return (<>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Overall Satisfaction" value="72%" sub="TSM TP01 (target: 80%)" color="text-status-warning" />
      <StatCard label="Repairs Satisfaction" value="76%" sub="TSM TP02" />
      <StatCard label="Listening & Acting" value="68%" sub="TSM TP05" color="text-status-warning" />
      <StatCard label="Keeping Informed" value="74%" sub="TSM TP06" />
    </div>
    <div className="bg-surface-card rounded-lg p-6 border border-border-default">
      <h3 className="text-lg font-bold text-text-primary mb-3">Service Standards Performance</h3>
      <div className="space-y-3">
        {[
          { label: 'Answer phone within 30 seconds', value: 82, target: 90 },
          { label: 'Respond to emails within 2 working days', value: 91, target: 95 },
          { label: 'Emergency repairs within 24 hours', value: 97, target: 100 },
          { label: 'Routine repairs within 20 working days', value: 84, target: 90 },
          { label: 'Complaint Stage 1 response within 10 WD', value: 88, target: 95 },
          { label: 'Anti-social behaviour initial response within 1 WD', value: 95, target: 100 },
        ].map(s => (
          <div key={s.label}><div className="flex justify-between text-sm mb-1"><span className="text-text-muted">{s.label}</span><span className={`font-medium ${s.value >= s.target ? 'text-status-compliant' : 'text-status-warning'}`}>{formatPercent(s.value)}</span></div><ProgressBar value={s.value} max={100} color={s.value >= s.target ? 'bg-status-compliant' : 'bg-status-warning'} /></div>
        ))}
      </div>
    </div>
  </>);
}

function AwaabsLawReport({ cases }: { cases: any[] }) {
  const dampCases = cases.filter((c: any) => c.type === 'damp-mould');
  const emergency = dampCases.filter((c: any) => c.hazardClassification === 'emergency');
  const significant = dampCases.filter((c: any) => c.hazardClassification === 'significant');
  const open = dampCases.filter((c: any) => c.status !== 'closed');
  return (<>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Total D&M Cases" value={dampCases.length} />
      <StatCard label="Emergency" value={emergency.length} color="text-status-critical" />
      <StatCard label="Significant" value={significant.length} color="text-status-warning" />
      <StatCard label="Open Cases" value={open.length} color="text-brand-teal" />
    </div>
    <div className="bg-surface-card rounded-lg p-6 border border-border-default">
      <h3 className="text-lg font-bold text-text-primary mb-3">Statutory Timescales</h3>
      <DataTable headers={['Hazard Level', 'Investigate', 'Summary', 'Safety Works', 'Full Repair']} rows={[['Emergency', '—', '—', '24 hours', '—'], ['Significant', '10 WD', '3 WD', '5 WD (safety)', '12 weeks']]} />
    </div>
    <div className="bg-surface-card rounded-lg p-6 border border-border-default">
      <h3 className="text-lg font-bold text-text-primary mb-3">Active Cases</h3>
      <DataTable headers={['Reference', 'Subject', 'Classification', 'Status', 'Days Open']} rows={open.map((c: any) => [c.reference, c.subject, c.hazardClassification || 'N/A', c.status, c.daysOpen || 'N/A'])} />
    </div>
  </>);
}

function AllocationsReport({ properties, tenants }: { properties: any[]; tenants: any[] }) {
  const voids = properties.filter((p: any) => p.isVoid);
  return (<>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Void Properties" value={voids.length} />
      <StatCard label="Awaiting Allocation" value={Math.max(0, voids.length - 2)} />
      <StatCard label="Under Offer" value={Math.min(2, voids.length)} color="text-brand-teal" />
      <StatCard label="Avg Wait Time" value="42 days" />
    </div>
    <div className="bg-surface-card rounded-lg p-6 border border-border-default">
      <h3 className="text-lg font-bold text-text-primary mb-3">Allocation Pipeline</h3>
      <DataTable headers={['Address', 'Type', 'Bedrooms', 'Status']} rows={voids.map((p: any) => [p.address, p.type, p.bedrooms, 'Awaiting allocation'])} />
    </div>
  </>);
}

/* ───── Main Component ───── */
export default function DynamicReportPage() {
  const { slug } = useParams<{ slug: string }>();
  const config = slug ? reportConfigs[slug] : null;

  const { data: properties = [] } = useProperties();
  const { data: tenants = [] } = useTenants();
  const { data: cases = [] } = useCases();
  const { data: tsmMeasures = [] } = useTsmReport();

  if (!config) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Report Not Found</h1>
        <p className="text-text-muted mb-4">The report "{slug}" does not exist.</p>
        <Link to="/reports" className="text-brand-teal hover:underline">← Back to Reports</Link>
      </div>
    );
  }

  const renderBody = () => {
    if (!slug) return null;
    // Operational
    if (slug === 'repairs') return <RepairsReport cases={cases} />;
    if (slug === 'voids') return <VoidsReport properties={properties} />;
    if (slug === 'allocations') return <AllocationsReport properties={properties} tenants={tenants} />;
    if (slug === 'ftf') return <FtfReport cases={cases} />;
    if (slug === 'sla') return <SlaReport cases={cases} />;
    // Compliance
    if (['compliance', 'gas', 'eicr', 'fire', 'asbestos'].includes(slug)) return <ComplianceReport properties={properties} type={slug} />;
    if (slug === 'awaabs-law') return <AwaabsLawReport cases={cases} />;
    // Financial
    if (['rent-collection', 'arrears', 'income-exp', 'service-charge', 'uc-impact'].includes(slug)) return <FinancialReport tenants={tenants} type={slug} />;
    // Governance
    if (['board', 'risk', 'satisfaction', 'strategic-kpis'].includes(slug)) return <GovernanceReport properties={properties} tenants={tenants} cases={cases} tsmMeasures={tsmMeasures} type={slug} />;
    // Regulatory
    if (['core', 'hclic', 'rsh'].includes(slug)) return <RegulatoryReport properties={properties} tenants={tenants} cases={cases} type={slug} />;
    // Tenant-facing
    if (['tenant-satisfaction', 'service-performance', 'community-impact'].includes(slug)) return <TenantFacingReport tenants={tenants} tsmMeasures={tsmMeasures} type={slug} />;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <Link to="/reports" className="text-brand-teal hover:underline text-sm mb-3 inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Back to Reports
          </Link>
          <div className="flex items-start justify-between mt-2">
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider mb-1">{config.category}</div>
              <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight">{config.title}</h1>
              <p className="text-text-muted mt-1">{config.description}</p>
            </div>
            <button className="px-4 py-2 bg-brand-teal/10 text-brand-teal rounded-lg hover:bg-brand-teal/20 transition-colors text-sm font-medium inline-flex items-center gap-2">
              <Download size={16} /> Export
            </button>
          </div>
          <div className="text-xs text-text-muted mt-3">Report generated: 09/02/2026 &middot; Data source: Firestore &middot; Period: FY 2025/26</div>
        </div>

        {/* Body */}
        <div className="space-y-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          {renderBody()}
        </div>
      </div>
    </div>
  );
}
