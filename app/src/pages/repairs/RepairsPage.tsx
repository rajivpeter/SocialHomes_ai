import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, List, LayoutGrid } from 'lucide-react';
import { useRepairs, useProperties } from '@/hooks/useApi';
import StatusPill from '@/components/shared/StatusPill';
import { formatDate } from '@/utils/format';

export default function RepairsPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const { data: repairs = [] } = useRepairs();
  const { data: properties = [] } = useProperties();

  const filteredRepairs = useMemo(() => {
    return repairs.filter((repair: any) => {
      const property = properties.find((p: any) => p.id === repair.propertyId);
      const matchesSearch = !searchQuery || 
        repair.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repair.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repair.sorCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property?.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || repair.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || repair.priority === filterPriority;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [searchQuery, filterStatus, filterPriority]);

  const stats = useMemo(() => {
    const total = repairs.length;
    const emergency = repairs.filter(r => r.priority === 'emergency').length;
    const urgent = repairs.filter(r => r.priority === 'urgent').length;
    const routine = repairs.filter(r => r.priority === 'routine').length;
    const planned = repairs.filter(r => r.priority === 'planned').length;
    return { total, emergency, urgent, routine, planned };
  }, []);

  const getPriorityBorderColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'border-l-status-critical';
      case 'urgent': return 'border-l-status-warning';
      case 'routine': return 'border-l-brand-blue';
      case 'planned': return 'border-l-status-compliant';
      default: return 'border-l-border-default';
    }
  };

  const kanbanColumns = [
    { id: 'open', label: 'Open', status: 'open' },
    { id: 'in-progress', label: 'In Progress', status: 'in-progress' },
    { id: 'awaiting-parts', label: 'Awaiting Parts', status: 'awaiting-parts' },
    { id: 'completed', label: 'Completed', status: 'completed' },
  ];

  const getKanbanRepairs = (status: string) => {
    return filteredRepairs.filter(r => r.status === status);
  };

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight">Repairs</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-brand-teal text-white'
                    : 'bg-surface-card text-text-muted hover:bg-surface-hover'
                }`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-brand-teal text-white'
                    : 'bg-surface-card text-text-muted hover:bg-surface-hover'
                }`}
              >
                <LayoutGrid size={18} />
              </button>
            </div>
          </div>
          <p className="text-text-muted">Manage all repair requests and work orders</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
          <div className="bg-surface-card rounded-xl p-5 border border-border-default relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-teal to-brand-teal/40" />
            <div className="text-2xl font-bold text-text-primary font-heading">{stats.total}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1 font-semibold">Total</div>
          </div>
          <div className="bg-surface-card rounded-xl p-5 border border-border-default relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-status-critical to-status-critical/40" />
            <div className="text-2xl font-bold text-status-critical font-heading">{stats.emergency}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1 font-semibold">Emergency</div>
          </div>
          <div className="bg-surface-card rounded-xl p-5 border border-border-default relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-status-warning to-status-warning/40" />
            <div className="text-2xl font-bold text-status-warning font-heading">{stats.urgent}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1 font-semibold">Urgent</div>
          </div>
          <div className="bg-surface-card rounded-xl p-5 border border-border-default relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-blue to-brand-blue/40" />
            <div className="text-2xl font-bold text-brand-blue font-heading">{stats.routine}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1 font-semibold">Routine</div>
          </div>
          <div className="bg-surface-card rounded-xl p-5 border border-border-default relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-status-compliant to-status-compliant/40" />
            <div className="text-2xl font-bold text-status-compliant font-heading">{stats.planned}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1 font-semibold">Planned</div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-surface-card rounded-lg p-4 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search repairs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="awaiting-parts">Awaiting Parts</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="relative">
              <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-dark border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="emergency">Emergency</option>
                <option value="urgent">Urgent</option>
                <option value="routine">Routine</option>
                <option value="planned">Planned</option>
              </select>
            </div>
          </div>
        </div>

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-surface-card rounded-lg border border-border-default overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-elevated border-b border-border-default">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">SOR</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Operative</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Target Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Days Elapsed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {filteredRepairs.map((repair, index) => {
                    const property = properties.find(p => p.id === repair.propertyId);
                    const staggerDelay = 200 + (index * 50);
                    
                    return (
                      <tr
                        key={repair.id}
                        onClick={() => navigate('/repairs/' + repair.id)}
                        className={`opacity-0 animate-fade-in-up hover:bg-surface-hover transition-colors cursor-pointer ${getPriorityBorderColor(repair.priority)} border-l-4`}
                        style={{ animationDelay: `${staggerDelay}ms`, animationFillMode: 'forwards' }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link to={`/repairs/${repair.id}`} className="text-sm font-medium text-text-primary hover:text-brand-teal transition-colors">
                            {repair.reference}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                          {formatDate(repair.createdDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                          {property?.address || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                          {repair.sorCode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-xs px-2 py-1 rounded capitalize ${
                            repair.priority === 'emergency' ? 'bg-status-critical/20 text-status-critical' :
                            repair.priority === 'urgent' ? 'bg-status-warning/20 text-status-warning' :
                            repair.priority === 'routine' ? 'bg-brand-blue/20 text-brand-blue' :
                            'bg-status-compliant/20 text-status-compliant'
                          }`}>
                            {repair.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusPill status={repair.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                          {repair.operative || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                          {repair.targetDate ? formatDate(repair.targetDate) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            repair.daysOpen > 30 ? 'text-status-critical' :
                            repair.daysOpen > 14 ? 'text-status-warning' :
                            'text-text-secondary'
                          }`}>
                            {repair.daysOpen}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredRepairs.length === 0 && (
              <div className="p-12 text-center text-text-muted">
                No repairs found matching your search criteria.
              </div>
            )}
          </div>
        )}

        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            {kanbanColumns.map((column, colIndex) => {
              const columnRepairs = getKanbanRepairs(column.status);
              
              return (
                <div key={column.id} className="bg-surface-card rounded-lg border border-border-default p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-text-primary uppercase tracking-wider">{column.label}</h3>
                    <span className="text-xs text-text-muted bg-surface-dark px-2 py-1 rounded">{columnRepairs.length}</span>
                  </div>
                  <div className="space-y-3">
                    {columnRepairs.map((repair, index) => {
                      const property = properties.find(p => p.id === repair.propertyId);
                      const staggerDelay = 200 + (colIndex * 100) + (index * 50);
                      
                      return (
                        <Link
                          key={repair.id}
                          to={`/repairs/${repair.id}`}
                          className={`block bg-surface-elevated rounded-lg p-3 border-l-4 ${getPriorityBorderColor(repair.priority)} hover:bg-surface-hover transition-colors opacity-0 animate-fade-in-up`}
                          style={{ animationDelay: `${staggerDelay}ms`, animationFillMode: 'forwards' }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-xs font-medium text-text-primary">{repair.reference}</span>
                            <StatusPill status={repair.status} size="sm" />
                          </div>
                          <div className="text-sm text-text-secondary mb-1 line-clamp-2">{repair.subject}</div>
                          <div className="text-xs text-text-muted mt-2">
                            {property?.address ? property.address.split(',')[0] : 'N/A'}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                              repair.priority === 'emergency' ? 'bg-status-critical/20 text-status-critical' :
                              repair.priority === 'urgent' ? 'bg-status-warning/20 text-status-warning' :
                              repair.priority === 'routine' ? 'bg-brand-blue/20 text-brand-blue' :
                              'bg-status-compliant/20 text-status-compliant'
                            }`}>
                              {repair.priority}
                            </span>
                            <span className="text-xs text-text-muted">{repair.daysOpen}d</span>
                          </div>
                        </Link>
                      );
                    })}
                    {columnRepairs.length === 0 && (
                      <div className="text-xs text-text-muted text-center py-8">No repairs</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
