import { useNavigate } from 'react-router-dom';

interface SwimLaneColumn {
  id: string;
  label: string;
  color: string;
}

interface SwimLaneItem {
  id: string;
  columnId: string;
  title: string;
  subtitle?: string;
  priority?: string;
  daysOpen?: number;
  slaStatus?: string;
  link: string;
}

interface SwimLaneBoardProps {
  columns: SwimLaneColumn[];
  items: SwimLaneItem[];
  onItemClick?: (id: string) => void;
}

export default function SwimLaneBoard({ columns, items, onItemClick }: SwimLaneBoardProps) {
  const navigate = useNavigate();

  const getColumnItems = (columnId: string) => items.filter(item => item.columnId === columnId);

  const getPriorityClasses = (priority?: string) => {
    switch (priority) {
      case 'emergency':
      case 'critical':
        return 'bg-status-critical/20 text-status-critical';
      case 'urgent':
      case 'high':
        return 'bg-status-warning/20 text-status-warning';
      case 'routine':
      case 'medium':
        return 'bg-brand-blue/20 text-brand-blue';
      case 'planned':
      case 'low':
        return 'bg-status-compliant/20 text-status-compliant';
      default:
        return 'bg-surface-elevated text-text-muted';
    }
  };

  const getSlaIndicator = (slaStatus?: string) => {
    switch (slaStatus) {
      case 'within':
        return { dot: 'bg-status-compliant', label: 'Within SLA' };
      case 'approaching':
        return { dot: 'bg-status-warning', label: 'Approaching SLA' };
      case 'breached':
        return { dot: 'bg-status-critical animate-pulse', label: 'SLA Breached' };
      default:
        return null;
    }
  };

  const handleItemClick = (item: SwimLaneItem) => {
    if (onItemClick) {
      onItemClick(item.id);
    } else {
      navigate(item.link);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column, colIndex) => {
        const columnItems = getColumnItems(column.id);

        return (
          <div
            key={column.id}
            className="bg-surface-card rounded-lg border border-border-default flex flex-col max-h-[600px] opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${colIndex * 80}ms`, animationFillMode: 'forwards' }}
          >
            {/* Column Header */}
            <div className="p-4 border-b border-border-default flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <h3 className="text-sm font-medium text-text-primary uppercase tracking-wider">
                    {column.label}
                  </h3>
                </div>
                <span className="text-xs text-text-muted bg-surface-dark px-2 py-1 rounded-full font-medium">
                  {columnItems.length}
                </span>
              </div>
            </div>

            {/* Column Body — scrollable */}
            <div className="p-3 space-y-3 overflow-y-auto flex-1 min-h-0">
              {columnItems.map((item, index) => {
                const sla = getSlaIndicator(item.slaStatus);
                const staggerDelay = 150 + (colIndex * 80) + (index * 40);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="bg-surface-elevated rounded-lg p-3 border border-border-default hover:bg-surface-hover hover:border-brand-teal/30 transition-all cursor-pointer group opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${staggerDelay}ms`, animationFillMode: 'forwards' }}
                  >
                    {/* Title */}
                    <div className="text-sm font-medium text-text-primary group-hover:text-brand-teal transition-colors mb-1 line-clamp-2">
                      {item.title}
                    </div>

                    {/* Subtitle (e.g. property address) */}
                    {item.subtitle && (
                      <div className="text-xs text-text-muted mb-2 line-clamp-1">
                        {item.subtitle}
                      </div>
                    )}

                    {/* Bottom row: priority, SLA, days open */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        {item.priority && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize font-medium ${getPriorityClasses(item.priority)}`}>
                            {item.priority}
                          </span>
                        )}
                        {sla && (
                          <div className="flex items-center gap-1" title={sla.label}>
                            <div className={`w-2 h-2 rounded-full ${sla.dot}`} />
                            <span className="text-[10px] text-text-muted">{sla.label}</span>
                          </div>
                        )}
                      </div>
                      {item.daysOpen !== undefined && (
                        <span className={`text-[10px] font-medium ${
                          item.daysOpen > 30
                            ? 'text-status-critical'
                            : item.daysOpen > 14
                            ? 'text-status-warning'
                            : 'text-text-muted'
                        }`}>
                          {item.daysOpen}d
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {columnItems.length === 0 && (
                <div className="text-xs text-text-muted text-center py-8">
                  No items
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
