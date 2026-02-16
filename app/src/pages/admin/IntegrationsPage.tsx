import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plug,
  Activity,
  AlertTriangle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Zap,
  Clock,
  Database,
  Loader2,
} from 'lucide-react';
import { adminApi } from '@/services/api-client';

// ---- Types ----

interface Integration {
  id: string;
  name: string;
  description: string;
  tier: 1 | 2 | 3;
  category: string;
  status: 'active' | 'degraded' | 'error' | 'disabled';
  apiUrl: string;
  lastChecked: string;
  avgResponseMs: number;
  cacheHitRate: number;
  enabled: boolean;
}

interface TestResult {
  success: boolean;
  responseMs: number;
  message: string;
}

// ---- Helpers ----

const TIER_META: Record<number, { label: string; bg: string; text: string }> = {
  1: { label: 'Tier 1 — Free', bg: 'bg-status-compliant/20', text: 'text-status-compliant' },
  2: { label: 'Tier 2 — Registered', bg: 'bg-status-warning/20', text: 'text-status-warning' },
  3: { label: 'Tier 3 — Subscription', bg: 'bg-brand-garnet/20', text: 'text-brand-garnet' },
};

const STATUS_DOT: Record<string, string> = {
  active: 'bg-status-compliant',
  degraded: 'bg-status-warning',
  error: 'bg-brand-garnet',
  disabled: 'bg-text-muted',
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '--:--:--';
  }
}

