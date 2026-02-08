import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { usePersonaScope } from '@/hooks/usePersonaScope';
import { 
  CloudRain, AlertTriangle, AlertCircle, CheckCircle2, 
  TrendingUp, TrendingDown, ArrowRight, Home, Users, 
  Wrench, PoundSterling, Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { organisation, dampMouldCases } from '@/data';
import { formatCurrency } from '@/utils/format';

export default function BriefingPage() {
  const { state } = useApp();
  const navigate = useNavigate();
  const { tasks, kpis, scopedRepairs, scopedTenants, scopedDampCases, persona } = usePersonaScope();
  const userName = state.user.name.split(' ')[0];
  
  const today = new Date();
  const dayName = format(today, 'EEEE');
  const dayNumber = format(today, 'd');
  const monthName = format(today, 'MMMM');
  const year = format(today, 'yyyy');

  // Persona-specific greeting context
  const personaGreeting: Record<string, { subtitle: string; focus: string }> = {
    'coo': { subtitle: 'Organisation-wide overview', focus: 'Strategic performance across all regions and service areas' },
    'head-of-service': { subtitle: 'Service area performance', focus: 'Housing management across all teams and patches' },
    'manager': { subtitle: 'Team caseload summary', focus: 'Southwark & Lewisham Team — 3 officers, 4 patches' },
    'housing-officer': { subtitle: 'Your patch caseload', focus: 'Oak Park & Elm Gardens — 68 tenancies' },
    'operative': { subtitle: "Today's job schedule", focus: `${scopedRepairs.length} assigned repairs — ${scopedRepairs.filter(r => r.priority === 'emergency').length} emergency` },
  };
  const greetingCtx = personaGreeting[persona] || personaGreeting['housing-officer'];
  
  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  const formattedDate = `${dayName} ${getOrdinal(parseInt(dayNumber))} ${monthName} ${year}`;

  // Generate urgent items from actual data
  const urgentItems = [
    ...scopedDampCases
      .filter(d => d.hazardClassification === 'emergency' && d.status !== 'closed')
      .map(d => ({ text: `Emergency damp case ${d.reference} - deadline breached`, sub: d.subject, route: '/compliance/awaabs-law' })),
    ...scopedRepairs
      .filter(r => r.priority === 'emergency' && r.status !== 'completed' && r.daysOpen > 1)
      .slice(0, 2)
      .map(r => ({ text: `${r.reference} - ${r.subject}`, sub: `${r.daysOpen} days open`, route: `/repairs/${r.id}` })),
  ];

  // AI predictions from actual data
  const arrearsRiskCount = scopedTenants.filter(t => t.arrearsRisk > 60).length;
  const dampRiskCount = scopedDampCases.filter(d => d.status !== 'closed').length;

  return (
    <div className="min-h-screen bg-surface-dark flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-teal/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-brand-peach/4 rounded-full blur-[120px]" />
      </div>
      <div className="bg-pattern" />
      
      <div className="max-w-3xl w-full relative z-10">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8" style={{ opacity: 0, transform: 'scale(0)', animation: 'fadeInScale 0.8s ease-out 0.2s forwards' }}>
            <div className="relative">
              <div className="absolute inset-0 bg-brand-teal/15 blur-2xl rounded-full scale-150" />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 751 772" width="64" height="66" className="text-brand-teal relative">
                <path fill="currentColor" d="M745.51,390.8l-95.41-91.94-41.32,42.88,48.94,47.16-250.45,254.19-1.31-194.04,12.47-12.74-.31-.3,143.2-143.64.08.08,42.88-42.58-.29-.29,1-1-41.76-41.63-.79.79L377.89,21.94l-1.41,1.4-.43-.44L10.05,385.9l.67.67-2.57,2.54,325.25,328.97-.16.16,12.35,12.17,30.65,31,.41-.4,2.02,1.99,324.99-329.84.55.53,41.32-42.88ZM345.09,452.5l1.28,189.95-251.12-253.99,92.74-91.98,144.76,141.66-1.03,1.03,13.37,13.33ZM375.98,394.78l-144.51-141.42,146.65-145.45,141.65,142.63-143.79,144.23Z"/>
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-heading font-bold text-text-primary mb-3 opacity-0 animate-slide-in-left tracking-tight" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
            Good morning, <span className="text-gradient-teal">{userName}</span>
          </h1>
          <p className="text-lg text-text-muted opacity-0 animate-slide-in-left" style={{ animationDelay: '1.1s', animationFillMode: 'forwards' }}>{formattedDate}</p>
          <p className="text-sm text-text-muted opacity-0 animate-slide-in-left mt-1" style={{ animationDelay: '1.2s', animationFillMode: 'forwards' }}>
            <span data-testid="persona-role">{state.user.role}</span> — <span data-testid="persona-scope">{kpis.scopeLabel}</span>
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-teal/10 border border-brand-teal/20 opacity-0 animate-slide-in-left" style={{ animationDelay: '1.3s', animationFillMode: 'forwards' }}>
            <div className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
            <span data-testid="persona-greeting" className="text-xs text-brand-teal font-medium">{greetingCtx.subtitle}</span>
          </div>
        </div>

        {/* Persona Focus Banner */}
        <div className="bg-surface-card/60 backdrop-blur-sm rounded-xl p-4 mb-4 border border-brand-teal/15 opacity-0 animate-fade-in-up" style={{ animationDelay: '1.35s', animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-3">
            <Sparkles size={18} className="text-brand-teal" />
            <p data-testid="persona-focus" className="text-sm text-text-secondary">
              <span className="text-text-primary font-medium">{state.user.name}</span> — {greetingCtx.focus}
            </p>
          </div>
        </div>

        {/* Weather */}
        <div className="bg-surface-card/80 backdrop-blur-sm rounded-xl p-5 mb-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '1.4s', animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-teal/10"><CloudRain size={22} className="text-brand-teal" /></div>
            <p className="text-text-primary font-medium">Heavy rain expected Thursday. {dampRiskCount} properties at elevated damp risk.</p>
          </div>
        </div>

        {/* URGENT */}
        {urgentItems.length > 0 && (
          <div className="mb-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '1.6s', animationFillMode: 'forwards' }}>
            <h2 className="text-lg font-heading font-bold text-status-critical mb-3 flex items-center gap-2"><AlertTriangle size={18} /> URGENT</h2>
            <div className="space-y-3">
              {urgentItems.map((item, idx) => (
                <div key={idx} className="bg-surface-card/80 backdrop-blur-sm rounded-xl p-5 border border-status-critical/30 relative overflow-hidden cursor-pointer hover:bg-surface-hover/50 transition-colors" onClick={() => navigate(item.route)}>
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-status-critical to-status-critical/40" />
                  <div className="flex items-start gap-3 pl-2">
                    <AlertCircle size={20} className="text-status-critical shrink-0 mt-0.5" />
                    <div>
                      <p className="text-text-primary font-medium mb-1">{item.text}</p>
                      <p className="text-text-muted text-sm">{item.sub}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TODAY'S TASKS - generated from persona scope */}
        <div className="mb-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '1.8s', animationFillMode: 'forwards' }}>
          <h2 className="text-lg font-heading font-bold text-text-primary mb-3 flex items-center gap-2"><CheckCircle2 size={18} className="text-brand-teal" /> TODAY'S TASKS</h2>
          <div className="bg-surface-card/80 backdrop-blur-sm rounded-xl p-5 border border-border-default">
            <p className="text-text-muted mb-4">
              You have <span className="text-text-primary font-semibold">{tasks.length} tasks</span> due today,{' '}
              <span className="text-text-primary font-semibold">3 appointments</span>,{' '}
              <span className="text-status-critical font-semibold">{scopedRepairs.filter(r => r.slaStatus === 'breached').length} overdue cases</span>.
            </p>
            <div className="space-y-2">
              {tasks.map((task, idx) => (
                <div key={task.id} className="flex items-start gap-3 py-2.5 border-b border-border-default last:border-0 opacity-0 animate-fade-in-up cursor-pointer hover:bg-surface-hover/30 rounded-lg px-2 -mx-2 transition-colors" style={{ animationDelay: `${1.9 + idx * 0.1}s`, animationFillMode: 'forwards' }} onClick={() => navigate(task.route)}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${task.urgent ? 'bg-status-critical shadow-sm shadow-status-critical/50' : 'bg-brand-teal/60'}`} />
                  <span className="text-text-secondary text-sm">{task.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI PREDICTIONS */}
        <div className="mb-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '2.4s', animationFillMode: 'forwards' }}>
          <h2 className="text-lg font-heading font-bold text-status-ai mb-3 flex items-center gap-2"><Sparkles size={18} /> AI PREDICTIONS</h2>
          <div className="bg-surface-card/80 backdrop-blur-sm rounded-xl p-5 border border-status-ai/20 relative overflow-hidden cursor-pointer hover:bg-surface-hover/30 transition-colors" onClick={() => navigate('/ai/predictions')}>
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-status-ai/60 to-transparent" />
            <div className="space-y-3">
              <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-status-warning" /><p className="text-text-muted"><span className="text-text-primary font-semibold">{arrearsRiskCount} tenancies</span> predicted to enter arrears (30 days)</p></div>
              <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-status-critical" /><p className="text-text-muted"><span className="text-text-primary font-semibold">72%</span> complaint probability for Mrs Chen</p></div>
              <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-brand-teal" /><p className="text-text-muted"><span className="text-text-primary font-semibold">{dampRiskCount} properties</span> at damp risk from weather</p></div>
            </div>
          </div>
        </div>

        {/* PATCH SNAPSHOT */}
        <div className="mb-10 opacity-0 animate-fade-in-up" style={{ animationDelay: '2.6s', animationFillMode: 'forwards' }}>
          <h2 className="text-lg font-heading font-bold text-text-primary mb-3 tracking-wide">PATCH SNAPSHOT</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-card/80 backdrop-blur-sm rounded-xl p-4 border border-border-default card-hover cursor-pointer" onClick={() => navigate('/properties')}>
              <div className="flex items-center justify-between mb-2"><span className="text-text-muted text-[10px] uppercase tracking-wider font-semibold">Properties</span><div className="p-1.5 rounded-lg bg-brand-teal/10"><Home size={14} className="text-brand-teal" /></div></div>
              <div className="flex items-baseline gap-2"><span className="text-2xl font-bold font-heading text-text-primary">{kpis.totalUnits}</span><div className="flex items-center gap-1 text-xs text-status-compliant font-medium"><TrendingUp size={12} /><span>+2</span></div></div>
            </div>
            <div className="bg-surface-card/80 backdrop-blur-sm rounded-xl p-4 border border-border-default card-hover cursor-pointer" onClick={() => navigate('/tenancies')}>
              <div className="flex items-center justify-between mb-2"><span className="text-text-muted text-[10px] uppercase tracking-wider font-semibold">Tenancies</span><div className="p-1.5 rounded-lg bg-brand-teal/10"><Users size={14} className="text-brand-teal" /></div></div>
              <div className="flex items-baseline gap-2"><span className="text-2xl font-bold font-heading text-text-primary">{kpis.totalTenancies}</span><div className="flex items-center gap-1 text-xs text-status-compliant font-medium"><TrendingUp size={12} /><span>+1</span></div></div>
            </div>
            <div className="bg-surface-card/80 backdrop-blur-sm rounded-xl p-4 border border-border-default card-hover cursor-pointer" onClick={() => navigate('/repairs')}>
              <div className="flex items-center justify-between mb-2"><span className="text-text-muted text-[10px] uppercase tracking-wider font-semibold">Open repairs</span><div className="p-1.5 rounded-lg bg-brand-teal/10"><Wrench size={14} className="text-brand-teal" /></div></div>
              <div className="flex items-baseline gap-2"><span className="text-2xl font-bold font-heading text-text-primary">{kpis.activeRepairs}</span><div className="flex items-center gap-1 text-xs text-status-critical font-medium"><TrendingDown size={12} /><span>-3</span></div></div>
            </div>
            <div className="bg-surface-card/80 backdrop-blur-sm rounded-xl p-4 border border-border-default card-hover cursor-pointer" onClick={() => navigate('/rent')}>
              <div className="flex items-center justify-between mb-2"><span className="text-text-muted text-[10px] uppercase tracking-wider font-semibold">Arrears</span><div className="p-1.5 rounded-lg bg-brand-teal/10"><PoundSterling size={14} className="text-brand-teal" /></div></div>
              <div className="flex items-baseline gap-2"><span className="text-2xl font-bold font-heading text-text-primary">{formatCurrency(kpis.totalArrears)}</span><div className="flex items-center gap-1 text-xs text-status-warning font-medium"><TrendingUp size={12} /><span>+£120</span></div></div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="text-center space-y-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '2.8s', animationFillMode: 'forwards' }}>
          <Link to="/dashboard" className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-teal to-brand-deep text-white px-10 py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-brand-teal/20 transition-all duration-300 hover:scale-[1.02]">
            Start my day <ArrowRight size={20} />
          </Link>
          <div><Link to="/dashboard" className="text-text-muted hover:text-text-secondary text-sm transition-colors duration-200">Skip briefing</Link></div>
        </div>
      </div>
      <style>{`@keyframes fadeInScale { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}
