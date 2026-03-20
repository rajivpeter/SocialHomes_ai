import { ReactNode } from 'react';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { daysUntil, workingDaysUntil } from '@/utils/format';

interface WorkflowStage {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface WorkflowProgressProps {
  stages: WorkflowStage[];
  currentStage: string;
  completedStages?: string[];
  variant?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md';
  slaDeadline?: string;
  isOverdue?: boolean;
}

export default function WorkflowProgress({
  stages,
  currentStage,
  completedStages = [],
  variant = 'horizontal',
  size = 'md',
  slaDeadline,
  isOverdue = false,
}: WorkflowProgressProps) {
  const currentIndex = stages.findIndex(s => s.id === currentStage);

  const getStageState = (stage: WorkflowStage, index: number): 'completed' | 'current' | 'future' => {
    if (completedStages.includes(stage.id)) return 'completed';
    if (stage.id === currentStage) return 'current';
    // If no explicit completedStages provided, infer from position
    if (completedStages.length === 0 && index < currentIndex) return 'completed';
    return 'future';
  };

  const slaCountdown = slaDeadline ? daysUntil(slaDeadline) : null;

  const circleSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 14 : 18;
  const fontSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const numberSize = size === 'sm' ? 'text-xs' : 'text-sm';

  const renderStage = (stage: WorkflowStage, index: number) => {
    const state = getStageState(stage, index);

    const circleClasses = (() => {
      switch (state) {
        case 'completed':
          return 'bg-brand-teal border-brand-teal text-white';
        case 'current':
          return isOverdue
            ? 'bg-status-critical/20 border-status-critical text-status-critical ring-2 ring-status-critical/30 animate-pulse'
            : 'bg-brand-teal/20 border-brand-teal text-brand-teal ring-2 ring-brand-teal/30 animate-pulse';
        case 'future':
        default:
          return 'bg-surface-dark border-border-default text-text-muted';
      }
    })();

    const labelClasses = (() => {
      switch (state) {
        case 'completed':
          return 'text-brand-teal font-medium';
        case 'current':
          return isOverdue ? 'text-status-critical font-semibold' : 'text-brand-teal font-semibold';
        case 'future':
        default:
          return 'text-text-muted';
      }
    })();

    return (
      <div
        key={stage.id}
        className={`flex ${variant === 'horizontal' ? 'flex-col items-center' : 'flex-row items-start gap-3'} relative`}
      >
        {/* Circle */}
        <div className={`${circleSize} rounded-full flex items-center justify-center border-2 ${circleClasses} flex-shrink-0 transition-all duration-300`}>
          {state === 'completed' ? (
            <CheckCircle size={iconSize} />
          ) : state === 'current' && isOverdue ? (
            <AlertTriangle size={iconSize} />
          ) : state === 'current' && stage.icon ? (
            stage.icon
          ) : (
            <span className={`${numberSize} font-bold`}>{index + 1}</span>
          )}
        </div>

        {/* Label + SLA badge */}
        <div className={`${variant === 'horizontal' ? 'mt-2 text-center' : ''}`}>
          <div className={`${fontSize} ${labelClasses} leading-tight ${variant === 'horizontal' ? 'max-w-[80px]' : ''}`}>
            {stage.label}
          </div>

          {/* SLA countdown badge on current stage */}
          {state === 'current' && slaCountdown !== null && (
            <div className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
              slaCountdown <= 0
                ? 'bg-status-critical/20 text-status-critical'
                : slaCountdown <= 2
                ? 'bg-status-warning/20 text-status-warning'
                : 'bg-status-compliant/20 text-status-compliant'
            }`}>
              <Clock size={10} />
              {slaCountdown <= 0
                ? `${Math.abs(slaCountdown)}d overdue`
                : `${slaCountdown}d left`}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderConnector = (index: number) => {
    const stageState = getStageState(stages[index], index);
    const nextState = index + 1 < stages.length ? getStageState(stages[index + 1], index + 1) : 'future';
    const isCompleted = stageState === 'completed' && (nextState === 'completed' || nextState === 'current');

    if (variant === 'horizontal') {
      return (
        <div
          key={`connector-${index}`}
          className={`flex-1 h-0.5 ${size === 'sm' ? 'mx-1' : 'mx-2'} self-center ${
            isCompleted ? 'bg-brand-teal' : 'bg-border-default'
          } transition-colors duration-300`}
          style={{ marginTop: variant === 'horizontal' ? `-${size === 'sm' ? '24' : '28'}px` : undefined }}
        />
      );
    }

    return (
      <div
        key={`connector-${index}`}
        className={`${size === 'sm' ? 'ml-[15px]' : 'ml-[19px]'} w-0.5 h-6 ${
          isCompleted ? 'bg-brand-teal' : 'bg-border-default'
        } transition-colors duration-300`}
      />
    );
  };

  // On mobile, force vertical
  if (variant === 'horizontal') {
    return (
      <>
        {/* Horizontal (desktop) */}
        <div className="hidden md:flex items-start">
          {stages.map((stage, index) => (
            <div key={stage.id} className="flex items-start flex-1">
              {renderStage(stage, index)}
              {index < stages.length - 1 && (
                <div className={`flex-1 h-0.5 ${size === 'sm' ? 'mx-1 mt-4' : 'mx-2 mt-5'} ${
                  getStageState(stage, index) === 'completed'
                    ? 'bg-brand-teal'
                    : 'bg-border-default'
                } transition-colors duration-300`} />
              )}
            </div>
          ))}
        </div>

        {/* Vertical (mobile fallback) */}
        <div className="flex flex-col md:hidden">
          {stages.map((stage, index) => (
            <div key={stage.id}>
              {renderStage({ ...stage }, index)}
              {index < stages.length - 1 && renderConnector(index)}
            </div>
          ))}
        </div>
      </>
    );
  }

  // Vertical layout
  return (
    <div className="flex flex-col">
      {stages.map((stage, index) => (
        <div key={stage.id}>
          {renderStage(stage, index)}
          {index < stages.length - 1 && renderConnector(index)}
        </div>
      ))}
    </div>
  );
}
