import { useMemo } from 'react';
import { Home, Users, Clock, AlertCircle } from 'lucide-react';
import { voidProperties, applicants } from '@/data';
import { useProperties } from '@/hooks/useApi';
import { formatCurrency, formatDate } from '@/utils/format';
import type { VoidStage } from '@/types';

// Void stage labels
const voidStageLabels: Record<VoidStage, string> = {
  'notice': 'Notice',
  'keys': 'Keys',
  'inspection': 'Inspection',
  'works': 'Works',
  'quality': 'Quality',
  'ready': 'Ready',
  'offer': 'Offer',
  'let': 'Let',
};

// Get void days colour
const getVoidDaysColor = (days: number) => {
  if (days < 14) return 'text-status-compliant';
  if (days <= 28) return 'text-status-warning';
  return 'text-status-critical';
};

// Get void days background colour
const getVoidDaysBgColor = (days: number) => {
  if (days < 14) return 'bg-status-compliant/20 border-status-compliant/30';
  if (days <= 28) return 'bg-status-warning/20 border-status-warning/30';
  return 'bg-status-critical/20 border-status-critical/30';
};

// Get applicants by band
const getApplicantsByBand = () => {
  const bands: Record<string, typeof applicants> = { A: [], B: [], C: [], D: [] };
  applicants.forEach(app => {
    if (app.status === 'active') {
      bands[app.band].push(app);
    }
  });
  return bands;
};

export default function AllocationsPage() {
  const { data: properties = [] } = useProperties();

  // Get property addresses for voids
  const voidsWithAddresses = useMemo(() => {
    return voidProperties.map((v: any) => {
      const property = properties.find((p: any) => p.id === v.propertyId);
      return {
        ...v,
        address: property?.address || 'Unknown',
      };
    });
  }, []);

  // Group voids by stage
  const voidsByStage = useMemo(() => {
    const stages: VoidStage[] = ['notice', 'keys', 'inspection', 'works', 'quality', 'ready', 'offer', 'let'];
    const grouped: Record<VoidStage, typeof voidsWithAddresses> = {
      notice: [],
      keys: [],
      inspection: [],
      works: [],
      quality: [],
      ready: [],
      offer: [],
      let: [],
    };
    
    voidsWithAddresses.forEach((vd: any) => {
      grouped[vd.stage as keyof typeof grouped]?.push(vd);
    });
    
    return { stages, grouped };
  }, [voidsWithAddresses]);

  const applicantsByBand = getApplicantsByBand();

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight mb-1">Allocations</h1>
          <p className="text-text-muted">Housing register and void management</p>
        </div>

        {/* Housing Register Section */}
        <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-brand-teal" />
            <h2 className="text-xl font-bold font-heading text-brand-peach">Housing Register</h2>
          </div>

          {/* Band Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {(['A', 'B', 'C', 'D'] as const).map((band, index) => (
              <div
                key={band}
                className="bg-surface-elevated rounded-lg p-4 border border-border-default opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${100 + index * 50}ms`, animationFillMode: 'forwards' }}
              >
                <div className="text-sm text-text-muted mb-1">Band {band}</div>
                <div className="text-2xl font-bold text-brand-peach">{applicantsByBand[band].length}</div>
                <div className="text-xs text-text-muted mt-1">active applicants</div>
              </div>
            ))}
          </div>

          {/* Applicants Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Band</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Bedroom Need</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Medical Priority</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Registration Date</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((applicant, index) => (
                  <tr
                    key={applicant.id}
                    className="border-b border-border-default hover:bg-surface-elevated transition-colors opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${200 + index * 30}ms`, animationFillMode: 'forwards' }}
                  >
                    <td className="py-3 px-4 font-medium text-text-primary">{applicant.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        applicant.band === 'A' ? 'bg-status-critical/20 text-status-critical' :
                        applicant.band === 'B' ? 'bg-status-warning/20 text-status-warning' :
                        applicant.band === 'C' ? 'bg-status-info/20 text-status-info' :
                        'bg-status-void/20 text-status-void'
                      }`}>
                        Band {applicant.band}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary">{applicant.bedroomNeed}</td>
                    <td className="py-3 px-4">
                      {applicant.medicalPriority ? (
                        <span className="flex items-center gap-1 text-status-critical">
                          <AlertCircle size={14} />
                          <span className="text-sm">Yes</span>
                        </span>
                      ) : (
                        <span className="text-sm text-text-muted">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary">{applicant.registrationDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Void Management Section */}
        <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-2 mb-4">
            <Home size={20} className="text-brand-teal" />
            <h2 className="text-xl font-bold font-heading text-brand-peach">Void Management</h2>
          </div>

          {/* Kanban Board */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {voidsByStage.stages.map((stage, stageIndex) => (
                <div
                  key={stage}
                  className="flex-shrink-0 w-72 bg-surface-elevated rounded-lg p-4 border border-border-default opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${350 + stageIndex * 50}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-text-primary">{voidStageLabels[stage]}</h3>
                    <span className="text-xs text-text-muted bg-surface-card px-2 py-1 rounded">
                      {voidsByStage.grouped[stage].length}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {voidsByStage.grouped[stage].map((void_, index) => (
                      <div
                        key={void_.id}
                        className="bg-surface-card rounded-lg p-3 border border-border-default hover:border-brand-teal transition-colors opacity-0 animate-fade-in-up"
                        style={{ animationDelay: `${400 + stageIndex * 50 + index * 30}ms`, animationFillMode: 'forwards' }}
                      >
                        <div className="font-medium text-sm text-text-primary mb-2">{void_.address}</div>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`px-2 py-1 rounded text-xs font-semibold ${getVoidDaysBgColor(void_.daysVoid)} ${getVoidDaysColor(void_.daysVoid)}`}>
                            {void_.daysVoid} days void
                          </div>
                          <div className="text-xs text-text-muted flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(void_.voidDate)}
                          </div>
                        </div>
                        <div className="text-xs text-text-muted">
                          Weekly rent loss: <span className="font-semibold text-status-warning">{formatCurrency(void_.weeklyRentLoss)}</span>
                        </div>
                        {void_.contractor && (
                          <div className="text-xs text-text-muted mt-1">
                            Contractor: {void_.contractor}
                          </div>
                        )}
                        {void_.targetLetDate && (
                          <div className="text-xs text-text-muted mt-1">
                            Target let: {formatDate(void_.targetLetDate)}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {voidsByStage.grouped[stage].length === 0 && (
                      <div className="text-xs text-text-muted text-center py-8">
                        No properties in this stage
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
