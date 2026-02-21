import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProperties, useTenants, useCases } from '@/hooks/useApi';
import AiActionCard from '@/components/shared/AiActionCard';
import StatusPill from '@/components/shared/StatusPill';
import DampIntelligencePanel from '@/components/shared/DampIntelligencePanel';
import { formatCurrency, formatDate, safeText } from '@/utils/format';
import { usePropertyIntelligence } from '@/hooks/useEntityIntelligence';
import {
  Home,
  MapPin,
  Building2,
  Users,
  Shield,
  FileText,
  Wrench,
  Droplets,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  Gauge,
  Eye,
  ClipboardList
} from 'lucide-react';
import PropertyMap from '@/components/shared/PropertyMap';

export default function PropertyDetailPage() {
  console.log('[BUILD-MARKER-2026-02-21] PropertyDetailPage loaded - hooks fix applied');
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'compliance' | 'stock-condition' | 'damp-mould' | 'works-history' | 'documents'>('overview');

  const { data: properties = [] } = useProperties();
  const { data: tenants = [] } = useTenants();
  const { data: allCases = [] } = useCases();

  const property = properties.find((p: any) => p.id === id || p.uprn === id);
  const tenant = property?.currentTenancyId ? tenants.find((t: any) => t.id === property.currentTenancyId) : null;
  const propertyCases = property ? allCases.filter((c: any) => c.propertyId === property.id) : [];
  const dampCases = propertyCases.filter(c => c.type === 'damp-mould' && c.status !== 'closed');

  // Hook must be called before any conditional return (Rules of Hooks)
  const intel = usePropertyIntelligence(property);

  if (!property) {
    return (
      <div className="space-y-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-surface-card rounded-lg p-8 border border-border-default text-center">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Property Not Found</h1>
            <p className="text-text-muted mb-4">The property you're looking for doesn't exist.</p>
            <Link to="/properties" className="text-brand-teal hover:underline">
              ← Back to Properties
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getDampRiskColor = (score: number) => {
    if (score < 30) return 'text-status-compliant';
    if (score < 60) return 'text-status-warning';
    return 'text-status-critical';
  };

  const getDampRiskBgColor = (score: number) => {
    if (score < 30) return 'bg-status-compliant/20 border-status-compliant/30';
    if (score < 60) return 'bg-status-warning/20 border-status-warning/30';
    return 'bg-status-critical/20 border-status-critical/30';
  };

  const generateAiActions = () => {
    const actions = [];
    
    if (property.dampRisk > 70) {
      actions.push({
        icon: '🌧️',
        label: 'Proactive Damp Check',
        description: 'High AI risk score suggests proactive inspection recommended',
        preview: `Property ${property.address} has a damp risk score of ${property.dampRisk}%. A proactive inspection is recommended to prevent issues.`
      });
    }

    if (property.compliance.overall === 'expiring' || property.compliance.overall === 'non-compliant') {
      actions.push({
        icon: '⚠️',
        label: 'Compliance Alert',
        description: 'Compliance certificates require attention',
        preview: `Compliance status: ${property.compliance.overall}. Action required to maintain compliance.`
      });
    }

    if (property.epc.rating === 'E' || property.epc.rating === 'F') {
      actions.push({
        icon: '💡',
        label: 'Energy Efficiency Improvement',
        description: 'Low EPC rating - improvement opportunities identified',
        preview: `EPC rating ${property.epc.rating} (SAP ${property.epc.sapScore}). Energy efficiency improvements could reduce costs and improve tenant comfort.`
      });
    }

    return actions;
  };

  const aiActions = generateAiActions();

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight mb-1">{property.address}</h1>
              <div className="flex items-center gap-4 text-sm text-text-muted">
                <span className="font-mono">UPRN: {property.uprn}</span>
                <span className="flex items-center gap-1">
                  <Building2 size={14} />
                  {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
                </span>
                <span>{property.bedrooms} bedroom{property.bedrooms !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <StatusPill status={property.isVoid ? 'void' : 'occupied'} size="md" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          {(['overview', 'compliance', 'stock-condition', 'damp-mould', 'works-history', 'documents'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 capitalize ${
                activeTab === tab
                  ? 'border-brand-teal text-brand-teal'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            {/* Location Map */}
            <div className="bg-surface-card rounded-lg border border-border-default p-6">
              <h2 className="text-xl font-bold font-heading text-brand-peach mb-4">Location</h2>
              <PropertyMap
                lat={property.lat}
                lng={property.lng}
                address={property.address}
                postcode={property.postcode}
                height="300px"
              />
              {property.isVoid && (
                <div className="flex gap-3 mt-4">
                  <Link
                    to={`/properties/${property.id}/book-viewing`}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors text-sm font-medium"
                  >
                    <Eye size={16} />
                    Book a Viewing
                  </Link>
                  <Link
                    to={`/properties/${property.id}/apply`}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-peach text-white rounded-lg hover:bg-brand-peach/90 transition-colors text-sm font-medium"
                  >
                    <ClipboardList size={16} />
                    Apply for this Property
                  </Link>
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-surface-card rounded-lg border border-border-default p-6">
                <h2 className="text-xl font-bold font-heading text-brand-peach mb-4">Property Details</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-text-muted mt-0.5" />
                    <div>
                      <div className="text-xs text-text-muted uppercase tracking-wider">Address</div>
                      <div className="text-sm text-text-primary">{property.address}</div>
                      <div className="text-sm text-text-secondary">{property.postcode}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Home size={18} className="text-text-muted mt-0.5" />
                    <div>
                      <div className="text-xs text-text-muted uppercase tracking-wider">Heating</div>
                      <div className="text-sm text-text-primary capitalize">{property.heatingType.replace('-', ' ')}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Building2 size={18} className="text-text-muted mt-0.5" />
                    <div>
                      <div className="text-xs text-text-muted uppercase tracking-wider">Tenure</div>
                      <div className="text-sm text-text-primary capitalize">{property.tenureType.replace('-', ' ')}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users size={18} className="text-text-muted mt-0.5" />
                    <div>
                      <div className="text-xs text-text-muted uppercase tracking-wider">Current Tenancy</div>
                      {tenant ? (
                        <div className="text-sm text-text-primary">
                          {tenant.title} {tenant.firstName} {tenant.lastName}
                        </div>
                      ) : (
                        <div className="text-sm text-text-muted">Void</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-surface-card rounded-lg border border-border-default p-6">
                <h2 className="text-xl font-bold font-heading text-brand-peach mb-4">EPC Rating</h2>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`text-6xl font-bold ${
                    property.epc.rating === 'A' || property.epc.rating === 'B' ? 'text-status-compliant' :
                    property.epc.rating === 'C' || property.epc.rating === 'D' ? 'text-status-warning' :
                    'text-status-critical'
                  }`}>
                    {property.epc.rating}
                  </div>
                  <div>
                    <div className="text-sm text-text-muted">SAP Score</div>
                    <div className="text-2xl font-bold text-text-primary">{property.epc.sapScore}</div>
                    <div className="text-xs text-text-muted mt-1">Expires: {safeText(property.epc?.expiryDate)}</div>
                  </div>
                </div>
                <div className="pt-4 border-t border-border-default">
                  <div className="text-xs text-text-muted">Floor Area</div>
                  <div className="text-sm text-text-primary font-medium">{property.floorArea} m²</div>
                </div>
              </div>
            </div>

            {/* Rent & Charges */}
            <div className="bg-surface-card rounded-lg border border-border-default p-6">
              <h2 className="text-xl font-bold font-heading text-brand-peach mb-4">Rent & Charges</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Weekly Rent</div>
                  <div className="text-xl font-bold text-text-primary">{formatCurrency(property.weeklyRent)}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Service Charge</div>
                  <div className="text-xl font-bold text-text-primary">{formatCurrency(property.serviceCharge)}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Weekly</div>
                  <div className="text-xl font-bold text-brand-teal">{formatCurrency(property.weeklyRent + property.serviceCharge)}</div>
                </div>
              </div>
            </div>

            {/* AI Actions */}
            {aiActions.length > 0 && (
              <AiActionCard
                title="AI Recommendations"
                actions={aiActions}
              />
            )}

            {/* AI Warnings */}
            {intel.dynamicWarnings.length > 0 && (
              <div className="bg-status-critical/5 border border-status-critical/20 rounded-lg p-3">
                {intel.dynamicWarnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-status-warning">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {/* AI Dynamic Information Fields */}
            {intel.dynamicFields.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {intel.dynamicFields.map((field, idx) => (
                  <div key={idx} className="border-l-[3px] border-status-ai bg-surface-elevated/50 rounded-lg p-3">
                    <div className="text-[10px] text-status-ai uppercase tracking-wider font-semibold">✦ AI estimate</div>
                    <div className={`text-lg font-bold ${field.severity === 'critical' ? 'text-status-critical' : field.severity === 'warning' ? 'text-status-warning' : 'text-text-primary'}`}>{field.value}</div>
                    <div className="text-xs text-text-muted">{field.label} — {field.source}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gas Safety */}
              <div className="bg-surface-card rounded-lg border border-border-default p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold font-heading text-text-primary">Gas Safety</h3>
                  {property.gasSafety ? (
                    <StatusPill status={property.gasSafety.status} />
                  ) : (
                    <StatusPill status="na" />
                  )}
                </div>
                {property.gasSafety ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Last Inspection</span>
                      <span className="text-text-primary">{safeText(property.gasSafety.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Expires</span>
                      <span className="text-text-primary">{safeText(property.gasSafety.expiryDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Engineer</span>
                      <span className="text-text-primary">{safeText(property.gasSafety.engineer)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-text-muted">Not applicable</div>
                )}
              </div>

              {/* EICR */}
              <div className="bg-surface-card rounded-lg border border-border-default p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold font-heading text-text-primary">Electrical Safety (EICR)</h3>
                  {property.eicr ? (
                    <StatusPill status={property.eicr.status} />
                  ) : (
                    <StatusPill status="na" />
                  )}
                </div>
                {property.eicr ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Last Inspection</span>
                      <span className="text-text-primary">{safeText(property.eicr.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Expires</span>
                      <span className="text-text-primary">{safeText(property.eicr.expiryDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Observations</span>
                      <span className="text-text-primary">{safeText(property.eicr.observations)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-text-muted">Not available</div>
                )}
              </div>

              {/* Smoke & CO Alarms */}
              <div className="bg-surface-card rounded-lg border border-border-default p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold font-heading text-text-primary">Smoke & CO Alarms</h3>
                  {property.smokeAlarms?.compliant && property.coAlarms?.compliant ? (
                    <StatusPill status="valid" />
                  ) : (
                    <StatusPill status="expired" />
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  {property.smokeAlarms && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-text-muted">Smoke Alarms</span>
                        <span className="text-text-primary">{property.smokeAlarms.count} installed</span>
                      </div>
                      <div className="text-xs text-text-muted">Last tested: {safeText(property.smokeAlarms.lastTest)}</div>
                    </div>
                  )}
                  {property.coAlarms && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-text-muted">CO Alarms</span>
                        <span className="text-text-primary">{property.coAlarms.count} installed</span>
                      </div>
                      <div className="text-xs text-text-muted">Last tested: {safeText(property.coAlarms.lastTest)}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Asbestos */}
              <div className="bg-surface-card rounded-lg border border-border-default p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold font-heading text-text-primary">Asbestos</h3>
                  {property.asbestos ? (
                    <StatusPill status={property.asbestos.riskLevel === 'low' ? 'valid' : property.asbestos.riskLevel === 'medium' ? 'expiring' : 'expired'} />
                  ) : (
                    <StatusPill status="na" />
                  )}
                </div>
                {property.asbestos ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-muted">ACMs Identified</span>
                      <span className="text-text-primary">{property.asbestos.acms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Last Survey</span>
                      <span className="text-text-primary">{safeText(property.asbestos.lastSurvey)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Risk Level</span>
                      <span className="text-text-primary capitalize">{property.asbestos.riskLevel}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-text-muted">Not applicable</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'damp-mould' && (
          <div className="space-y-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            {/* AI Predictive Damp Intelligence Panel */}
            <DampIntelligencePanel propertyId={property.id} />

            {/* Active Cases */}
            {dampCases.length > 0 ? (
              <div className="bg-surface-card rounded-lg border border-border-default p-6">
                <h2 className="text-xl font-bold font-heading text-brand-peach mb-4">Active Damp & Mould Cases</h2>
                <div className="space-y-3">
                  {dampCases.map((case_) => (
                    <div key={case_.id} className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-mono text-text-muted">{case_.reference}</span>
                        <StatusPill status={case_.status} />
                      </div>
                      <div className="text-sm text-text-primary font-medium mb-1">{case_.subject}</div>
                      <div className="text-xs text-text-muted">{case_.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-surface-card rounded-lg border border-border-default p-6 text-center">
                <CheckCircle size={48} className="mx-auto mb-3 text-status-compliant opacity-50" />
                <p className="text-sm text-text-muted">No active damp & mould cases</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stock-condition' && (
          <div className="bg-surface-card rounded-lg border border-border-default p-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            <h2 className="text-xl font-bold font-heading text-brand-peach mb-4">Stock Condition</h2>
            {property.stockCondition && property.stockCondition.length > 0 ? (
              <div className="space-y-3">
                {property.stockCondition.map((component: any, index: number) => (
                  <div key={index} className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text-primary">{component.component}</span>
                      <span className="text-xs text-text-muted">Condition: {component.condition}/5</span>
                    </div>
                    <div className="text-xs text-text-muted">
                      {component.type} • Installed {component.installYear} • Remaining life: {component.remainingLife} years
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">Stock condition data not available</p>
            )}
          </div>
        )}

        {activeTab === 'works-history' && (
          <div className="bg-surface-card rounded-lg border border-border-default p-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            <h2 className="text-xl font-bold font-heading text-brand-peach mb-4">Works History</h2>
            <div className="space-y-3">
              {propertyCases.filter(c => c.type === 'repair').map((case_) => (
                <div key={case_.id} className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-mono text-text-muted">{case_.reference}</span>
                    <StatusPill status={case_.status} />
                  </div>
                  <div className="text-sm text-text-primary font-medium mb-1">{case_.subject}</div>
                  <div className="text-xs text-text-muted">{case_.description}</div>
                  <div className="text-xs text-text-muted mt-2">Opened: {safeText(case_.createdDate)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-surface-card rounded-lg border border-border-default p-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            <h2 className="text-xl font-bold font-heading text-brand-peach mb-4">Documents</h2>
            <div className="space-y-3">
              {[
                { name: 'Gas Safety Certificate', type: 'Certificate', date: safeText(property.gasSafety?.date), expires: safeText(property.gasSafety?.expiryDate), status: property.gasSafety?.status || 'na' },
                { name: 'EICR Report', type: 'Certificate', date: safeText(property.eicr?.date), expires: safeText(property.eicr?.expiryDate), status: property.eicr?.status || 'na' },
                { name: 'EPC Certificate', type: 'Certificate', date: 'On file', expires: safeText(property.epc?.expiryDate), status: 'valid' },
                { name: 'Asbestos Survey', type: 'Report', date: safeText(property.asbestos?.lastSurvey), expires: 'N/A', status: property.asbestos ? 'valid' : 'na' },
                { name: 'Fire Risk Assessment', type: 'Report', date: '15/06/2025', expires: '15/06/2026', status: 'valid' },
                { name: 'Property Photos', type: 'Media', date: '01/01/2026', expires: 'N/A', status: 'valid' },
              ].map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between bg-surface-elevated rounded-lg p-4 border border-border-default hover:bg-surface-hover transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-brand-teal" />
                    <div>
                      <div className="text-sm font-medium text-text-primary">{doc.name}</div>
                      <div className="text-xs text-text-muted">{doc.type} — Last updated: {typeof doc.date === 'object' ? String(doc.date) : doc.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-text-muted">Expires: {typeof doc.expires === 'object' ? String(doc.expires) : doc.expires}</div>
                    <StatusPill status={doc.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
