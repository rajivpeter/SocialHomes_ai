import { useMemo } from 'react';
import { Mail, Phone, MessageSquare, FileText, Globe, AlertCircle, CheckCircle, Clock } from 'lucide-react';
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
                    className={`border-b border-border-default hover:bg-surface-elevated transition-colors opacity-0 animate-fade-in-up ${
                      comm.status === 'new' ? 'bg-surface-elevated/50' : ''
                    }`}
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
      </div>
    </div>
  );
}
