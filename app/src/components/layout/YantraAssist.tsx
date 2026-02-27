import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { usePersonaScope } from '@/hooks/usePersonaScope';
import {
  X, Pin, Send, Sparkles, AlertCircle, AlertTriangle, Lightbulb,
  BarChart3, Cloud, Copy, Share2, RotateCcw, MessageSquare, Loader2
} from 'lucide-react';
import { aiInsights, tenants, properties, repairs } from '@/data';
import { generateAiChatResponse } from '@/services/ai-drafting';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
  context?: string;
}

const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  dashboard: [
    'Show me today\'s repair summary',
    'Which tenants are at high arrears risk?',
    'Any complaints approaching SLA breach?',
    'Damp risk analysis for the week',
  ],
  tenancies: [
    'What are this tenant\'s vulnerability flags?',
    'Draft a welfare check letter',
    'Show rent payment history',
    'Any open cases for this tenant?',
  ],
  repairs: [
    'What\'s the SLA status for this repair?',
    'Is there a recurrence pattern?',
    'Draft a holding update letter',
    'Which properties have similar issues?',
  ],
  properties: [
    'Show the damp risk breakdown',
    'When is the gas safety expiring?',
    'Generate a property passport',
    'What EPC improvements are recommended?',
  ],
  default: [
    'Show me today\'s key statistics',
    'Which tenants need welfare checks?',
    'Draft a communication',
    'Show properties with compliance issues',
  ],
};