// ---- Component ----

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingIds, setTestingIds] = useState<Set<string>>(new Set());
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

  const fetchIntegrations = useCallback(() => {
    adminApi.integrations().then((data: any[]) => {
      setIntegrations(data as Integration[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  // ---- Actions ----

  const handleToggle = async (id: string) => {
    setTogglingIds(prev => new Set(prev).add(id));
    try {
      const updated = await adminApi.toggleIntegration(id) as Integration;
      setIntegrations(prev => prev.map(i => (i.id === id ? updated : i)));
    } catch {
      // Silently ignore — user can retry
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleTest = async (id: string) => {
    setTestingIds(prev => new Set(prev).add(id));
    try {
      const result = await adminApi.testIntegration(id) as TestResult;
      setTestResults(prev => ({ ...prev, [id]: result }));
      // Refresh the list to get updated status / avgResponseMs
      fetchIntegrations();
    } catch {
      setTestResults(prev => ({ ...prev, [id]: { success: false, responseMs: 0, message: 'Request failed' } }));
    } finally {
      setTestingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // ---- Derived data ----

  const totalCount = integrations.length;
  const activeCount = integrations.filter(i => i.status === 'active').length;
  const errorCount = integrations.filter(i => i.status === 'error' || i.status === 'degraded').length;
  const avgResponse = totalCount > 0
    ? Math.round(integrations.filter(i => i.avgResponseMs > 0).reduce((s, i) => s + i.avgResponseMs, 0) / (integrations.filter(i => i.avgResponseMs > 0).length || 1))
    : 0;

  const tiers = [1, 2, 3] as const;
  const grouped = tiers.map(t => ({
    tier: t,
    items: integrations.filter(i => i.tier === t),
  }));

  // ---- Render ----

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-brand-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb + Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-brand-teal transition-colors mb-4">
            <ArrowLeft size={16} />
            Back to Admin
          </Link>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-status-compliant/20 text-status-compliant">
              <Plug size={24} />
            </div>
            <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight">Integrations</h1>
          </div>
          <p className="text-text-muted">Monitor, test and manage all external service integrations</p>
        </div>

        {/* Summary Bar */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-0 animate-fade-in-up"
          style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}
        >
          <SummaryCard icon={<Database size={20} />} label="Total" value={String(totalCount)} color="brand-teal" />
          <SummaryCard icon={<Activity size={20} />} label="Active" value={String(activeCount)} color="status-compliant" />
          <SummaryCard icon={<AlertTriangle size={20} />} label="Issues" value={String(errorCount)} color={errorCount > 0 ? 'brand-garnet' : 'status-compliant'} />
          <SummaryCard icon={<Zap size={20} />} label="Avg Response" value={`${avgResponse}ms`} color="brand-teal" />
        </div>

        {/* Tier Groups */}
        {grouped.map((group, gi) => (
          <div key={group.tier} className="space-y-4">
            <h2
              className={`text-xl font-bold font-heading ${TIER_META[group.tier].text} opacity-0 animate-fade-in-up`}
              style={{ animationDelay: `${100 + gi * 50}ms`, animationFillMode: 'forwards' }}
            >
              {TIER_META[group.tier].label}
              <span className="ml-2 text-sm font-normal text-text-muted">({group.items.length} integrations)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map((integ, idx) => (
                <IntegrationCard
                  key={integ.id}
                  integration={integ}
                  delay={150 + gi * 50 + idx * 50}
                  testing={testingIds.has(integ.id)}
                  toggling={togglingIds.has(integ.id)}
                  testResult={testResults[integ.id]}
                  onToggle={handleToggle}
                  onTest={handleTest}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Sub-components ----

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-surface-card rounded-lg border border-border-default p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-${color}/20 text-${color}`}>
          {icon}
        </div>
        <div>
          <div className="text-xs text-text-muted uppercase tracking-wider">{label}</div>
          <div className="text-xl font-bold font-heading text-text-primary">{value}</div>
        </div>
      </div>
    </div>
  );
}

interface CardProps {
  integration: Integration;
  delay: number;
  testing: boolean;
  toggling: boolean;
  testResult?: TestResult;
  onToggle: (id: string) => void;
  onTest: (id: string) => void;
}

function IntegrationCard({ integration, delay, testing, toggling, testResult, onToggle, onTest }: CardProps) {
  const tierMeta = TIER_META[integration.tier];

  return (
    <div
      className="bg-surface-card rounded-xl border border-border-default p-5 flex flex-col gap-4 opacity-0 animate-fade-in-up hover:border-brand-teal/50 transition-colors"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Top row: name + status dot */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${STATUS_DOT[integration.status]}`} />
            <h3 className="text-base font-bold font-heading text-text-primary truncate">{integration.name}</h3>
          </div>
          <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{integration.description}</p>
        </div>
        {/* Tier badge */}
        <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md ${tierMeta.bg} ${tierMeta.text}`}>
          T{integration.tier}
        </span>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-text-muted">
          <Clock size={12} />
          <span>{formatTime(integration.lastChecked)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-text-muted">
          <Zap size={12} />
          <span>{integration.avgResponseMs > 0 ? `${integration.avgResponseMs}ms` : '--'}</span>
        </div>
      </div>

      {/* Cache hit rate bar */}
      <div>
        <div className="flex items-center justify-between text-[10px] text-text-muted mb-1">
          <span>Cache hit rate</span>
          <span>{Math.round(integration.cacheHitRate * 100)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-surface-hover overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-teal transition-all duration-500"
            style={{ width: `${Math.round(integration.cacheHitRate * 100)}%` }}
          />
        </div>
      </div>

      {/* Test result flash */}
      {testResult && (
        <div className={`text-xs px-3 py-2 rounded-lg ${testResult.success ? 'bg-status-compliant/10 text-status-compliant' : 'bg-brand-garnet/10 text-brand-garnet'}`}>
          {testResult.success ? 'OK' : 'FAIL'} &mdash; {testResult.responseMs}ms &mdash; {testResult.message}
        </div>
      )}

      {/* Actions row */}
      <div className="flex items-center justify-between pt-1 border-t border-border-default">
        {/* Toggle */}
        <button
          type="button"
          onClick={() => onToggle(integration.id)}
          disabled={toggling}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50"
          title={integration.enabled ? 'Disable integration' : 'Enable integration'}
        >
          {toggling ? (
            <Loader2 size={18} className="animate-spin text-text-muted" />
          ) : integration.enabled ? (
            <ToggleRight size={18} className="text-brand-teal" />
          ) : (
            <ToggleLeft size={18} className="text-text-muted" />
          )}
          <span className={integration.enabled ? 'text-brand-teal' : 'text-text-muted'}>
            {integration.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </button>

        {/* Test button */}
        <button
          type="button"
          onClick={() => onTest(integration.id)}
          disabled={testing || !integration.enabled}
          className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-brand-teal transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {testing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          Test
        </button>
      </div>
    </div>
  );
}
