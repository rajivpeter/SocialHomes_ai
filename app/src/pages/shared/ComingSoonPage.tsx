import { Link, useLocation } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';

export default function ComingSoonPage() {
  const location = useLocation();
  const pageName = location.pathname
    .split('/')
    .filter(Boolean)
    .map(s => s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
    .join(' > ');

  return (
    <div className="space-y-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-surface-card rounded-lg p-12 border border-border-default text-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <Construction size={64} className="mx-auto mb-6 text-brand-teal opacity-50" />
          <h1 className="text-2xl font-bold font-heading text-text-primary mb-2">Coming Soon</h1>
          <p className="text-text-muted mb-2">{pageName}</p>
          <p className="text-sm text-text-muted mb-6 max-w-md mx-auto">
            This report is under development and will be available in a future release.
            SocialHomes.Ai is continuously evolving with new features and reports.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/reports"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-teal/10 text-brand-teal rounded-lg hover:bg-brand-teal/20 transition-colors text-sm font-medium"
            >
              <ArrowLeft size={16} /> Back to Reports
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-surface-elevated text-text-muted rounded-lg hover:bg-surface-hover transition-colors text-sm font-medium border border-border-default"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
