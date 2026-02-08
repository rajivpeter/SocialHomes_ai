import { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { usePersonaScope } from '@/hooks/usePersonaScope';
import { X, Pin, Send, Sparkles, AlertCircle, AlertTriangle, Lightbulb, BarChart3, Cloud } from 'lucide-react';
import { aiInsights, tenants, properties, repairs } from '@/data';
import { generateAiChatResponse } from '@/services/ai-drafting';

export default function YantraAssist() {
  const { state, dispatch } = useApp();
  const location = useLocation();
  const { personaInsights, persona, scopedRepairs, scopedTenants, scopedComplaints, scopedDampCases } = usePersonaScope();
  const [pinned, setPinned] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);

  if (!state.yantraAssistOpen) return null;

  // Extract entity ID from URL for context
  const pathParts = location.pathname.split('/');
  const currentPage = pathParts[1] || 'dashboard';
  const entityId = pathParts[2] || null;

  // Generate context-specific content based on current page
  const getContextContent = () => {
    // Entity-specific content
    if (currentPage === 'tenancies' && entityId) {
      const tenant = tenants.find(t => t.id === entityId);
      if (tenant) {
        const tenantRepairs = repairs.filter(r => r.tenantId === tenant.id && r.status !== 'completed');
        return {
          urgent: tenantRepairs.filter(r => r.priority === 'emergency').map(r => ({
            id: r.id, title: `Emergency repair: ${r.reference}`, description: r.subject, action: 'View repair'
          })),
          attention: [
            ...(tenant.rentBalance < -500 ? [{ id: 'arrears', title: `Arrears: £${Math.abs(tenant.rentBalance).toFixed(2)}`, description: `Risk score: ${tenant.arrearsRisk}%. ${tenant.paymentMethod === 'uc' ? 'UC payment expected.' : 'Payment method: ' + tenant.paymentMethod}`, action: 'Send support letter' }] : []),
            ...(tenant.contactCount30Days > 3 ? [{ id: 'contacts', title: `${tenant.contactCount30Days} contacts in 30 days`, description: 'High contact frequency may indicate unresolved issue. Complaint risk elevated.', action: 'Review contact history' }] : []),
          ],
          info: [
            { id: 'tenancy', title: `Tenancy since ${tenant.tenancyStartDate}`, description: `${tenant.tenancyType} tenancy. ${tenant.household.length} household members.`, action: undefined },
            ...(tenant.vulnerabilityFlags.length > 0 ? [{ id: 'vuln', title: `${tenant.vulnerabilityFlags.length} vulnerability flags`, description: tenant.vulnerabilityFlags.map(f => f.type).join(', '), action: 'Review support plan' }] : []),
          ],
          contextLabel: `${tenant.title} ${tenant.firstName} ${tenant.lastName}`,
        };
      }
    }

    if (currentPage === 'repairs' && entityId) {
      const repair = repairs.find(r => r.id === entityId);
      if (repair) {
        return {
          urgent: repair.isAwaabsLaw ? [{ id: 'awaab', title: "Awaab's Law case", description: `Statutory deadlines apply. Category: ${repair.awaabsLawCategory}`, action: 'View timers' }] : [],
          attention: [
            ...(repair.daysOpen > 28 ? [{ id: 'delay', title: `${repair.daysOpen} days open — SLA breached`, description: 'High complaint risk. Proactive update recommended.', action: 'Send holding update' }] : []),
            ...(repair.recurrenceRisk > 60 ? [{ id: 'recur', title: `${repair.recurrenceRisk}% recurrence risk`, description: 'Pattern analysis suggests root cause investigation needed.', action: 'Analyse pattern' }] : []),
          ],
          info: [{ id: 'repair', title: repair.reference, description: `${repair.trade} — ${repair.sorDescription}`, action: undefined }],
          contextLabel: repair.reference,
        };
      }
    }

    if (currentPage === 'dashboard') {
      // Use persona-specific insights if available
      if (personaInsights) {
        return {
          urgent: personaInsights.urgent.map((item, i) => ({ id: `u-${i}`, ...item })),
          attention: personaInsights.attention.map((item, i) => ({ id: `a-${i}`, ...item })),
          info: personaInsights.info.map((item, i) => ({ id: `i-${i}`, ...item })),
          contextLabel: 'Dashboard',
        };
      }
    }

    // Default: use standard aiInsights filtered by severity
    return {
      urgent: aiInsights.filter(i => i.severity === 'urgent').map(i => ({ id: i.id, title: i.title, description: i.description, action: i.action })),
      attention: aiInsights.filter(i => i.severity === 'attention').map(i => ({ id: i.id, title: i.title, description: i.description, action: i.action, confidence: i.confidence })),
      info: aiInsights.filter(i => i.severity === 'info').map(i => ({ id: i.id, title: i.title, description: i.description, action: i.action })),
      contextLabel: currentPage.charAt(0).toUpperCase() + currentPage.slice(1),
    };
  };

  const content = getContextContent();

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setTimeout(() => {
      const response = generateAiChatResponse(userMsg, persona);
      setChatMessages(prev => [...prev, { role: 'ai', text: response }]);
    }, 600);
  };

  const personaContext: Record<string, string> = {
    'coo': 'Strategic portfolio overview',
    'head-of-service': 'Service area operations',
    'manager': 'Team performance & caseload',
    'housing-officer': 'Your caseload today',
    'operative': "Today's job schedule",
  };

  return (
    <>
      {!pinned && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => dispatch({ type: 'SET_YANTRA_ASSIST', payload: false })} />}
      <div className="fixed left-0 top-0 h-screen w-[400px] bg-surface-elevated/95 backdrop-blur-xl border-r border-status-ai/20 z-50 flex flex-col animate-slide-in-left shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-status-ai/30 via-status-ai/5 to-transparent" />

        {/* Header */}
        <div className="p-4 border-b border-border-default relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-status-ai/8 via-status-ai/3 to-transparent" />
          <div className="relative flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-status-ai/15"><Sparkles size={16} className="text-status-ai" /></div>
              <span className="font-heading font-bold text-text-primary tracking-wide">Yantra Assist</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPinned(!pinned)} className={`p-1.5 rounded-lg hover:bg-surface-hover transition-all ${pinned ? 'text-status-ai bg-status-ai/10' : 'text-text-muted'}`}><Pin size={14} /></button>
              <button onClick={() => dispatch({ type: 'SET_YANTRA_ASSIST', payload: false })} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted"><X size={14} /></button>
            </div>
          </div>
          <div className="relative flex items-center gap-2 text-xs text-text-muted">
            <span className="bg-status-ai/15 text-status-ai px-2 py-0.5 rounded-full capitalize font-medium text-[10px]">{persona.replace(/-/g, ' ')}</span>
            <span className="opacity-40">•</span>
            <span>{content.contextLabel || personaContext[persona]}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {content.urgent && content.urgent.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2.5"><AlertCircle size={14} className="text-status-critical" /><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-status-critical">Urgent</span><span className="bg-status-critical/15 text-status-critical text-[10px] px-1.5 py-0.5 rounded-full font-bold">{content.urgent.length}</span></div>
              {content.urgent.map((item: any) => (
                <div key={item.id} className="bg-status-critical/5 border border-status-critical/15 rounded-xl p-3 mb-2 cursor-pointer hover:bg-status-critical/8 transition-all">
                  <div className="text-sm font-medium text-text-primary">{item.title}</div>
                  <div className="text-xs text-text-muted mt-1 leading-relaxed">{item.description}</div>
                  {item.action && <button className="mt-2 text-xs text-status-ai hover:text-status-ai/80 flex items-center gap-1 font-medium"><Sparkles size={10} /> {item.action}</button>}
                </div>
              ))}
            </section>
          )}

          {content.attention && content.attention.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2.5"><AlertTriangle size={14} className="text-status-warning" /><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-status-warning">Attention</span><span className="bg-status-warning/15 text-status-warning text-[10px] px-1.5 py-0.5 rounded-full font-bold">{content.attention.length}</span></div>
              {content.attention.map((item: any) => (
                <div key={item.id} className="bg-status-warning/5 border border-status-warning/15 rounded-xl p-3 mb-2 cursor-pointer hover:bg-status-warning/8 transition-all">
                  <div className="text-sm font-medium text-text-primary">{item.title}</div>
                  <div className="text-xs text-text-muted mt-1 leading-relaxed">{item.description}</div>
                  {item.confidence && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1 bg-surface-card rounded-full overflow-hidden"><div className="h-1 bg-status-ai/60 rounded-full" style={{ width: `${item.confidence}%` }} /></div>
                      <span className="text-[10px] text-status-ai font-mono">{item.confidence}%</span>
                    </div>
                  )}
                  {item.action && <button className="mt-2 text-xs text-status-ai hover:text-status-ai/80 flex items-center gap-1 font-medium"><Sparkles size={10} /> {item.action}</button>}
                </div>
              ))}
            </section>
          )}

          {content.info && content.info.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2.5"><Lightbulb size={14} className="text-status-info" /><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-status-info">Insights</span></div>
              {content.info.map((item: any) => (
                <div key={item.id} className="bg-surface-card border border-border-default rounded-xl p-3 mb-2 cursor-pointer hover:bg-surface-hover transition-all">
                  <div className="text-sm font-medium text-text-primary">{item.title}</div>
                  <div className="text-xs text-text-muted mt-1 leading-relaxed">{item.description}</div>
                </div>
              ))}
            </section>
          )}

          {/* Briefing */}
          <section>
            <div className="flex items-center gap-2 mb-2.5"><BarChart3 size={14} className="text-brand-peach" /><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-peach">Briefing</span></div>
            <div className="bg-surface-card border border-border-default rounded-xl p-3">
              <div className="text-sm text-text-primary mb-2 font-medium">Today's snapshot</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-surface-dark rounded-lg p-2.5"><span className="text-text-muted text-[10px]">Open repairs</span><div className="text-lg font-bold text-brand-peach font-heading mt-0.5">{scopedRepairs.filter(r => r.status !== 'completed').length}</div></div>
                <div className="bg-surface-dark rounded-lg p-2.5"><span className="text-text-muted text-[10px]">Complaints</span><div className="text-lg font-bold text-brand-teal font-heading mt-0.5">{scopedComplaints.filter(c => c.status !== 'closed').length}</div></div>
                <div className="bg-surface-dark rounded-lg p-2.5"><span className="text-text-muted text-[10px]">SLA breached</span><div className="text-lg font-bold text-status-critical font-heading mt-0.5">{scopedRepairs.filter(r => r.slaStatus === 'breached').length}</div></div>
                <div className="bg-surface-dark rounded-lg p-2.5"><span className="text-text-muted text-[10px]">Damp cases</span><div className="text-lg font-bold text-status-ai font-heading mt-0.5">{scopedDampCases.filter(d => d.status !== 'closed').length}</div></div>
              </div>
            </div>
          </section>

          {/* External */}
          <section>
            <div className="flex items-center gap-2 mb-2.5"><Cloud size={14} className="text-brand-blue" /><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-blue">External Factors</span></div>
            <div className="space-y-2">
              <div className="bg-surface-card border border-border-default rounded-xl p-3 text-xs hover:bg-surface-hover transition-colors"><div className="font-medium text-text-primary">🌧️ Weather: Heavy rain Thursday-Friday</div><div className="text-text-muted mt-1 leading-relaxed">Met Office amber warning. {scopedDampCases.filter(d => d.status !== 'closed').length} properties at increased damp risk.</div></div>
              <div className="bg-surface-card border border-border-default rounded-xl p-3 text-xs hover:bg-surface-hover transition-colors"><div className="font-medium text-text-primary">💰 DWP: UC managed migration wave 3</div><div className="text-text-muted mt-1 leading-relaxed">12 RCHA tenants in scope. Arrears impact: estimated £3,200.</div></div>
              <div className="bg-surface-card border border-border-default rounded-xl p-3 text-xs hover:bg-surface-hover transition-colors"><div className="font-medium text-text-primary">📋 RSH: Inspection programme update</div><div className="text-text-muted mt-1 leading-relaxed">Consumer Standards focus on complaint handling.</div></div>
            </div>
          </section>
        </div>

        {/* Chat */}
        <div className="border-t border-border-default p-3 relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-status-ai/20 via-transparent to-transparent" />
          {chatMessages.length > 0 && (
            <div className="max-h-32 overflow-y-auto mb-2 space-y-2">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`text-xs p-2.5 rounded-xl leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-brand-teal/10 text-text-primary ml-8 rounded-br-md' : 'bg-status-ai/8 text-text-primary mr-8 rounded-bl-md'}`}>{msg.text}</div>
              ))}
            </div>
          )}
          <form onSubmit={handleChat} className="flex gap-2">
            <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask Yantra..." className="flex-1 bg-surface-card/60 border border-border-default rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-ring" />
            <button type="submit" className="p-2 bg-gradient-to-br from-status-ai to-status-ai/70 rounded-xl text-white hover:shadow-md hover:shadow-status-ai/20 transition-all"><Send size={14} /></button>
          </form>
        </div>
      </div>
    </>
  );
}
