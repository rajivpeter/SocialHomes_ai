import { useMemo, useState } from 'react';
import { Mail, Phone, MessageSquare, FileText, Globe, AlertCircle, CheckCircle, Clock, X, Reply, Forward, Archive, Star } from 'lucide-react';
import { communications } from '@/data';
import { useTenants } from '@/hooks/useApi';
import { formatDate } from '@/utils/format';

// Get channel icon
const getChannelIcon = (channel: string) => {
  switch (channel) {
    case 'email':
      return <Mail size={16} className="text-brand-teal" />;
    case 'phone':
      return <Phone size={16} className="text-brand-blue" />;
    case 'sms':
      return <MessageSquare size={16} className="text-brand-peach" />;
    case 'letter':
      return <FileText size={16} className="text-status-warning" />;
    case 'portal':
      return <Globe size={16} className="text-status-info" />;
    default:
      return <Mail size={16} className="text-text-muted" />;
  }
};

// getTenantName is defined inside the component to access hook data

// Get sentiment dot
const getSentimentDot = (sentiment?: string) => {
  if (!sentiment) return null;
  
  const baseClasses = 'w-2 h-2 rounded-full';
  
  switch (sentiment) {
    case 'positive':
      return <div className={`${baseClasses} bg-status-compliant`} />;
    case 'negative':
      return <div className={`${baseClasses} bg-status-critical`} />;
    case 'urgent':
      return <div className={`${baseClasses} bg-status-critical animate-pulse`} />;
    case 'neutral':
    default:
      return <div className={`${baseClasses} bg-status-void`} />;
  }
};

// Get status icon
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'new':
      return <AlertCircle size={14} className="text-status-info" />;
    case 'read':
      return <CheckCircle size={14} className="text-status-compliant" />;
    case 'actioned':
      return <CheckCircle size={14} className="text-brand-teal" />;
    case 'archived':
      return <Clock size={14} className="text-text-muted" />;
    default:
      return null;
  }
};

