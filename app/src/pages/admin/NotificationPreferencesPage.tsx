import { useState } from 'react';
import {
  Bell, Mail, MessageSquare, Smartphone, Monitor, Clock,
  Wrench, Shield, PoundSterling, AlertTriangle, Sparkles,
  Save, RotateCcw, Volume2, VolumeX, Moon
} from 'lucide-react';

interface NotificationChannel {
  id: string;
  label: string;
  icon: typeof Bell;
  enabled: boolean;
}

interface NotificationCategory {
  id: string;
  label: string;
  description: string;
  icon: typeof Bell;
  color: string;
  channels: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
    portal: boolean;
  };
}

interface QuietHours {
  enabled: boolean;
  start: string;
  end: string;
  days: string[];
}

export default function NotificationPreferencesPage() {
  const [frequency, setFrequency] = useState<'immediate' | 'daily' | 'weekly'>('immediate');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  const [channels, setChannels] = useState<NotificationChannel[]>([
    { id: 'email', label: 'Email', icon: Mail, enabled: true },
    { id: 'sms', label: 'SMS', icon: Smartphone, enabled: false },
    { id: 'inApp', label: 'In-App', icon: Monitor, enabled: true },
    { id: 'portal', label: 'Tenant Portal', icon: MessageSquare, enabled: true },
  ]);

  const [categories, setCategories] = useState<NotificationCategory[]>([
    {
      id: 'repairs', label: 'Repairs & Maintenance', description: 'New repairs, status updates, SLA breaches, appointments',
      icon: Wrench, color: 'brand-peach',
      channels: { email: true, sms: false, inApp: true, portal: true },
    },
    {
      id: 'compliance', label: 'Compliance', description: 'Certificate expiry, inspections due, safety alerts',
      icon: Shield, color: 'status-compliant',
      channels: { email: true, sms: true, inApp: true, portal: false },
    },
    {
      id: 'arrears', label: 'Rent & Arrears', description: 'Payment received, arrears alerts, UC updates, Direct Debit status',
      icon: PoundSterling, color: 'brand-teal',
      channels: { email: true, sms: false, inApp: true, portal: true },
    },
    {
      id: 'asb', label: 'Anti-Social Behaviour', description: 'New reports, escalation triggers, community trigger alerts',
      icon: AlertTriangle, color: 'status-warning',
      channels: { email: true, sms: true, inApp: true, portal: false },
    },
    {
      id: 'complaints', label: 'Complaints', description: 'New complaints, SLA deadlines, escalation risk, ombudsman alerts',
      icon: MessageSquare, color: 'status-critical',
      channels: { email: true, sms: false, inApp: true, portal: false },
    },
    {
      id: 'ai', label: 'AI Insights', description: 'Vulnerability alerts, damp predictions, risk scoring, proactive recommendations',
      icon: Sparkles, color: 'status-ai',
      channels: { email: false, sms: false, inApp: true, portal: false },
    },
  ]);

  const [quietHours, setQuietHours] = useState<QuietHours>({
    enabled: false,
    start: '22:00',
    end: '07:00',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  });

  const toggleChannel = (channelId: string) => {
    setChannels(prev => prev.map(c => c.id === channelId ? { ...c, enabled: !c.enabled } : c));
  };

  const toggleCategoryChannel = (catId: string, channel: keyof NotificationCategory['channels']) => {
    setCategories(prev => prev.map(cat =>
      cat.id === catId ? { ...cat, channels: { ...cat.channels, [channel]: !cat.channels[channel] } } : cat
    ));
  };

  const toggleQuietDay = (day: string) => {
    setQuietHours(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day],
    }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setFrequency('immediate');
    setSoundEnabled(true);
    setChannels(channels.map(c => ({ ...c, enabled: true })));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brand-peach">Notification Preferences</h1>
          <p className="text-sm text-text-muted mt-1">Configure how and when you receive notifications</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 bg-surface-card border border-border-default rounded-lg text-xs text-text-muted hover:text-text-primary transition-all">
            <RotateCcw size={13} /> Reset
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              saved ? 'bg-status-compliant text-white' : 'bg-brand-teal text-white hover:bg-brand-teal/90'
            }`}
          >
            <Save size={13} /> {saved ? 'Saved!' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* Delivery Channels */}
      <div className="bg-surface-card border border-border-default rounded-xl p-5">
        <h2 className="text-sm font-heading font-bold text-text-primary mb-4">Delivery Channels</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {channels.map(ch => (
            <button
              key={ch.id}
              onClick={() => toggleChannel(ch.id)}
              className={`p-4 rounded-xl border transition-all text-center ${
                ch.enabled
                  ? 'bg-brand-teal/10 border-brand-teal/30 text-brand-teal'
                  : 'bg-surface-dark border-border-default text-text-muted hover:border-border-default/80'
              }`}
            >
              <ch.icon size={20} className="mx-auto mb-2" />
              <div className="text-xs font-medium">{ch.label}</div>
              <div className="text-[10px] mt-1 opacity-60">{ch.enabled ? 'Enabled' : 'Disabled'}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Delivery Frequency */}
      <div className="bg-surface-card border border-border-default rounded-xl p-5">
        <h2 className="text-sm font-heading font-bold text-text-primary mb-4 flex items-center gap-2">
          <Clock size={16} className="text-brand-teal" /> Delivery Frequency
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {([
            { id: 'immediate', label: 'Immediate', desc: 'Receive notifications as they happen' },
            { id: 'daily', label: 'Daily Digest', desc: 'Summary email once per day at 08:00' },
            { id: 'weekly', label: 'Weekly Summary', desc: 'Summary email every Monday at 08:00' },
          ] as const).map(opt => (
            <button
              key={opt.id}
              onClick={() => setFrequency(opt.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                frequency === opt.id
                  ? 'bg-brand-teal/10 border-brand-teal/30'
                  : 'bg-surface-dark border-border-default hover:border-border-default/80'
              }`}
            >
              <div className={`text-sm font-medium ${frequency === opt.id ? 'text-brand-teal' : 'text-text-primary'}`}>{opt.label}</div>
              <div className="text-[10px] text-text-muted mt-1">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Category Subscriptions */}
      <div className="bg-surface-card border border-border-default rounded-xl p-5">
        <h2 className="text-sm font-heading font-bold text-text-primary mb-4">Category Subscriptions</h2>
        <div className="space-y-3">
          {/* Header row */}
          <div className="grid grid-cols-12 gap-2 px-3 text-[10px] uppercase tracking-wider text-text-muted font-semibold">
            <div className="col-span-5">Category</div>
            <div className="col-span-7 grid grid-cols-4 text-center">
              <div>Email</div>
              <div>SMS</div>
              <div>In-App</div>
              <div>Portal</div>
            </div>
          </div>

          {categories.map(cat => (
            <div key={cat.id} className="grid grid-cols-12 gap-2 items-center p-3 bg-surface-dark rounded-xl">
              <div className="col-span-5 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${cat.color}/10`}>
                  <cat.icon size={16} className={`text-${cat.color}`} />
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">{cat.label}</div>
                  <div className="text-[10px] text-text-muted">{cat.description}</div>
                </div>
              </div>
              <div className="col-span-7 grid grid-cols-4">
                {(['email', 'sms', 'inApp', 'portal'] as const).map(ch => (
                  <div key={ch} className="flex justify-center">
                    <button
                      onClick={() => toggleCategoryChannel(cat.id, ch)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        cat.channels[ch]
                          ? 'bg-brand-teal/20 text-brand-teal'
                          : 'bg-surface-card text-text-muted hover:bg-surface-hover'
                      }`}
                    >
                      {cat.channels[ch] ? <Bell size={13} /> : <VolumeX size={13} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-surface-card border border-border-default rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-heading font-bold text-text-primary flex items-center gap-2">
            <Moon size={16} className="text-status-ai" /> Quiet Hours
          </h2>
          <button
            onClick={() => setQuietHours(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`relative w-10 h-5 rounded-full transition-all ${quietHours.enabled ? 'bg-brand-teal' : 'bg-surface-hover'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${quietHours.enabled ? 'left-5.5' : 'left-0.5'}`}
              style={{ left: quietHours.enabled ? '22px' : '2px' }}
            />
          </button>
        </div>

        {quietHours.enabled && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">From</label>
                <input
                  type="time"
                  value={quietHours.start}
                  onChange={e => setQuietHours(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-surface-dark border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary"
                />
              </div>
              <span className="text-text-muted mt-4">to</span>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Until</label>
                <input
                  type="time"
                  value={quietHours.end}
                  onChange={e => setQuietHours(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-surface-dark border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-2">Active Days</label>
              <div className="flex gap-1.5">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <button
                    key={day}
                    onClick={() => toggleQuietDay(day)}
                    className={`w-10 h-10 rounded-lg text-xs font-medium transition-all ${
                      quietHours.days.includes(day)
                        ? 'bg-status-ai/15 text-status-ai border border-status-ai/30'
                        : 'bg-surface-dark text-text-muted border border-border-default hover:border-border-default/80'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-text-muted">During quiet hours, only urgent and emergency notifications will be delivered. All others will be queued for your next active period.</p>
          </div>
        )}
      </div>

      {/* Sound Preferences */}
      <div className="bg-surface-card border border-border-default rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {soundEnabled ? <Volume2 size={18} className="text-brand-teal" /> : <VolumeX size={18} className="text-text-muted" />}
            <div>
              <div className="text-sm font-medium text-text-primary">Notification Sounds</div>
              <div className="text-[10px] text-text-muted">Play a sound alert for new notifications</div>
            </div>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`relative w-10 h-5 rounded-full transition-all ${soundEnabled ? 'bg-brand-teal' : 'bg-surface-hover'}`}
          >
            <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all"
              style={{ left: soundEnabled ? '22px' : '2px' }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
