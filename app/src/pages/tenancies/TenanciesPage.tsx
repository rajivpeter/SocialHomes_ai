import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import { useTenants, useProperties } from '@/hooks/useApi';
import StatusPill from '@/components/shared/StatusPill';
import { formatCurrency } from '@/utils/format';

export default function TenanciesPage() {
  const navigate = useNavigate();
  const [searchName, setSearchName] = useState('');
  const [searchPostcode, setSearchPostcode] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: tenants = [] } = useTenants();
  const { data: properties = [] } = useProperties();

  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant: any) => {
      const property = properties.find((p: any) => p.id === tenant.propertyId);
      const fullName = `${tenant.title} ${tenant.firstName} ${tenant.lastName}`.toLowerCase();
      const address = (property?.address || '').toLowerCase();
      const term = searchName.toLowerCase();
      const matchesName = !searchName || fullName.includes(term) || address.includes(term) || tenant.id.includes(term);
      const matchesPostcode = !searchPostcode || (property?.postcode.toLowerCase().includes(searchPostcode.toLowerCase()) ?? false);
      const matchesStatus = filterStatus === 'all' || tenant.tenancyStatus === filterStatus;

      return matchesName && matchesPostcode && matchesStatus;
    });
  }, [tenants, properties, searchName, searchPostcode, filterStatus]);

  const getRentBalanceColor = (balance: number) => {
    if (balance === 0) return 'text-status-compliant';
    if (Math.abs(balance) < 500) return 'text-status-warning';
    return 'text-status-critical';
  };

  const getRiskScoreColor = (score: number) => {
    if (score < 30) return 'bg-status-compliant';
    if (score < 70) return 'bg-status-warning';
    return 'bg-status-critical';
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'dd': 'Direct Debit',
      'uc': 'Universal Credit',
      'so': 'Standing Order',
      'card': 'Card',
      'cash': 'Cash',
      'hb': 'Housing Benefit'
    };
    return labels[method] || method.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <h1 className="text-3xl font-bold font-heading text-gradient-brand mb-1 tracking-tight">Tenancies</h1>
          <p className="text-text-muted text-sm">
            {filteredTenants.length === tenants.length
              ? `${tenants.length} tenancies`
              : `${filteredTenants.length} of ${tenants.length} tenancies`}
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-surface-card rounded-xl p-4 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search by name or address..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                data-testid="search-name"
                className="w-full pl-10 pr-4 py-2 bg-surface-dark border border-border-default rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search by postcode..."
                value={searchPostcode}
                onChange={(e) => setSearchPostcode(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-dark border border-border-default rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-dark border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="notice">Notice</option>
                <option value="former">Former</option>
                <option value="suspended">Suspended</option>
                <option value="evicted">Evicted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface-card rounded-xl border border-border-default overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-elevated/60 border-b border-border-default">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Postcode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Tenure</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Rent Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {filteredTenants.map((tenant, index) => {
                  const property = properties.find(p => p.id === tenant.propertyId);
                  const staggerDelay = 150 + (index * 50);
                  
                  return (
                    <tr
                      key={tenant.id}
                      onClick={() => navigate('/tenancies/' + tenant.id)}
                      className="opacity-0 animate-fade-in-up hover:bg-surface-hover transition-colors cursor-pointer"
                      style={{ animationDelay: `${staggerDelay}ms`, animationFillMode: 'forwards' }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/tenancies/${tenant.id}`} className="text-sm font-medium text-text-primary hover:text-brand-teal transition-colors">
                          {tenant.title} {tenant.firstName} {tenant.lastName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {property?.address || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {property?.postcode || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary capitalize">
                        {tenant.tenancyType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusPill status={tenant.tenancyStatus} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getRentBalanceColor(tenant.rentBalance)}`}>
                          {formatCurrency(Math.abs(tenant.rentBalance))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {getPaymentMethodLabel(tenant.paymentMethod)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-surface-dark rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getRiskScoreColor(tenant.arrearsRisk)} transition-all duration-300`}
                              style={{ width: `${tenant.arrearsRisk}%` }}
                            />
                          </div>
                          <span className="text-xs text-text-muted w-8">{tenant.arrearsRisk}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredTenants.length === 0 && (
            <div className="p-12 text-center text-text-muted">
              No tenancies found matching your search criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
