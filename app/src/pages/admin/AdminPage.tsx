import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  UsersRound,
  Workflow,
  Plug,
  FileText,
  ArrowRight,
  Activity,
  AlertCircle,
  UserCheck,
  HardDrive
} from 'lucide-react';

interface AdminSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  count?: number;
  color: string;
}

const adminSections: AdminSection[] = [
  {
    id: 'organisation',
    title: 'Organisation',
    description: 'RP number, regulatory status, organisation details',
    icon: <Building2 size={24} />,
    link: '/admin/organisation',
    color: 'brand-teal',
  },
  {
    id: 'users',
    title: 'Users',
    description: 'RBAC, 10 roles, permissions matrix, user management',
    icon: <Users size={24} />,
    link: '/admin/users',
    count: 23,
    color: 'brand-blue',
  },
  {
    id: 'teams',
    title: 'Teams',
    description: 'Team hierarchies, patch management, assignments',
    icon: <UsersRound size={24} />,
    link: '/admin/teams',
    count: 8,
    color: 'brand-peach',
  },
  {
    id: 'workflows',
    title: 'Workflows',
    description: 'Visual builder, pre-built templates, automation rules',
    icon: <Workflow size={24} />,
    link: '/admin/workflows',
    count: 12,
    color: 'status-info',
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'GOV.UK Notify, OS Places, EPC, DWP, payment gateways',
    icon: <Plug size={24} />,
    link: '/admin/integrations',
    count: 6,
    color: 'status-compliant',
  },
  {
    id: 'audit',
    title: 'Audit',
    description: 'Full audit trail, GDPR tools, data export',
    icon: <FileText size={24} />,
    link: '/admin/audit',
    color: 'status-warning',
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight mb-1">Admin</h1>
          <p className="text-text-muted">System configuration, user management, and administrative controls</p>
        </div>

        {/* Admin Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section, index) => (
            <Link
              key={section.id}
              to={section.link}
              className="bg-surface-card rounded-xl border border-border-default p-6 hover:border-brand-teal transition-all duration-300 opacity-0 animate-fade-in-up group"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${section.color}/20 text-${section.color}`}>
                  {section.icon}
                </div>
                <ArrowRight
                  size={20}
                  className="text-text-muted group-hover:text-brand-teal group-hover:translate-x-1 transition-all duration-200"
                />
              </div>

              <h2 className="text-xl font-bold font-heading text-text-primary mb-2 group-hover:text-brand-teal transition-colors">
                {section.title}
              </h2>
              <p className="text-sm text-text-muted mb-4 leading-relaxed">
                {section.description}
              </p>

              {section.count !== undefined && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <span className="font-medium">{section.count}</span>
                  <span className="text-text-muted">items</span>
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* System Health Cards */}
        <div className="mt-8">
          <h2 className="text-xl font-bold font-heading text-brand-peach mb-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
            System Health
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-card rounded-lg border border-border-default p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-status-compliant/20 text-status-compliant">
                  <Activity size={20} />
                </div>
                <div>
                  <div className="text-xs text-text-muted uppercase tracking-wider">API Response</div>
                  <div className="text-xl font-bold font-heading text-text-primary">45ms</div>
                </div>
              </div>
            </div>
            <div className="bg-surface-card rounded-lg border border-border-default p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-status-compliant/20 text-status-compliant">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <div className="text-xs text-text-muted uppercase tracking-wider">Error Rate</div>
                  <div className="text-xl font-bold font-heading text-text-primary">0.02%</div>
                </div>
              </div>
            </div>
            <div className="bg-surface-card rounded-lg border border-border-default p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-teal/20 text-brand-teal">
                  <UserCheck size={20} />
                </div>
                <div>
                  <div className="text-xs text-text-muted uppercase tracking-wider">Active Users</div>
                  <div className="text-xl font-bold font-heading text-text-primary">23</div>
                </div>
              </div>
            </div>
            <div className="bg-surface-card rounded-lg border border-border-default p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '550ms', animationFillMode: 'forwards' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-status-warning/20 text-status-warning">
                  <HardDrive size={20} />
                </div>
                <div>
                  <div className="text-xs text-text-muted uppercase tracking-wider">Storage</div>
                  <div className="text-xl font-bold font-heading text-text-primary">67%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
