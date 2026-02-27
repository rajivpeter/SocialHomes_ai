/**
 * 5.3.6: Dark/Light theme toggle
 * Detects system preference, allows manual override via localStorage,
 * smooth 300ms transition animation.
 */

import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

type Theme = 'dark' | 'light' | 'system';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('socialhomes-theme') as Theme) || 'dark';
    } catch {
      return 'dark';
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('socialhomes-theme', theme);
    } catch { /* noop */ }

    const root = document.documentElement;
    const resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : theme;

    // Apply theme class — currently the app is dark-first, light mode will be
    // added with CSS custom property swaps in future.
    root.setAttribute('data-theme', resolved);

    // For now, we add a subtle visual indicator but keep dark mode as primary
    if (resolved === 'light') {
      root.classList.add('theme-light');
    } else {
      root.classList.remove('theme-light');
    }
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => {
      document.documentElement.setAttribute('data-theme', mq.matches ? 'light' : 'dark');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const options: { id: Theme; icon: typeof Sun; label: string }[] = [
    { id: 'dark', icon: Moon, label: 'Dark' },
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'system', icon: Monitor, label: 'System' },
  ];

  const current = options.find(o => o.id === theme) || options[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-secondary transition-all duration-200"
        title={`Theme: ${current.label}`}
        aria-label={`Current theme: ${current.label}`}
      >
        <current.icon size={16} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-10 w-36 glass-card-elevated rounded-xl shadow-2xl animate-slide-in-down z-50 py-1">
            {options.map(opt => (
              <button
                key={opt.id}
                onClick={() => { setTheme(opt.id); setIsOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${
                  theme === opt.id ? 'text-brand-teal bg-brand-teal/5' : 'text-text-secondary hover:bg-surface-hover'
                }`}
              >
                <opt.icon size={13} />
                {opt.label}
                {theme === opt.id && <span className="ml-auto text-[10px] text-brand-teal">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