export default function YantraAssist() {
  const { state, dispatch } = useApp();
  const location = useLocation();
  const { personaInsights, persona, scopedRepairs, scopedTenants, scopedComplaints, scopedDampCases } = usePersonaScope();
  const [pinned, setPinned] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'insights' | 'chat'>('insights');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Focus input when switching to chat tab
  useEffect(() => {
    if (activeTab === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeTab]);

  // Load chat history from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('yantra-chat-history');
      if (saved) {
        const parsed = JSON.parse(saved);
        setChatMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      }
    } catch { /* noop */ }
  }, []);

  // Save chat history to sessionStorage
  useEffect(() => {
    if (chatMessages.length > 0) {
      try {
        sessionStorage.setItem('yantra-chat-history', JSON.stringify(chatMessages.slice(-50)));
      } catch { /* noop */ }
    }
  }, [chatMessages]);

  if (!state.yantraAssistOpen) return null;

  // Extract entity ID from URL for context
  const pathParts = location.pathname.split('/');
  const currentPage = pathParts[1] || 'dashboard';
  const entityId = pathParts[2] || null;

  // Get context-specific content
  const getContextContent = () => {
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
      if (personaInsights) {
        return {
          urgent: personaInsights.urgent.map((item, i) => ({ id: `u-${i}`, ...item })),
          attention: personaInsights.attention.map((item, i) => ({ id: `a-${i}`, ...item })),
          info: personaInsights.info.map((item, i) => ({ id: `i-${i}`, ...item })),
          contextLabel: 'Dashboard',
        };
      }
    }

    return {
      urgent: aiInsights.filter(i => i.severity === 'urgent').map(i => ({ id: i.id, title: i.title, description: i.description, action: i.action })),
      attention: aiInsights.filter(i => i.severity === 'attention').map(i => ({ id: i.id, title: i.title, description: i.description, action: i.action, confidence: i.confidence })),
      info: aiInsights.filter(i => i.severity === 'info').map(i => ({ id: i.id, title: i.title, description: i.description, action: i.action })),
      contextLabel: currentPage.charAt(0).toUpperCase() + currentPage.slice(1),
    };
  };

  const content = getContextContent();

  // Simulate streaming response with word-by-word display
  const streamResponse = useCallback((fullText: string, messageId: string) => {
    const words = fullText.split(' ');
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex += 2; // 2 words at a time for speed
      if (currentIndex >= words.length) {
        currentIndex = words.length;
        clearInterval(interval);
        setChatMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, text: fullText, isStreaming: false } : m
        ));
        setIsTyping(false);
      } else {
        setChatMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, text: words.slice(0, currentIndex).join(' ') } : m
        ));
      }
    }, 30);
  }, []);

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;
    const userMsg = chatInput.trim();

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      text: userMsg,
      timestamp: new Date(),
      context: `${currentPage}${entityId ? `/${entityId}` : ''}`,
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);
    setActiveTab('chat');

    // Generate response after short delay
    setTimeout(() => {
      const response = generateAiChatResponse(userMsg, persona);
      const aiMessageId = `msg-${Date.now()}-ai`;
      const aiMessage: ChatMessage = {
        id: aiMessageId,
        role: 'ai',
        text: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      setChatMessages(prev => [...prev, aiMessage]);
      streamResponse(response, aiMessageId);
    }, 400);
  };

  const handleSuggestionClick = (question: string) => {
    setChatInput(question);
    // Auto-submit the suggestion
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      text: question,
      timestamp: new Date(),
      context: `${currentPage}${entityId ? `/${entityId}` : ''}`,
    };
    setChatMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setActiveTab('chat');
    setChatInput('');

    setTimeout(() => {
      const response = generateAiChatResponse(question, persona);
      const aiMessageId = `msg-${Date.now()}-ai`;
      const aiMessage: ChatMessage = {
        id: aiMessageId,
        role: 'ai',
        text: '',
        timestamp: new Date(),
        isStreaming: true,
      };
      setChatMessages(prev => [...prev, aiMessage]);
      streamResponse(response, aiMessageId);
    }, 400);
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const handleClearChat = () => {
    setChatMessages([]);
    sessionStorage.removeItem('yantra-chat-history');
  };

  const suggestions = SUGGESTED_QUESTIONS[currentPage] || SUGGESTED_QUESTIONS.default;

  const personaContext: Record<string, string> = {
    'coo': 'Strategic portfolio overview',
    'head-of-service': 'Service area operations',
    'manager': 'Team performance & caseload',
    'housing-officer': 'Your caseload today',
    'operative': "Today's job schedule",
  };

  // Render markdown-like formatting (bold, lists, line breaks)
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Bold text: **text**
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const rendered = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="text-text-primary font-semibold">{part.slice(2, -2)}</strong>;
        }
        return <span key={j}>{part}</span>;
      });

      // Bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        return <div key={i} className="flex gap-1.5 ml-2"><span className="text-brand-teal">•</span><span>{rendered}</span></div>;
      }
      // Numbered lists
      if (/^\d+\.\s/.test(line.trim())) {
        return <div key={i} className="flex gap-1.5 ml-2"><span className="text-brand-teal font-mono text-[10px]">{line.trim().match(/^\d+/)?.[0]}.</span><span>{rendered.slice(1)}</span></div>;
      }
      // Empty lines
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      return <div key={i}>{rendered}</div>;
    });
  };

  return (
    <>
      {!pinned && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => dispatch({ type: 'SET_YANTRA_ASSIST', payload: false })} />}
      <div className="fixed left-0 top-0 h-screen w-[420px] bg-surface-elevated/95 backdrop-blur-xl border-r border-status-ai/20 z-50 flex flex-col animate-slide-in-left shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-status-ai/30 via-status-ai/5 to-transparent" />

        {/* Header */}
        <div className="p-4 border-b border-border-default relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-status-ai/8 via-status-ai/3 to-transparent" />
          <div className="relative flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-status-ai/15"><Sparkles size={16} className="text-status-ai" /></div>
              <span className="font-heading font-bold text-text-primary tracking-wide">Yantra Assist</span>
              <span className="text-[9px] bg-status-ai/15 text-status-ai px-1.5 py-0.5 rounded-full font-medium">AI</span>
            </div>
            <div className="flex items-center gap-1">
              {chatMessages.length > 0 && (
                <button onClick={handleClearChat} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted transition-all" title="Clear chat">
                  <RotateCcw size={13} />
                </button>
              )}
              <button onClick={() => setPinned(!pinned)} className={`p-1.5 rounded-lg hover:bg-surface-hover transition-all ${pinned ? 'text-status-ai bg-status-ai/10' : 'text-text-muted'}`} title={pinned ? 'Unpin' : 'Pin'}>
                <Pin size={14} />
              </button>
              <button onClick={() => dispatch({ type: 'SET_YANTRA_ASSIST', payload: false })} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted"><X size={14} /></button>
            </div>
          </div>
          <div className="relative flex items-center gap-2 text-xs text-text-muted">
            <span className="bg-status-ai/15 text-status-ai px-2 py-0.5 rounded-full capitalize font-medium text-[10px]">{persona.replace(/-/g, ' ')}</span>
            <span className="opacity-40">•</span>
            <span>{content.contextLabel || personaContext[persona]}</span>
          </div>

          {/* Tab switcher */}
          <div className="relative flex mt-3 bg-surface-card/60 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('insights')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'insights' ? 'bg-surface-hover text-text-primary' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <Lightbulb size={12} />
              Insights
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'chat' ? 'bg-surface-hover text-text-primary' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <MessageSquare size={12} />
              Chat
              {chatMessages.length > 0 && (
                <span className="bg-status-ai/20 text-status-ai text-[9px] px-1 rounded-full">{chatMessages.filter(m => m.role === 'ai').length}</span>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'insights' ? (
            <div className="p-4 space-y-5">
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
          ) : (
            /* Chat Tab */
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="space-y-4 pt-4">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto bg-status-ai/10 rounded-2xl flex items-center justify-center mb-3">
                        <Sparkles size={24} className="text-status-ai" />
                      </div>
                      <h3 className="text-sm font-heading font-bold text-text-primary mb-1">Ask me anything</h3>
                      <p className="text-xs text-text-muted">I have full context of your housing portfolio, tenants, repairs, and compliance data.</p>
                    </div>

                    {/* Suggested Questions */}
                    <div className="space-y-2">
                      <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold px-1">Suggested questions</div>
                      {suggestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(q)}
                          className="w-full text-left p-2.5 bg-surface-card/60 border border-border-default rounded-xl text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary hover:border-status-ai/20 transition-all"
                        >
                          <span className="text-status-ai mr-1.5">→</span>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={`group ${msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
                        <div className={`max-w-[90%] ${msg.role === 'user' ? 'order-1' : 'order-1'}`}>
                          {msg.role === 'ai' && (
                            <div className="flex items-center gap-1.5 mb-1">
                              <Sparkles size={10} className="text-status-ai" />
                              <span className="text-[10px] text-status-ai font-medium">Yantra</span>
                              {msg.isStreaming && <Loader2 size={10} className="text-status-ai animate-spin" />}
                            </div>
                          )}
                          <div className={`text-xs p-3 rounded-2xl leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-brand-teal/15 text-text-primary rounded-br-md border border-brand-teal/20'
                              : 'bg-surface-card text-text-primary rounded-bl-md border border-border-default'
                          }`}>
                            {msg.role === 'ai' ? renderFormattedText(msg.text) : msg.text}
                            {msg.isStreaming && <span className="inline-block w-1.5 h-3 bg-status-ai/60 ml-0.5 animate-pulse rounded-sm" />}
                          </div>
                          {msg.role === 'ai' && !msg.isStreaming && (
                            <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleCopyMessage(msg.text)}
                                className="p-1 rounded hover:bg-surface-hover text-text-muted"
                                title="Copy response"
                              >
                                <Copy size={11} />
                              </button>
                              <span className="text-[9px] text-text-muted">
                                {msg.timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isTyping && !chatMessages.some(m => m.isStreaming) && (
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-status-ai/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-status-ai/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-status-ai/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span>Thinking...</span>
                      </div>
                    )}
                  </>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick suggestions after response */}
              {chatMessages.length > 0 && !isTyping && (
                <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
                  {suggestions.slice(0, 2).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(q)}
                      className="text-[10px] px-2 py-1 bg-surface-card/60 border border-border-default rounded-full text-text-muted hover:text-status-ai hover:border-status-ai/20 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Input — always visible */}
        <div className="border-t border-border-default p-3 relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-status-ai/20 via-transparent to-transparent" />
          <form onSubmit={handleChat} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask Yantra..."
              disabled={isTyping}
              className="flex-1 bg-surface-card/60 border border-border-default rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-ring disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isTyping || !chatInput.trim()}
              className="p-2 bg-gradient-to-br from-status-ai to-status-ai/70 rounded-xl text-white hover:shadow-md hover:shadow-status-ai/20 transition-all disabled:opacity-40"
            >
              {isTyping ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
