import { Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useTenants, useProperties, useRepairs, useComplaints } from '@/hooks/useApi';
import { asbCases } from '@/data';
import { Search, User, Building2, Wrench, MessageSquareWarning, AlertTriangle } from 'lucide-react';

export default function SearchPage() {
  const { state } = useApp();
  const { data: tenants = [] } = useTenants();
  const { data: properties = [] } = useProperties();
  const { data: repairs = [] } = useRepairs();
  const { data: complaints = [] } = useComplaints();

  const q = state.searchQuery.toLowerCase();

  const matchedTenants = tenants.filter((t: any) =>
    `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
    t.email.toLowerCase().includes(q) ||
    t.phone.includes(q)
  );

  const matchedProperties = properties.filter(p =>
    p.address.toLowerCase().includes(q) ||
    p.uprn.includes(q) ||
    p.postcode.toLowerCase().includes(q)
  );

  const matchedRepairs = repairs.filter(r =>
    r.reference.toLowerCase().includes(q) ||
    r.subject.toLowerCase().includes(q)
  );

  const matchedComplaints = complaints.filter(c =>
    c.reference.toLowerCase().includes(q) ||
    c.subject.toLowerCase().includes(q)
  );

  const matchedAsb = asbCases.filter(a =>
    a.reference.toLowerCase().includes(q) ||
    a.subject.toLowerCase().includes(q)
  );

  const totalResults = matchedTenants.length + matchedProperties.length + matchedRepairs.length + matchedComplaints.length + matchedAsb.length;

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-gradient-brand tracking-tight mb-1">Search Results</h1>
      <p className="text-text-muted mb-6">
        {totalResults} results for "<span className="text-text-primary">{state.searchQuery}</span>"
      </p>

      {matchedTenants.length > 0 && (
        <section className="mb-6 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <h2 className="text-sm uppercase tracking-wider text-brand-teal font-medium mb-3 flex items-center gap-2">
            <User size={14} /> Tenants ({matchedTenants.length})
          </h2>
          <div className="space-y-2">
            {matchedTenants.map(t => (
              <Link
                key={t.id}
                to={`/tenancies/${t.id}`}
                className="block bg-surface-card rounded-xl p-3 border border-border-default hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-text-primary font-medium">{t.title} {t.firstName} {t.lastName}</span>
                    <span className="text-text-muted text-sm ml-3">{properties.find(p => p.id === t.propertyId)?.address}</span>
                  </div>
                  <span className={`text-sm font-mono ${t.rentBalance < 0 ? 'text-status-critical' : 'text-status-compliant'}`}>
                    £{Math.abs(t.rentBalance).toFixed(2)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {matchedProperties.length > 0 && (
        <section className="mb-6 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <h2 className="text-sm uppercase tracking-wider text-brand-teal font-medium mb-3 flex items-center gap-2">
            <Building2 size={14} /> Properties ({matchedProperties.length})
          </h2>
          <div className="space-y-2">
            {matchedProperties.map(p => (
              <Link
                key={p.id}
                to={`/properties/${p.id}`}
                className="block bg-surface-card rounded-lg p-3 border border-border-default hover:bg-surface-hover transition-colors"
              >
                <span className="text-text-primary font-medium">{p.address}</span>
                <span className="text-text-muted text-sm ml-3">{p.postcode} • {p.type} • {p.bedrooms} bed</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {matchedRepairs.length > 0 && (
        <section className="mb-6 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          <h2 className="text-sm uppercase tracking-wider text-brand-teal font-medium mb-3 flex items-center gap-2">
            <Wrench size={14} /> Repairs ({matchedRepairs.length})
          </h2>
          <div className="space-y-2">
            {matchedRepairs.map(r => (
              <Link
                key={r.id}
                to={`/repairs/${r.id}`}
                className="block bg-surface-card rounded-lg p-3 border border-border-default hover:bg-surface-hover transition-colors"
              >
                <span className="font-mono text-brand-teal text-sm">{r.reference}</span>
                <span className="text-text-primary ml-3">{r.subject}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {matchedComplaints.length > 0 && (
        <section className="mb-6 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
          <h2 className="text-sm uppercase tracking-wider text-brand-teal font-medium mb-3 flex items-center gap-2">
            <MessageSquareWarning size={14} /> Complaints ({matchedComplaints.length})
          </h2>
          <div className="space-y-2">
            {matchedComplaints.map(c => (
              <Link
                key={c.id}
                to={`/complaints/${c.id}`}
                className="block bg-surface-card rounded-lg p-3 border border-border-default hover:bg-surface-hover transition-colors"
              >
                <span className="font-mono text-brand-teal text-sm">{c.reference}</span>
                <span className="text-text-primary ml-3">{c.subject}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {totalResults === 0 && (
        <div className="text-center py-16">
          <Search size={48} className="mx-auto text-text-muted mb-4" />
          <p className="text-text-muted text-lg">No results found</p>
          <p className="text-text-muted text-sm mt-1">Try searching for a tenant name, property address, or case reference</p>
        </div>
      )}
    </div>
  );
}
