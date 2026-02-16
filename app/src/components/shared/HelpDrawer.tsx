import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  X, Search, Lightbulb, ArrowRight, BookOpen,
  ChevronDown, ChevronRight, ListChecks, Hash,
  CircleAlert, Info
} from 'lucide-react';
import { getHelpForRoute } from '@/data/help-content';
import type { HelpPage, HelpTopic } from '@/data/help-content';

interface HelpDrawerProps {
  open: boolean;
  onClose: () => void;
}

function TopicSection({ topic, defaultOpen }: { topic: HelpTopic; defaultOpen: boolean }) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} id={`help-topic-${topic.id}`} className="border border-border-default rounded-xl overflow-hidden">
      {/* Topic header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-surface-hover/50 transition-colors"
      >
        <div className="p-1 rounded-md bg-brand-teal/12 shrink-0">
          {topic.icon === 'steps' ? <ListChecks size={14} className="text-brand-teal" /> :
           topic.icon === 'alert' ? <CircleAlert size={14} className="text-brand-teal" /> :
           <Hash size={14} className="text-brand-teal" />}
        </div>
        <span className="flex-1 text-sm font-semibold text-text-primary">{topic.title}</span>
        {expanded
          ? <ChevronDown size={14} className="text-text-muted shrink-0" />
          : <ChevronRight size={14} className="text-text-muted shrink-0" />}
      </button>

      {/* Collapsible body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border-subtle">
          {/* Overview */}
          <p className="text-xs text-text-secondary leading-relaxed pt-3">{topic.content}</p>

          {/* Process steps */}
          {topic.steps && topic.steps.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-teal">Process</span>
              <ol className="space-y-2">
                {topic.steps.map(s => (
                  <li key={s.step} className="flex gap-2.5">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-brand-teal/15 text-brand-teal text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {s.step}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-text-primary">{s.title}</div>
                      <div className="text-[11px] text-text-muted leading-relaxed">{s.description}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Field descriptions */}
          {topic.fields && topic.fields.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-teal">Fields</span>
              <div className="space-y-1">
                {topic.fields.map((f, i) => (
                  <div key={i} className="flex gap-2 py-1 border-b border-border-subtle last:border-0">
                    <span className="text-xs font-medium text-text-primary shrink-0 w-28">{f.name}</span>
                    <span className="text-[11px] text-text-muted leading-relaxed">{f.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status definitions */}
          {topic.statuses && topic.statuses.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-teal">Statuses</span>
              <div className="space-y-1">
                {topic.statuses.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 py-1">
                    <span className={`shrink-0 mt-1 w-2.5 h-2.5 rounded-full ${s.color}`} />
                    <div>
                      <span className="text-xs font-medium text-text-primary">{s.status}</span>
                      <span className="text-[11px] text-text-muted ml-1.5">{s.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subtopics */}
          {topic.subtopics && topic.subtopics.length > 0 && (
            <div className="space-y-2 pt-1">
              {topic.subtopics.map((sub, i) => (
                <div key={i} className="bg-surface-dark/30 rounded-lg p-3">
                  <div className="text-xs font-semibold text-text-primary mb-1">{sub.title}</div>
                  <div className="text-[11px] text-text-muted leading-relaxed">{sub.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HelpDrawer({ open, onClose }: HelpDrawerProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [filterText, setFilterText] = useState('');
  const filterRef = useRef<HTMLInputElement>(null);

  const help: HelpPage | null = getHelpForRoute(location.pathname);

  useEffect(() => {
    if (open && filterRef.current) {
      setTimeout(() => filterRef.current?.focus(), 300);
    }
    setFilterText('');
  }, [open, location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const lowerFilter = filterText.toLowerCase();

  const filteredTopics = help?.topics.filter(
    t =>
      !filterText ||
      t.title.toLowerCase().includes(lowerFilter) ||
      t.content.toLowerCase().includes(lowerFilter) ||
      t.steps?.some(s => s.title.toLowerCase().includes(lowerFilter) || s.description.toLowerCase().includes(lowerFilter)) ||
      t.fields?.some(f => f.name.toLowerCase().includes(lowerFilter) || f.description.toLowerCase().includes(lowerFilter)) ||
      t.subtopics?.some(s => s.title.toLowerCase().includes(lowerFilter) || s.content.toLowerCase().includes(lowerFilter))
  ) ?? [];

  const filteredTips = help?.tips?.filter(
    t => !filterText || t.toLowerCase().includes(lowerFilter)
  ) ?? [];

  const scrollToTopic = (id: string) => {
    const el = document.getElementById(`help-topic-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* LEFT Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-full sm:w-[520px] bg-surface-card/95 backdrop-blur-xl border-r border-white/10 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Right edge glow */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-brand-teal/30 via-brand-teal/5 to-transparent" />

        {/* Header */}
        <div className="p-4 border-b border-border-default relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-teal/8 via-brand-teal/3 to-transparent" />
          <div className="relative flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-brand-teal/15">
                <BookOpen size={18} className="text-brand-teal" />
              </div>
              <div>
                <span className="font-heading font-bold text-text-primary tracking-wide text-base">
                  User Guide
                </span>
                {help && (
                  <span className="text-[10px] text-text-muted ml-2 uppercase tracking-wider">
                    {help.title}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted transition-all"
              aria-label="Close help"
            >
              <X size={16} />
            </button>
          </div>

          {help && (
            <p className="relative text-xs text-text-muted leading-relaxed mb-3">
              {help.description}
            </p>
          )}

          {/* Search */}
          {help && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                ref={filterRef}
                type="text"
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                placeholder="Search topics, processes, fields..."
                className="w-full bg-surface-dark/60 border border-border-default rounded-lg pl-9 pr-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-brand-teal focus:outline-none transition-colors"
              />
            </div>
          )}
        </div>

        {/* Table of Contents — quick jump */}
        {help && filteredTopics.length > 3 && !filterText && (
          <div className="px-4 py-2.5 border-b border-border-subtle bg-surface-dark/20 shrink-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Info size={10} className="text-text-muted" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Contents</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {filteredTopics.map(t => (
                <button
                  key={t.id}
                  onClick={() => scrollToTopic(t.id)}
                  className="text-[10px] text-brand-teal hover:text-brand-teal/80 bg-brand-teal/8 hover:bg-brand-teal/15 px-2 py-0.5 rounded transition-all"
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!help ? (
            <div className="text-center py-16">
              <BookOpen size={36} className="mx-auto text-text-muted mb-3 opacity-40" />
              <h3 className="text-sm font-semibold text-text-primary mb-1">No guide available</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                No help content is available for this page yet.
              </p>
            </div>
          ) : (
            <>
              {/* Topic sections */}
              {filteredTopics.length > 0 ? (
                filteredTopics.map((topic, idx) => (
                  <TopicSection key={topic.id} topic={topic} defaultOpen={idx === 0} />
                ))
              ) : filterText ? (
                <div className="text-center py-8">
                  <p className="text-xs text-text-muted">No topics match "{filterText}"</p>
                </div>
              ) : null}

              {/* Tips */}
              {filteredTips.length > 0 && (
                <div className="bg-brand-teal/5 border border-brand-teal/15 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Lightbulb size={14} className="text-brand-teal" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-teal">
                      Best Practices
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {filteredTips.map((tip, idx) => (
                      <li key={idx} className="text-xs text-text-secondary leading-relaxed flex gap-2">
                        <span className="text-brand-teal mt-0.5 shrink-0">&bull;</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Related Pages footer */}
        {help?.relatedPages && help.relatedPages.length > 0 && (
          <div className="shrink-0 p-4 border-t border-border-default">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted block mb-2">
              Related Guides
            </span>
            <div className="flex flex-wrap gap-1.5">
              {help.relatedPages.map((page, idx) => (
                <button
                  key={idx}
                  onClick={() => { navigate(page.path); }}
                  className="flex items-center gap-1 text-xs text-brand-teal hover:text-brand-teal/80 bg-brand-teal/8 hover:bg-brand-teal/15 px-2.5 py-1 rounded-lg transition-all font-medium"
                >
                  {page.label}
                  <ArrowRight size={10} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
