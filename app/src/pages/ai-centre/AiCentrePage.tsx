import { useState } from 'react';
import { aiInsights } from '@/data';
import { Sparkles, Send, AlertTriangle, Info, Lightbulb, TrendingUp, BarChart3, Users, Home, Shield, Wrench, MessageSquare, PoundSterling, Brain } from 'lucide-react';
import { formatPercent } from '@/utils/format';
import { generateAiChatResponse } from '@/services/ai-drafting';
import { useApp } from '@/context/AppContext';

const predictionModels = [
  {
    id: 'complaint-escalation',
    name: 'Complaint Escalation',
    description: 'Predicts likelihood of formal complaints based on repair delays, contact frequency, and tenant sentiment',
    entitiesScored: 45,
    accuracy: 87,
    icon: <MessageSquare size={24} />,
  },
  {
    id: 'damp-mould',
    name: 'Damp & Mould Risk',
    description: 'Assesses property-level damp and mould risk using building characteristics, weather data, and historical cases',
    entitiesScored: 50,
    accuracy: 82,
    icon: <Home size={24} />,
  },
  {
    id: 'arrears-risk',
    name: 'Arrears Risk',
    description: 'Predicts tenancies at risk of entering or increasing arrears within 30 days',
    entitiesScored: 48,
    accuracy: 79,
    icon: <PoundSterling size={24} />,
  },
  {
    id: 'vulnerability',
    name: 'Vulnerability Detection',
    description: 'Identifies tenants who may need welfare checks or additional support',
    entitiesScored: 50,
    accuracy: 85,
    icon: <Users size={24} />,
  },
  {
    id: 'repair-recurrence',
    name: 'Repair Recurrence',
    description: 'Identifies patterns in recurring repairs to recommend proactive capital works',
    entitiesScored: 120,
    accuracy: 76,
    icon: <Wrench size={24} />,
  },
  {
    id: 'compliance-failure',
    name: 'Compliance Failure',
    description: 'Predicts compliance certificate expirations and potential breaches',
    entitiesScored: 50,
    accuracy: 90,
    icon: <Shield size={24} />,
  },
  {
    id: 'performance-analysis',
    name: 'Performance Analysis',
    description: 'Analyses TSM and operational metrics to identify improvement opportunities',
    entitiesScored: 22,
    accuracy: 71,
    icon: <BarChart3 size={24} />,
  },
  {
    id: 'tenant-satisfaction',
    name: 'Tenant Satisfaction',
    description: 'Predicts tenant satisfaction scores based on service delivery patterns',
    entitiesScored: 50,
    accuracy: 74,
    icon: <TrendingUp size={24} />,
  },
];

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'urgent':
      return <AlertTriangle size={16} className="text-status-critical" />;
    case 'attention':
      return <Info size={16} className="text-status-warning" />;
    default:
      return <Lightbulb size={16} className="text-status-info" />;
  }
};

const getSeverityColour = (severity: string) => {
  switch (severity) {
    case 'urgent':
      return 'border-status-critical bg-status-critical/5';
    case 'attention':
      return 'border-status-warning bg-status-warning/5';
    default:
      return 'border-status-info bg-status-info/5';
  }
};

