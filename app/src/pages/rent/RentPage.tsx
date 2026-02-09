import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  PoundSterling, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  Phone,
  Mail,
  FileText,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useTenants, useProperties, useCases } from '@/hooks/useApi';
import { financialCases } from '@/data';
import KpiCard from '@/components/shared/KpiCard';
import { formatCurrency, formatPercent, formatDate } from '@/utils/format';

// Arrears by band data
const arrearsByBand = [
  { name: 'Nil', value: 60, color: '#2EA043' },
  { name: '<£250', value: 20, color: '#EFAC92' },
  { name: '£250-500', value: 10, color: '#BE3358' },
  { name: '£500-1k', value: 5, color: '#BE3358' },
  { name: '>£1k', value: 5, color: '#BE3358' },
];

// Payment method breakdown
const paymentMethods = [
  { name: 'DD', value: 35, color: '#058995' },
  { name: 'UC', value: 30, color: '#5BA4AA' },
  { name: 'SO', value: 15, color: '#EFAC92' },
  { name: 'Card', value: 10, color: '#BE3358' },
  { name: 'Cash', value: 5, color: '#6B7B8D' },
  { name: 'HB', value: 5, color: '#ACC0B5' },
];

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-card border border-border-default rounded-lg p-3 shadow-lg">
        <p className="text-text-muted text-xs mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Get AI recommended action based on arrears risk
const getRecommendedAction = (risk: number, paymentMethod: string, ucStatus?: string) => {
  if (risk >= 80) {
    if (ucStatus === 'claiming' || ucStatus === 'transitioning') {
      return { icon: '📞', text: 'Contact UC helpline' };
    }
    return { icon: '📧', text: 'Send arrears letter' };
  }
  if (risk >= 60) {
    return { icon: '💬', text: 'Phone call reminder' };
  }
  return { icon: '📄', text: 'Monitor payment' };
};

export default function RentPage() {
  const { data: tenants = [] } = useTenants();
  const { data: properties = [] } = useProperties();

  // Calculate KPIs
  const totalArrears = useMemo(() => {
    return tenants.reduce((sum: number, t: any) => sum + Math.abs(Math.min(0, t.rentBalance)), 0);
  }, [tenants]);

  const collectionRate = 95.8;
  const tenantsInArrears = tenants.filter(t => t.rentBalance < 0).length;

  // Get AI-prioritised worklist (sorted by arrearsRisk descending)
  const worklist = useMemo(() => {
    return tenants
      .filter(t => t.rentBalance < 0)
      .map(t => {
        const property = properties.find(p => p.id === t.propertyId);
        return {
          ...t,
          propertyAddress: property?.address || 'Unknown',
        };
      })
      .sort((a, b) => b.arrearsRisk - a.arrearsRisk)
      .slice(0, 18);
    // tenants/properties are module-level constant imports, so deps are stable
  }, [tenants, properties]);

  // Get property address helper
  const getPropertyAddress = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.address || 'Unknown';
  };

  // Format payment method
  const formatPaymentMethod = (method: string) => {
    const map: Record<string, string> = {
      'dd': 'Direct Debit',
      'uc': 'Universal Credit',
      'so': 'Standing Order',
      'card': 'Card Payment',
      'cash': 'Cash',
      'hb': 'Housing Benefit',
    };
    return map[method] || method.toUpperCase();
  };

  // Format UC status
  const formatUCStatus = (status?: string) => {
    if (!status || status === 'none') return 'N/A';
    const map: Record<string, string> = {
      'claiming': 'Claiming',
      'transitioning': 'Transitioning',
      'managed-migration': 'Managed Migration',
    };
    return map[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight mb-1">Rent & Income</h1>
          <p className="text-text-muted">Arrears dashboard and AI-prioritised worklist</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard
            label="Total Arrears"
            value={formatCurrency(totalArrears)}
            trend="down"
            trendValue="-2.3% this month"
            icon={<PoundSterling size={20} />}
            colour="brand-garnet"
            delay={0}
          />
          <KpiCard
            label="Collection Rate"
            value={formatPercent(collectionRate)}
            trend="up"
            trendValue="+0.5% this month"
            icon={<TrendingUp size={20} />}
            colour="brand-teal"
            delay={50}
          />
          <KpiCard
            label="Current Tenants in Arrears"
            value={tenantsInArrears.toString()}
            trend="down"
            trendValue="-3 this month"
            icon={<Users size={20} />}
            colour="brand-peach"
            delay={100}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Arrears by Band */}
          <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            <h2 className="text-xl font-bold font-heading text-brand-peach mb-4">Arrears by Band</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={arrearsByBand}>
                <XAxis 
                  dataKey="name" 
                  stroke="#6B7B8D"
                  tick={{ fill: '#6B7B8D', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#6B7B8D"
                  tick={{ fill: '#6B7B8D', fontSize: 12 }}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#058995" radius={[4, 4, 0, 0]}>
                  {arrearsByBand.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <h2 className="text-xl font-bold font-heading text-brand-peach mb-4">Payment Method Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI-Prioritised Worklist */}
        <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-heading text-brand-peach">AI-Prioritised Worklist</h2>
            <span className="text-sm text-text-muted">Sorted by arrears risk score (highest first)</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Tenant</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Property</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-text-muted">Balance</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Risk Score</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">UC Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Payment Method</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Action</th>
                </tr>
              </thead>
              <tbody>
                {worklist.map((tenant, index) => {
                  const action = getRecommendedAction(tenant.arrearsRisk, tenant.paymentMethod, tenant.ucStatus);
                  const riskColor = tenant.arrearsRisk >= 80 ? '#BE3358' : tenant.arrearsRisk >= 60 ? '#EFAC92' : '#2EA043';
                  
                  return (
                    <tr 
                      key={tenant.id}
                      className="border-b border-border-default hover:bg-surface-elevated transition-colors opacity-0 animate-fade-in-up"
                      style={{ animationDelay: `${300 + index * 30}ms`, animationFillMode: 'forwards' }}
                    >
                      <td className="py-3 px-4">
                        <a href={`/tenancies/${tenant.id}`} className="font-medium text-brand-teal hover:underline">
                          {tenant.title} {tenant.firstName} {tenant.lastName}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-sm text-text-secondary">
                        {tenant.propertyAddress}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-status-critical">
                          {formatCurrency(Math.abs(tenant.rentBalance))}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-surface-elevated rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-full transition-all duration-500"
                              style={{ 
                                width: `${tenant.arrearsRisk}%`,
                                backgroundColor: riskColor
                              }}
                            />
                          </div>
                          <span className="text-xs text-text-muted w-8 text-right">{tenant.arrearsRisk}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-text-secondary">
                        {formatUCStatus(tenant.ucStatus)}
                      </td>
                      <td className="py-3 px-4 text-sm text-text-secondary">
                        {formatPaymentMethod(tenant.paymentMethod)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{action.icon}</span>
                          <span className="text-sm text-text-secondary">{action.text}</span>
                          <a href={`/tenancies/${tenant.id}`} className="ml-2 p-1.5 rounded hover:bg-surface-hover transition-colors inline-block">
                            <ArrowRight size={14} className="text-brand-teal" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
