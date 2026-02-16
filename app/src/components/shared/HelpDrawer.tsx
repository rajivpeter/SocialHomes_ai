import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Search, Lightbulb, ArrowRight, BookOpen } from 'lucide-react';
import { getHelpForRoute } from '@/data/help-content';
import type { HelpSection } from '@/data/help-content';

interface HelpDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function HelpDrawer({ open, onClose }: HelpDrawerProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [filterText, setFilterText] = useState('');
  const drawerRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);

  const help: HelpSection | null = getHelpForRoute(location.pathname);

  // Focus the filter input when drawer opens
  useEffect(() => {
    if (open && filterRef.current) {
      setTimeout(() => filterRef.current?.focus(), 300);
    }
    // Clear filter when route changes
    setFilterText('');
  }, [open, location.pathname]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const lowerFilter = filterText.toLowerCase();

  const filteredSections = help?.sections.filter(
    s =>
      !filterText ||
      s.heading.toLowerCase().includes(lowerFilter) ||
      s.content.toLowerCase().includes(lowerFilter)
  ) ?? [];

  const filteredTips = help?.tips?.filter(
    t => !filterText || t.toLowerCase().includes(lowerFilter)
  ) ?? [];

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
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

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-surface-card/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Decorative edge glow */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-brand-teal/30 via-brand-teal/5 to-transparent" />

        {/* Header */}
        <div className="p-4 border-b border-border-default relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-teal/8 via-brand-teal/3 to-transparent" />
          <div className="relative flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-brand-teal/15">
                <BookOpen size={16} className="text-brand-teal" />
              </div>
              <span className="font-heading font-bold text-text-primary tracking-wide">
                Help
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted transition-all"
              aria-label="Close help"
            >
              <X size={14} />
            </button>
          </div>

          {help && (
            <div className="relative">
              <h2 className="text-sm font-semibold text-text-primary">
                {help.title}
              </h2>
              <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                {help.description}
              </p>
            </div>
          )}

          {/* Filter / Search */}
          {help && (
            <div className="relative mt-3">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                ref={filterRef}
                type="text"
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                placeholder="Filter help topics..."
                className="w-full bg-surface-dark/60 border border-border-default rounded-lg pl-9 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-brand-teal focus:outline-none transition-colors"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!help ? (
            <div className="text-center py-12">
              <BookOpen
                size={32}
                className="mx-auto text-text-muted mb-3 opacity-40"
              />
              <h3 className="text-sm font-semibold text-text-primary mb-1">
                No help available
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                There is no specific help content for this page yet.
                <br />
                Try navigating to a different section.
              </p>
            </div>
          ) : (
            <>
              {/* Sections */}
              {filteredSections.length > 0 ? (
                filteredSections.map((section, idx) => (
                  <div
                    key={idx}
                    className="bg-surface-dark/40 border border-border-default rounded-xl p-3.5"
                  >
                    <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal mb-2">
                      {section.heading}
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                ))
              ) : filterText ? (
                <div className="text-center py-8">
                  <p className="text-xs text-text-muted">
                    No sections match "{filterText}"
                  </p>
                </div>
              ) : null}

              {/* Tips */}
              {filteredTips.length > 0 && (
                <div className="bg-brand-teal/5 border border-brand-teal/15 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Lightbulb size={14} className="text-brand-teal" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-teal">
                      Tips
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {filteredTips.map((tip, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-text-secondary leading-relaxed flex gap-2"
                      >
                        <span className="text-brand-teal mt-0.5 shrink-0">
                          &bull;
                        </span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Related Pages */}
        {help?.relatedPages && help.relatedPages.length > 0 && (
          <div className="shrink-0 p-4 border-t border-border-default">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-brand-teal/20 via-transparent to-transparent" />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted block mb-2">
              Related Pages
            </span>
            <div className="flex flex-wrap gap-1.5">
              {help.relatedPages.map((page, idx) => (
                <button
                  key={idx}
                  onClick={() => handleNavigate(page.path)}
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