export default function AiCentrePage() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<'insights' | 'predictions' | 'assistant'>('insights');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userMessage = chatInput;
    setChatMessages([...chatMessages, { role: 'user', content: userMessage }]);
    setChatInput('');
    // Generate AI response
    setTimeout(() => {
      const response = generateAiChatResponse(userMessage, state.persona);
      setChatMessages(prev => [...prev, {
        role: 'ai',
        content: response
      }]);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles size={32} className="text-status-ai" />
            <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight">AI Centre</h1>
          </div>
          <p className="text-text-muted">AI-powered insights, predictions, and intelligent assistance</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'insights'
                ? 'border-status-ai text-status-ai'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'predictions'
                ? 'border-status-ai text-status-ai'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Predictions
          </button>
          <button
            onClick={() => setActiveTab('assistant')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'assistant'
                ? 'border-status-ai text-status-ai'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Assistant
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'insights' && (
          <div className="space-y-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            {aiInsights.map((insight, index) => (
              <div
                key={insight.id}
                className={`bg-surface-card rounded-xl border-l-4 p-4 ${getSeverityColour(insight.severity)} opacity-0 animate-fade-in-up`}
                style={{ animationDelay: `${200 + index * 50}ms`, animationFillMode: 'forwards' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(insight.severity)}
                    <span className="text-xs uppercase tracking-wider text-status-ai font-medium">{insight.type}</span>
                    {insight.model && (
                      <span className="text-xs text-text-muted">• {insight.model}</span>
                    )}
                  </div>
                  <span className="text-xs text-text-muted">{insight.date}</span>
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">{insight.title}</h3>
                <p className="text-xs text-text-muted mb-3 leading-relaxed">{insight.description}</p>
                
                {/* Confidence Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-muted">Confidence</span>
                    <span className="text-xs font-medium text-status-ai">{insight.confidence}%</span>
                  </div>
                  <div className="w-full bg-surface-elevated rounded-full h-1.5">
                    <div
                      className="bg-status-ai h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${insight.confidence}%` }}
                    />
                  </div>
                </div>

                {/* Affected Entities */}
                {insight.affectedEntities.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-text-muted mb-1">Affected:</div>
                    <div className="flex flex-wrap gap-1">
                      {insight.affectedEntities.map((entity, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-surface-elevated rounded text-text-secondary"
                        >
                          {entity.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                {insight.action && (
                  <button className="text-xs px-3 py-1.5 bg-status-ai/20 text-status-ai rounded hover:bg-status-ai/30 transition-colors border border-status-ai/30">
                    {insight.action}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            {predictionModels.map((model, index) => (
              <div
                key={model.id}
                className="bg-surface-card rounded-lg border border-border-default p-4 hover:border-status-ai transition-all duration-300 opacity-0 animate-fade-in-up group"
                style={{ animationDelay: `${200 + index * 50}ms`, animationFillMode: 'forwards' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-status-ai/20 text-status-ai">
                    {model.icon}
                  </div>
                  <Brain size={16} className="text-status-ai opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-1 group-hover:text-status-ai transition-colors">
                  {model.name}
                </h3>
                <p className="text-xs text-text-muted mb-3 leading-relaxed">{model.description}</p>
                <div className="space-y-2 pt-3 border-t border-border-default">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Entities Scored</span>
                    <span className="text-text-primary font-medium">{model.entitiesScored}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Accuracy</span>
                    <span className="text-status-ai font-medium">{formatPercent(model.accuracy)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'assistant' && (
          <div className="bg-surface-card rounded-lg border border-border-default h-[600px] flex flex-col opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            {/* Chat Header */}
            <div className="p-4 border-b border-border-default">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-status-ai" />
                <h3 className="text-sm font-semibold text-text-primary">AI Assistant</h3>
              </div>
              <p className="text-xs text-text-muted mt-1">Ask questions about your data, get insights, and receive recommendations</p>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-text-muted py-8">
                  <Sparkles size={48} className="mx-auto mb-3 text-status-ai opacity-50" />
                  <p className="text-sm">Start a conversation with AI Assistant</p>
                  <p className="text-xs mt-2">Try asking: "What are the top risks this week?" or "Show me compliance trends"</p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} opacity-0 animate-fade-in-up`}
                    style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'forwards' }}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-brand-teal/20 text-text-primary'
                          : 'bg-surface-elevated text-text-primary border border-border-default'
                      }`}
                    >
                      {msg.role === 'ai' && (
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles size={14} className="text-status-ai" />
                          <span className="text-xs text-status-ai font-medium">AI Assistant</span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-border-default">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask a question..."
                  className="flex-1 bg-surface-elevated border border-border-default rounded-lg px-4 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-status-ai transition-colors"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2 bg-status-ai text-white rounded-lg hover:bg-status-ai/80 transition-colors flex items-center gap-2"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
