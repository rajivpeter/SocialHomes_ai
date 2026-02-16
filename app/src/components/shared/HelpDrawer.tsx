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

  return (
    <div id={`help-topic-${topic.id}`} className="rounded-xl overflow-hidden bg-[#0d1f2d] border border-[#1a3a4a]">
      {/* Topic header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-[#12293a] transition-colors"
      >
        <div className="p-1.5 rounded-md bg-[#0a3d4a] shrink-0">
          {topic.icon === 'steps' ? <ListChecks size={14} className="text-brand-teal" /> :
           topic.icon === 'alert' ? <CircleAlert size={14} className="text-amber-400" /> :
           <Hash size={14} className="text-brand-teal" />}
        </div>
        <span className="flex-1 text-sm font-semibold text-gray-100">{topic.title}</span>
        {expanded
          ? <ChevronDown size={14} className="text-gray-400 shrink-0" />
          : <ChevronRight size={14} className="text-gray-400 shrink-0" />}
      </button>

      {/* Collapsible body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#1a3a4a]">
          {/* Overview */}
          <p className="text-[13px] text-gray-300 leading-relaxed pt-3">{topic.content}</p>

          {/* Process steps */}
          {topic.steps && topic.steps.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-teal">Process</span>
              <ol className="space-y-2.5">
                {topic.steps.map(s => (
                  <li key={s.step} className="flex gap-2.5">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-brand-teal/20 text-brand-teal text-[11px] font-bold flex items-center justify-center mt-0.5">
                      {s.step}
                    </span>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-gray-100">{s.title}</div>
                      <div className="text-[12px] text-gray-400 leading-relaxed">{s.description}</div>
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
              <div className="space-y-0.5">
                {topic.fields.map((f, i) => (
                  <div key={i} className="flex gap-3 py-1.5 border-b border-[#1a3a4a] last:border-0">
                    <span className="text-[12px] font-semibold text-gray-200 shrink-0 w-32">{f.name}</span>
                    <span className="text-[12px] text-gray-400 leading-relaxed">{f.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status definitions */}
          {topic.statuses && topic.statuses.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-teal">Statuses</span>
              <div className="space-y-1.5">
                {topic.statuses.map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5 py-1">
                    <span className={`shrink-0 mt-1.5 w-3 h-3 rounded-full ${s.color}`} />
                    <div>
                      <span className="text-[12px] font-semibold text-gray-200">{s.status}</span>
                      <span className="text-[12px] text-gray-400 ml-2">{s.description}</span>
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
                <div key={i} className="bg-[#091a25] rounded-lg p-3 border border-[#152d3d]">
                  <div className="text-[12px] font-semibold text-gray-200 mb-1">{sub.title}</div>
                  <div className="text-[12px] text-gray-400 leading-relaxed">{sub.content}</div>
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
      {/* Backdrop — solid dark overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={onClose}
        />
      )}

      {/* LEFT Drawer — SOLID opaque background */}
      <div
        className={`fixed top-0 left-0 h-full w-full sm:w-[540px] z-50 flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: '#0a1929' }}
      >
        {/* Right edge accent */}
        <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-brand-teal/50 via-brand-teal/20 to-transparent" />

        {/* Header */}
        <div className="p-5 border-b border-[#1a3a4a] shrink-0" style={{ backgroundColor: '#0c1e30' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-teal/15">
                <BookOpen size={20} className="text-brand-teal" />
              </div>
              <div>
                <h1 className="font-bold text-gray-100 text-lg leading-tight">
                  User Guide
                </h1>
                {help && (
                  <span className="text-[11px] text-brand-teal font-medium uppercase tracking-wider">
                    {help.title}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#1a3a4a] text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Close help"
            >
              <X size={18} />
            </button>
          </div>

          {help && (
            <p className="text-[13px] text-gray-400 leading-relaxed mb-4">
              {help.description}
            </p>
          )}

          {/* Search */}
          {help && (
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                ref={filterRef}
                type="text"
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                placeholder="Search topics, processes, fields..."
                className="w-full bg-[#0d1f2d] border border-[#1a3a4a] rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-brand-teal focus:outline-none transition-colors"
              />
            </div>
          )}
        </div>

        {/* Table of Contents — quick jump */}
        {help && filteredTopics.length > 3 && !filterText && (
          <div className="px-5 py-3 border-b border-[#1a3a4a] shrink-0" style={{ backgroundColor: '#091520' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Info size={11} className="text-gray-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Contents</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {filteredTopics.map(t => (
                <button
                  key={t.id}
                  onClick={() => scrollToTopic(t.id)}
                  className="text-[11px] text-brand-teal hover:text-white bg-[#0a3d4a] hover:bg-[#0d4d5a] px-2.5 py-1 rounded-md transition-colors font-medium"
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {!help ? (
            <div className="text-center py-16">
              <BookOpen size={40} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-base font-semibold text-gray-300 mb-1">No guide available</h3>
              <p className="text-sm text-gray-500">
                No help content is available for this page yet.
              </p>
            </div>
          ) : (
            <>
              {/* Topic sections — first 3 expanded by default */}
              {filteredTopics.length > 0 ? (
                filteredTopics.map((topic, idx) => (
                  <TopicSection key={topic.id} topic={topic} defaultOpen={idx < 3} />
                ))
              ) : filterText ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No topics match "{filterText}"</p>
                </div>
              ) : null}

              {/* Tips */}
              {filteredTips.length > 0 && (
                <div className="bg-[#0a2a1a] border border-[#1a4a3a] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb size={15} className="text-emerald-400" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                      Best Practices
                    </span>
                  </div>
                  <ul className="space-y-2.5">
                    {filteredTips.map((tip, idx) => (
                      <li key={idx} className="text-[13px] text-gray-300 leading-relaxed flex gap-2">
                        <span className="text-emerald-400 mt-0.5 shrink-0">&bull;</span>
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
          <div className="shrink-0 px-5 py-4 border-t border-[#1a3a4a]" style={{ backgroundColor: '#0c1e30' }}>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">
              Related Guides
            </span>
            <div className="flex flex-wrap gap-2">
              {help.relatedPages.map((page, idx) => (
                <button
                  key={idx}
                  onClick={() => { navigate(page.path); }}
                  className="flex items-center gap-1.5 text-[12px] text-brand-teal hover:text-white bg-[#0a3d4a] hover:bg-[#0d4d5a] px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  {page.label}
                  <ArrowRight size={11} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
