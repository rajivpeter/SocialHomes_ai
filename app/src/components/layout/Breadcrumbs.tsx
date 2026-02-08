import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const routeLabels: Record<string, string> = {
  'dashboard': 'Dashboard',
  'explore': 'Explore',
  'tenancies': 'Tenancies',
  'properties': 'Properties',
  'repairs': 'Repairs',
  'rent': 'Rent & Income',
  'compliance': 'Compliance',
  'complaints': 'Complaints',
  'allocations': 'Allocations',
  'asb': 'ASB',
  'communications': 'Communications',
  'reports': 'Reports',
  'ai': 'AI Centre',
  'admin': 'Admin',
  'search': 'Search Results',
  'briefing': 'Morning Briefing',
  'country': 'England',
  'region': 'Region',
  'la': 'Local Authority',
  'estate': 'Estate',
  'block': 'Block',
  'unit': 'Unit',
  'tenant': 'Tenant',
  'gas': 'Gas Safety',
  'electrical': 'Electrical',
  'fire': 'Fire Safety',
  'asbestos': 'Asbestos',
  'legionella': 'Water Safety',
  'lifts': 'Lift Safety',
  'awaabs-law': "Awaab's Law",
  'tsm': 'Tenant Satisfaction Measures',
  'core': 'CORE Returns',
  'regulatory': 'Regulatory',
  'ombudsman': 'Ombudsman',
  'performance': 'Performance',
  'financial': 'Financial',
  'stock-condition': 'Stock Condition',
  'insights': 'Insights',
  'predictions': 'Predictions',
  'assistant': 'AI Assistant',
  'organisation': 'Organisation',
  'users': 'Users',
  'teams': 'Teams',
  'workflows': 'Workflows',
  'integrations': 'Integrations',
  'audit': 'Audit',
  'system': 'System',
  'arrears': 'Arrears',
  'accounts': 'Accounts',
  'voids': 'Voids',
  'lettings': 'Lettings',
  'new': 'New',
  'schedule': 'Schedule',
  'templates': 'Templates',
};

export default function Breadcrumbs() {
  const location = useLocation();
  const { state } = useApp();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/');
    const label = routeLabels[seg] || seg;
    return { path, label };
  });

  return (
    <div className="px-6 py-2.5 border-b border-border-subtle bg-surface-dark/60 backdrop-blur-sm" style={{ marginLeft: 0 }}>
      <nav className="flex items-center gap-1.5 text-xs max-w-[1400px] mx-auto">
        <Link to="/dashboard" className="text-text-muted hover:text-brand-teal flex items-center gap-1 transition-colors duration-200">
          <Home size={12} />
          <span className="hidden sm:inline">Home</span>
        </Link>
        {crumbs.map((crumb, i) => (
          <span key={crumb.path} className="flex items-center gap-1.5">
            <ChevronRight size={10} className="text-text-muted/40" />
            {i === crumbs.length - 1 ? (
              <span className="text-text-secondary font-medium">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="text-text-muted hover:text-brand-teal transition-colors duration-200">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </div>
  );
}