export default function CommunicationsPage() {
  const { data: tenants = [] } = useTenants();
  const [selectedComm, setSelectedComm] = useState<any | null>(null);

  const getTenantName = (tenantId?: string) => {
    if (!tenantId) return 'Unknown';
    const tenant = tenants.find((t: any) => t.id === tenantId);
    if (!tenant) return 'Unknown';
    return `${tenant.title} ${tenant.firstName} ${tenant.lastName}`;
  };

  // Sort communications by date (newest first)
  const sortedCommunications = useMemo(() => {
    return [...communications].sort((a, b) => {
      // Parse dates (DD/MM/YYYY format)
      const parseDate = (dateStr: string) => {
        const [day, month, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day);
      };
      
      return parseDate(b.date).getTime() - parseDate(a.date).getTime();
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight mb-1">Communications</h1>
          <p className="text-text-muted">Unified inbox and communication management</p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-surface-card rounded-lg p-4 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
            <div className="text-sm text-text-muted mb-1">Total</div>
            <div className="text-2xl font-bold text-brand-peach">{communications.length}</div>
          </div>
          <div className="bg-surface-card rounded-lg p-4 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <div className="text-sm text-text-muted mb-1">New</div>
            <div className="text-2xl font-bold text-status-info">
              {communications.filter(c => c.status === 'new').length}
            </div>
          </div>
          <div className="bg-surface-card rounded-lg p-4 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            <div className="text-sm text-text-muted mb-1">Actioned</div>
            <div className="text-2xl font-bold text-brand-teal">
              {communications.filter(c => c.status === 'actioned').length}
            </div>
          </div>
          <div className="bg-surface-card rounded-lg p-4 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <div className="text-sm text-text-muted mb-1">Urgent</div>
            <div className="text-2xl font-bold text-status-critical">
              {communications.filter(c => c.sentiment === 'urgent').length}
            </div>
          </div>
        </div>

        {/* Communications List */}
        <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
          <h2 className="text-xl font-bold font-heading text-brand-peach mb-4">Unified Inbox</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Channel</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">From/To</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Subject</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Sentiment</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">AI Category</th>
                </tr>
              </thead>
              <tbody>
                {sortedCommunications.map((comm, index) => (
                  <tr
                    key={comm.id}
                    onClick={() => setSelectedComm(comm)}
                    className={`border-b border-border-default hover:bg-surface-elevated transition-colors opacity-0 animate-fade-in-up cursor-pointer ${
                      comm.status === 'new' ? 'bg-surface-elevated/50' : ''
                    } ${selectedComm?.id === comm.id ? 'bg-brand-teal/5 border-l-2 border-l-brand-teal' : ''}`}
                    style={{ animationDelay: `${300 + index * 30}ms`, animationFillMode: 'forwards' }}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(comm.channel)}
                        <span className="text-xs text-text-muted uppercase">{comm.channel}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-text-primary">
                        {comm.direction === 'inbound' ? 'From' : 'To'}: {getTenantName(comm.tenantId)}
                      </div>
                      {comm.caseRef && (
                        <div className="text-xs text-text-muted font-mono mt-1">{comm.caseRef}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-text-primary">{comm.subject}</div>
                      <div className="text-xs text-text-muted mt-1 line-clamp-1">{comm.content}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary">{formatDate(comm.date)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(comm.status)}
                        <span className={`text-xs capitalize ${
                          comm.status === 'new' ? 'text-status-info' :
                          comm.status === 'actioned' ? 'text-brand-teal' :
                          comm.status === 'read' ? 'text-status-compliant' :
                          'text-text-muted'
                        }`}>
                          {comm.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getSentimentDot(comm.sentiment)}
                        {comm.sentiment && (
                          <span className="text-xs text-text-muted capitalize">{comm.sentiment}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {comm.aiCategory && (
                        <div className="flex flex-col gap-1">
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-status-ai/20 text-status-ai border border-status-ai/30">
                            {comm.aiCategory}
                          </span>
                          {comm.aiPriority && (
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              comm.aiPriority === 'high' ? 'bg-status-critical/20 text-status-critical' :
                              comm.aiPriority === 'medium' ? 'bg-status-warning/20 text-status-warning' :
                              'bg-status-info/20 text-status-info'
                            }`}>
                              {comm.aiPriority} priority
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedComm && (
          <div className="bg-surface-card rounded-lg border border-border-default p-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {getChannelIcon(selectedComm.channel)}
                  <span className="text-xs text-text-muted uppercase font-medium">{selectedComm.channel} &middot; {selectedComm.direction}</span>
                  {selectedComm.aiCategory && (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-status-ai/20 text-status-ai border border-status-ai/30">
                      {selectedComm.aiCategory}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-text-primary">{selectedComm.subject}</h3>
                <div className="text-sm text-text-muted mt-1">
                  {selectedComm.direction === 'inbound' ? 'From' : 'To'}: <span className="text-brand-teal">{getTenantName(selectedComm.tenantId)}</span>
                  {selectedComm.caseRef && <span className="ml-2 font-mono text-xs">({selectedComm.caseRef})</span>}
                  <span className="ml-4">{formatDate(selectedComm.date)}</span>
                </div>
              </div>
              <button onClick={() => setSelectedComm(null)} className="p-2 rounded-lg hover:bg-surface-elevated transition-colors">
                <X size={18} className="text-text-muted" />
              </button>
            </div>

            {/* Sentiment & Priority */}
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border-default">
              {selectedComm.sentiment && (
                <div className="flex items-center gap-2">
                  {getSentimentDot(selectedComm.sentiment)}
                  <span className="text-xs text-text-muted capitalize">Sentiment: {selectedComm.sentiment}</span>
                </div>
              )}
              {selectedComm.aiPriority && (
                <span className={`text-xs px-2 py-0.5 rounded ${
                  selectedComm.aiPriority === 'high' ? 'bg-status-critical/20 text-status-critical' :
                  selectedComm.aiPriority === 'medium' ? 'bg-status-warning/20 text-status-warning' :
                  'bg-status-info/20 text-status-info'
                }`}>
                  {selectedComm.aiPriority} priority
                </span>
              )}
              <span className={`text-xs capitalize ${
                selectedComm.status === 'new' ? 'text-status-info' :
                selectedComm.status === 'actioned' ? 'text-brand-teal' :
                'text-text-muted'
              }`}>
                {selectedComm.status}
              </span>
            </div>

            {/* Full Content */}
            <div className="bg-surface-elevated rounded-lg p-4 border border-border-default mb-4">
              <div className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                {selectedComm.content}
              </div>
            </div>

            {/* AI Summary */}
            {selectedComm.aiCategory && (
              <div className="bg-status-ai/5 border border-status-ai/20 rounded-lg p-4 mb-4">
                <div className="text-[10px] text-status-ai uppercase tracking-wider font-semibold mb-1">AI Analysis</div>
                <div className="text-sm text-text-primary">
                  Categorised as <strong>{selectedComm.aiCategory}</strong>.
                  {selectedComm.sentiment === 'negative' && ' Negative sentiment detected — consider prioritising response.'}
                  {selectedComm.sentiment === 'positive' && ' Positive tenant interaction recorded.'}
                  {selectedComm.aiPriority === 'high' && ' Flagged as high priority for action.'}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-brand-teal/10 text-brand-teal rounded-lg hover:bg-brand-teal/20 transition-colors text-sm font-medium inline-flex items-center gap-2">
                <Reply size={16} /> Reply
              </button>
              <button className="px-4 py-2 bg-surface-elevated text-text-muted rounded-lg hover:bg-surface-hover transition-colors text-sm font-medium border border-border-default inline-flex items-center gap-2">
                <Forward size={16} /> Forward
              </button>
              <button className="px-4 py-2 bg-surface-elevated text-text-muted rounded-lg hover:bg-surface-hover transition-colors text-sm font-medium border border-border-default inline-flex items-center gap-2">
                <Archive size={16} /> Archive
              </button>
              {selectedComm.tenantId && (
                <a href={`/tenancies/${selectedComm.tenantId}`} className="px-4 py-2 bg-surface-elevated text-text-muted rounded-lg hover:bg-surface-hover transition-colors text-sm font-medium border border-border-default inline-flex items-center gap-2 ml-auto">
                  View Tenant →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
