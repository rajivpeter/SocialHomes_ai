import { 
  Droplets, 
  AlertTriangle, 
  Thermometer, 
  Gauge,
  Home,
  User
} from 'lucide-react';
import { dampMouldCases } from '@/data';
import { useProperties, useTenants } from '@/hooks/useApi';
import CountdownTimer from '@/components/shared/CountdownTimer';
import StatusPill from '@/components/shared/StatusPill';
import { formatPercent } from '@/utils/format';

export default function AwaabsLawPage() {
  const { data: properties = [] } = useProperties();
  const { data: tenants = [] } = useTenants();

  const activeCases = dampMouldCases.filter(c => c.status !== 'closed');
  const emergencyCases = activeCases.filter(c => c.hazardClassification === 'emergency');
  const significantCases = activeCases.filter(c => c.hazardClassification === 'significant');

  const getTenantName = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? `${tenant.title} ${tenant.firstName} ${tenant.lastName}` : 'Unknown';
  };

  const getPropertyAddress = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.address : 'Unknown';
  };

  const getRiskColour = (score: number) => {
    if (score >= 80) return 'text-status-critical';
    if (score >= 60) return 'text-status-warning';
    return 'text-status-info';
  };

  const getRiskBgColour = (score: number) => {
    if (score >= 80) return 'bg-status-critical/10 border-status-critical/30';
    if (score >= 60) return 'bg-status-warning/10 border-status-warning/30';
    return 'bg-status-info/10 border-status-info/30';
  };

  // AI Risk Register - all properties with damp risk scores
  const propertiesWithRisk = properties
    .filter(p => p.dampRisk > 0)
    .sort((a, b) => b.dampRisk - a.dampRisk)
    .slice(0, 20);

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight mb-1">
            Awaab's Law — Damp & Mould Tracker
          </h1>
          <p className="text-text-muted">Active cases with countdown timers and environmental monitoring</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-card rounded-lg p-4 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <div className="text-sm text-text-muted mb-1">Emergency Cases</div>
            <div className="text-3xl font-bold text-status-critical">{emergencyCases.length}</div>
          </div>
          <div className="bg-surface-card rounded-lg p-4 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            <div className="text-sm text-text-muted mb-1">Significant Cases</div>
            <div className="text-3xl font-bold text-status-warning">{significantCases.length}</div>
          </div>
          <div className="bg-surface-card rounded-lg p-4 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <div className="text-sm text-text-muted mb-1">Total Active</div>
            <div className="text-3xl font-bold text-text-primary">{activeCases.length}</div>
          </div>
        </div>

        {/* Emergency Cases */}
        {emergencyCases.length > 0 && (
          <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
            <h2 className="text-xl font-bold font-heading text-status-critical mb-4 flex items-center gap-2">
              <AlertTriangle size={20} />
              Emergency Cases (24hr deadline for ALL actions)
            </h2>
            <div className="space-y-4">
              {emergencyCases.map((case_, index) => (
                <div
                  key={case_.id}
                  className="bg-surface-card rounded-lg p-6 border-2 border-status-critical/50 opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${300 + index * 50}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <span className="text-xs font-mono text-text-muted">{case_.reference}</span>
                          <h3 className="text-lg font-bold text-text-primary mt-1">{case_.subject}</h3>
                        </div>
                        <StatusPill status="emergency" size="md" pulse />
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-text-muted mb-1">Property</div>
                          <div className="text-sm text-text-primary flex items-center gap-1">
                            <Home size={14} />
                            {getPropertyAddress(case_.propertyId)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-text-muted mb-1">Tenant</div>
                          <div className="text-sm text-text-primary flex items-center gap-1">
                            <User size={14} />
                            {getTenantName(case_.tenantId)}
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="text-xs text-text-muted mb-2">Risk Score</div>
                        <div className={`rounded-lg border p-3 ${getRiskBgColour(case_.dampRiskScore)}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">AI Damp Risk</span>
                            <span className={`text-xl font-bold ${getRiskColour(case_.dampRiskScore)}`}>
                              {case_.dampRiskScore}/100
                            </span>
                          </div>
                        </div>
                      </div>

                      {case_.environmentalData && (
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-surface-elevated rounded p-3 border border-border-default">
                            <div className="flex items-center gap-2 mb-1">
                              <Gauge size={14} className="text-text-muted" />
                              <span className="text-xs text-text-muted">Humidity</span>
                            </div>
                            <div className="text-lg font-bold text-text-primary">{case_.environmentalData.humidity}%</div>
                          </div>
                          <div className="bg-surface-elevated rounded p-3 border border-border-default">
                            <div className="flex items-center gap-2 mb-1">
                              <Thermometer size={14} className="text-text-muted" />
                              <span className="text-xs text-text-muted">Temperature</span>
                            </div>
                            <div className="text-lg font-bold text-text-primary">{case_.environmentalData.temperature}°C</div>
                          </div>
                          <div className="bg-surface-elevated rounded p-3 border border-border-default">
                            <div className="flex items-center gap-2 mb-1">
                              <Droplets size={14} className="text-text-muted" />
                              <span className="text-xs text-text-muted">Moisture</span>
                            </div>
                            <div className="text-lg font-bold text-text-primary">{case_.environmentalData.moisture}%</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs text-text-muted uppercase tracking-wider mb-3">Countdown Timers</div>
                      {case_.awaabsLawTimers?.emergencyDeadline && (
                        <CountdownTimer
                          deadline={case_.awaabsLawTimers.emergencyDeadline}
                          label="Emergency Deadline"
                          size="lg"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Significant Cases */}
        {significantCases.length > 0 && (
          <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: `${350 + emergencyCases.length * 50}ms`, animationFillMode: 'forwards' }}>
            <h2 className="text-xl font-bold font-heading text-status-warning mb-4 flex items-center gap-2">
              <Droplets size={20} />
              Significant Cases
            </h2>
            <div className="space-y-4">
              {significantCases.map((case_, index) => (
                <div
                  key={case_.id}
                  className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${400 + emergencyCases.length * 50 + index * 50}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <span className="text-xs font-mono text-text-muted">{case_.reference}</span>
                          <h3 className="text-lg font-bold text-text-primary mt-1">{case_.subject}</h3>
                        </div>
                        <StatusPill status="significant" size="md" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-text-muted mb-1">Property</div>
                          <div className="text-sm text-text-primary flex items-center gap-1">
                            <Home size={14} />
                            {getPropertyAddress(case_.propertyId)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-text-muted mb-1">Tenant</div>
                          <div className="text-sm text-text-primary flex items-center gap-1">
                            <User size={14} />
                            {getTenantName(case_.tenantId)}
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="text-xs text-text-muted mb-2">Risk Score</div>
                        <div className={`rounded-lg border p-3 ${getRiskBgColour(case_.dampRiskScore)}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">AI Damp Risk</span>
                            <span className={`text-xl font-bold ${getRiskColour(case_.dampRiskScore)}`}>
                              {case_.dampRiskScore}/100
                            </span>
                          </div>
                        </div>
                      </div>

                      {case_.environmentalData && (
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-surface-elevated rounded p-3 border border-border-default">
                            <div className="flex items-center gap-2 mb-1">
                              <Gauge size={14} className="text-text-muted" />
                              <span className="text-xs text-text-muted">Humidity</span>
                            </div>
                            <div className="text-lg font-bold text-text-primary">{case_.environmentalData.humidity}%</div>
                          </div>
                          <div className="bg-surface-elevated rounded p-3 border border-border-default">
                            <div className="flex items-center gap-2 mb-1">
                              <Thermometer size={14} className="text-text-muted" />
                              <span className="text-xs text-text-muted">Temperature</span>
                            </div>
                            <div className="text-lg font-bold text-text-primary">{case_.environmentalData.temperature}°C</div>
                          </div>
                          <div className="bg-surface-elevated rounded p-3 border border-border-default">
                            <div className="flex items-center gap-2 mb-1">
                              <Droplets size={14} className="text-text-muted" />
                              <span className="text-xs text-text-muted">Moisture</span>
                            </div>
                            <div className="text-lg font-bold text-text-primary">{case_.environmentalData.moisture}%</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs text-text-muted uppercase tracking-wider mb-3">Countdown Timers</div>
                      <div className="space-y-2">
                        {case_.awaabsLawTimers?.investigateDeadline && (
                          <CountdownTimer
                            deadline={case_.awaabsLawTimers.investigateDeadline}
                            label="Investigate (10WD)"
                            useWorkingDays
                            size="sm"
                          />
                        )}
                        {case_.awaabsLawTimers?.summaryDeadline && (
                          <CountdownTimer
                            deadline={case_.awaabsLawTimers.summaryDeadline}
                            label="Summary (3WD after investigation)"
                            useWorkingDays
                            size="sm"
                          />
                        )}
                        {case_.awaabsLawTimers?.safetyWorksDeadline && (
                          <CountdownTimer
                            deadline={case_.awaabsLawTimers.safetyWorksDeadline}
                            label="Safety Works (5WD after summary)"
                            useWorkingDays
                            size="sm"
                          />
                        )}
                        {case_.awaabsLawTimers?.fullRepairDeadline && (
                          <CountdownTimer
                            deadline={case_.awaabsLawTimers.fullRepairDeadline}
                            label="Full Repair (12 weeks)"
                            size="sm"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Risk Register */}
        <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: `${500 + activeCases.length * 50}ms`, animationFillMode: 'forwards' }}>
          <h2 className="text-xl font-bold font-heading text-brand-peach mb-4">AI Risk Register</h2>
          <p className="text-sm text-text-muted mb-4">All properties with AI damp risk scores</p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {propertiesWithRisk.map((property, index) => (
              <div
                key={property.id}
                className="bg-surface-elevated rounded-lg p-3 border border-border-default flex items-center justify-between opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${550 + activeCases.length * 50 + index * 20}ms`, animationFillMode: 'forwards' }}
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-text-primary">{property.address}</div>
                  <div className="text-xs text-text-muted">{property.postcode}</div>
                </div>
                <div className={`rounded-lg border px-3 py-1 ${getRiskBgColour(property.dampRisk)}`}>
                  <div className="text-xs text-text-muted mb-0.5">Risk Score</div>
                  <div className={`text-lg font-bold ${getRiskColour(property.dampRisk)}`}>
                    {property.dampRisk}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
