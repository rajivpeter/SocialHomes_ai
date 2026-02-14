import { Link } from 'react-router-dom';
import {
  FileText,
  BarChart3,
  Shield,
  PoundSterling,
  Users,
  FileCheck,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface ReportCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  reports: {
    name: string;
    link?: string;
    count?: number;
  }[];
  color: string;
}

const reportCategories: ReportCategory[] = [
  {
    id: 'regulatory',
    title: 'Regulatory Returns',
    description: 'TSM, CORE, H-CLIC, and statutory submissions',
    icon: <FileText size={24} />,
    reports: [
      { name: 'Tenant Satisfaction Measures (TSM)', link: '/reports/tsm' },
      { name: 'CORE Lettings Log', link: '/reports/core' },
      { name: 'H-CLIC Returns', link: '/reports/hclic' },
      { name: 'Regulator of Social Housing Returns', link: '/reports/rsh' },
    ],
    color: 'brand-teal',
  },
  {
    id: 'operational',
    title: 'Operational Performance',
    description: 'Repairs, voids, allocations, and service delivery metrics',
    icon: <BarChart3 size={24} />,
    reports: [
      { name: 'Repairs Performance Dashboard', link: '/reports/repairs' },
      { name: 'Void Management Report', link: '/reports/voids' },
      { name: 'Allocations Performance', link: '/reports/allocations' },
      { name: 'First-Time-Fix Analysis', link: '/reports/ftf' },
      { name: 'SLA Compliance Report', link: '/reports/sla' },
    ],
    color: 'brand-blue',
  },
  {
    id: 'compliance',
    title: 'Compliance Reports',
    description: 'Big 6 compliance, safety, and regulatory adherence',
    icon: <Shield size={24} />,
    reports: [
      { name: 'Big 6 Compliance Dashboard', link: '/reports/compliance' },
      { name: 'Gas Safety Compliance', link: '/reports/gas' },
      { name: 'Electrical Safety (EICR)', link: '/reports/eicr' },
      { name: 'Fire Safety Compliance', link: '/reports/fire' },
      { name: 'Asbestos Management Report', link: '/reports/asbestos' },
      { name: 'Awaab\'s Law Compliance', link: '/reports/awaabs-law' },
    ],
    color: 'status-compliant',
  },
  {
    id: 'financial',
    title: 'Financial Reports',
    description: 'Rent collection, arrears, income, and financial performance',
    icon: <PoundSterling size={24} />,
    reports: [
      { name: 'Rent Collection Report', link: '/reports/rent-collection' },
      { name: 'Arrears Analysis', link: '/reports/arrears' },
      { name: 'Income & Expenditure', link: '/reports/income-exp' },
      { name: 'Service Charge Reconciliation', link: '/reports/service-charge' },
      { name: 'Universal Credit Impact', link: '/reports/uc-impact' },
    ],
    color: 'brand-peach',
  },
  {
    id: 'governance',
    title: 'Governance',
    description: 'Board reports, risk management, and strategic metrics',
    icon: <FileCheck size={24} />,
    reports: [
      { name: 'Board Performance Pack', link: '/reports/board' },
      { name: 'Risk Register Report', link: '/reports/risk' },
      { name: 'Customer Satisfaction Trends', link: '/reports/satisfaction' },
      { name: 'Strategic KPIs Dashboard', link: '/reports/strategic-kpis' },
    ],
    color: 'status-info',
  },
  {
    id: 'tenant-facing',
    title: 'Tenant-Facing',
    description: 'Reports and dashboards for tenant engagement',
    icon: <Users size={24} />,
    reports: [
      { name: 'Tenant Satisfaction Survey Results', link: '/reports/tenant-satisfaction' },
      { name: 'Service Performance Summary', link: '/reports/service-performance' },
      { name: 'Community Impact Report', link: '/reports/community-impact' },
    ],
    color: 'brand-garnet',
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight mb-1">Reports</h1>
          <p className="text-text-muted">Access all regulatory returns, performance dashboards, and analytical reports</p>
        </div>

        {/* Report Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportCategories.map((category, index) => (
            <div
              key={category.id}
              className="bg-surface-card rounded-xl border border-border-default p-6 hover:border-brand-teal transition-all duration-300 opacity-0 animate-fade-in-up group"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
            >
              {/* Category Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${category.color}/20 text-${category.color}`}>
                  {category.icon}
                </div>
                <ArrowRight 
                  size={20} 
                  className="text-text-muted group-hover:text-brand-teal group-hover:translate-x-1 transition-all duration-200" 
                />
              </div>

              <h2 className="text-xl font-bold font-heading text-text-primary mb-2 group-hover:text-brand-teal transition-colors">
                {category.title}
              </h2>
              <p className="text-sm text-text-muted mb-4 leading-relaxed">
                {category.description}
              </p>

              {/* Reports List */}
              <div className="space-y-2">
                {category.reports.map((report, reportIndex) => (
                  <div
                    key={reportIndex}
                    className="opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${(index * 50) + (reportIndex * 30)}ms`, animationFillMode: 'forwards' }}
                  >
                    {report.link ? (
                      <Link
                        to={report.link}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-elevated transition-colors group/item"
                      >
                        <span className="text-sm text-text-secondary group-hover/item:text-text-primary transition-colors">
                          {report.name}
                        </span>
                        {report.count !== undefined && (
                          <span className="text-xs text-text-muted bg-surface-elevated px-2 py-0.5 rounded">
                            {report.count}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <div className="flex items-center justify-between p-2 rounded-lg">
                        <span className="text-sm text-text-secondary">{report.name}</span>
                        {report.count !== undefined && (
                          <span className="text-xs text-text-muted bg-surface-elevated px-2 py-0.5 rounded">
                            {report.count}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-surface-card rounded-lg border border-border-default p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-compliant/20 text-status-compliant">
                <CheckCircle size={20} />
              </div>
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Due This Month</div>
                <div className="text-xl font-bold font-heading text-text-primary">3</div>
              </div>
            </div>
          </div>
          <div className="bg-surface-card rounded-lg border border-border-default p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-warning/20 text-status-warning">
                <AlertTriangle size={20} />
              </div>
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Overdue</div>
                <div className="text-xl font-bold font-heading text-text-primary">0</div>
              </div>
            </div>
          </div>
          <div className="bg-surface-card rounded-lg border border-border-default p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-teal/20 text-brand-teal">
                <TrendingUp size={20} />
              </div>
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Last Updated</div>
                <div className="text-sm font-medium text-text-primary">07/02/2026</div>
              </div>
            </div>
          </div>
          <div className="bg-surface-card rounded-lg border border-border-default p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '550ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-info/20 text-status-info">
                <FileText size={20} />
              </div>
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Total Reports</div>
                <div className="text-xl font-bold font-heading text-text-primary">27</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
