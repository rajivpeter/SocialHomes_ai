import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar, ChevronDown, User, Wrench, Clock, MapPin, Loader2,
  Plus, Umbrella, BookOpen, Ban, Briefcase, AlertCircle
} from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, EventInput } from '@fullcalendar/core';
import { schedulingApi } from '@/services/api-client';
import { safeText, formatDate } from '@/utils/format';
import ActionModal from '@/components/shared/ActionModal';
import type { ActionField } from '@/components/shared/ActionModal';

// ---- Types ----

interface Operative {
  id: string;
  name: string;
  trade: string;
  skills: string[];
  status: 'available' | 'on-leave' | 'busy';
}

interface Appointment {
  id: string;
  operativeId: string;
  operativeName: string;
  start: string;
  end: string;
  propertyAddress: string;
  repairType: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  repairId?: string;
}

interface DiaryBlock {
  id: string;
  operativeId: string;
  type: 'holiday' | 'training' | 'blocked';
  title: string;
  start: string;
  end: string;
  notes?: string;
}

// ---- Diary block modal fields ----

const DIARY_BLOCK_TYPES = [
  { value: 'holiday', label: 'Holiday' },
  { value: 'training', label: 'Training' },
  { value: 'blocked', label: 'Block Time' },
];

const DIARY_BLOCK_FIELDS: ActionField[] = [
  { id: 'title', label: 'Title', type: 'text', placeholder: 'e.g. Annual Leave', required: true },
  {
    id: 'type', label: 'Block Type', type: 'select', required: true,
    options: DIARY_BLOCK_TYPES,
  },
  { id: 'startDate', label: 'Start Date', type: 'date', required: true },
  { id: 'endDate', label: 'End Date', type: 'date', required: true },
  { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional details...' },
];

// ---- Helpers ----

function getWeekStart(d: Date): string {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-brand-teal/15 text-brand-teal',
  'in-progress': 'bg-status-warning/15 text-status-warning',
  completed: 'bg-status-compliant/15 text-status-compliant',
  cancelled: 'bg-status-void/15 text-status-void',
};

// ---- Component ----

export default function SchedulingPage() {
  const [operatives, setOperatives] = useState<Operative[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [diaryBlocks, setDiaryBlocks] = useState<DiaryBlock[]>([]);
  const [selectedOperativeId, setSelectedOperativeId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [diaryModalType, setDiaryModalType] = useState<string>('holiday');

  const today = useMemo(() => new Date(), []);

  // Current operative object
  const selectedOperative = useMemo(
    () => operatives.find(o => o.id === selectedOperativeId) ?? null,
    [operatives, selectedOperativeId],
  );

  // ---- Data fetching ----

  const fetchOperatives = useCallback(async () => {
    try {
      const data = await schedulingApi.operatives();
      const items: Operative[] = (data?.items ?? []).map((o: any) => ({
        id: o.id ?? '',
        name: o.name ?? '',
        trade: o.trade ?? '',
        skills: o.skills ?? [],
        status: o.status ?? 'available',
      }));
      setOperatives(items);
    } catch {
      // operatives fetch failure is non-fatal — show empty dropdown
    }
  }, []);

  const fetchScheduleData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const weekStart = getWeekStart(today);
      const dateStr = toDateStr(today);
      const opFilter = selectedOperativeId !== 'all' ? selectedOperativeId : undefined;

      const [apptRes, diaryRes] = await Promise.all([
        schedulingApi.appointments({ operativeId: opFilter, date: dateStr }),
        opFilter
          ? schedulingApi.diary({ operativeId: opFilter, weekStart })
          : Promise.resolve(null),
      ]);

      const apptItems: Appointment[] = (apptRes?.items ?? []).map((a: any) => ({
        id: a.id ?? '',
        operativeId: a.operativeId ?? '',
        operativeName: a.operativeName ?? '',
        start: a.start ?? a.startTime ?? '',
        end: a.end ?? a.endTime ?? '',
        propertyAddress: a.propertyAddress ?? a.address ?? '',
        repairType: a.repairType ?? a.type ?? '',
        status: a.status ?? 'scheduled',
        repairId: a.repairId,
      }));
      setAppointments(apptItems);

      if (diaryRes) {
        const blocks: DiaryBlock[] = (Array.isArray(diaryRes) ? diaryRes : diaryRes?.items ?? []).map((b: any) => ({
          id: b.id ?? '',
          operativeId: b.operativeId ?? '',
          type: b.type ?? 'blocked',
          title: b.title ?? b.type ?? 'Blocked',
          start: b.start ?? b.startDate ?? '',
          end: b.end ?? b.endDate ?? '',
          notes: b.notes ?? '',
        }));
        setDiaryBlocks(blocks);
      } else {
        setDiaryBlocks([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  }, [selectedOperativeId, today]);

  useEffect(() => {
    fetchOperatives();
  }, [fetchOperatives]);

  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  // ---- Calendar events ----

  const calendarEvents: EventInput[] = useMemo(() => {
    const events: EventInput[] = [];

    // Appointments as teal events
    appointments.forEach(a => {
      events.push({
        id: `appt-${a.id}`,
        title: `${a.repairType} — ${a.propertyAddress}`,
        start: a.start,
        end: a.end,
        backgroundColor: '#19B092',
        borderColor: '#19B092',
        textColor: '#ffffff',
        extendedProps: { kind: 'appointment', data: a },
      });
    });

    // Diary blocks as grey blocked time
    diaryBlocks.forEach(b => {
      events.push({
        id: `block-${b.id}`,
        title: b.title,
        start: b.start,
        end: b.end,
        backgroundColor: '#3B4252',
        borderColor: '#4C566A',
        textColor: '#9CA3AF',
        display: 'background',
        extendedProps: { kind: 'diary', data: b },
      });
      // Also show as a foreground event for visibility
      events.push({
        id: `block-fg-${b.id}`,
        title: b.title,
        start: b.start,
        end: b.end,
        backgroundColor: '#4C566A',
        borderColor: '#4C566A',
        textColor: '#9CA3AF',
        extendedProps: { kind: 'diary', data: b },
      });
    });

    return events;
  }, [appointments, diaryBlocks]);

  // ---- Event click ----

  const handleEventClick = useCallback((info: EventClickArg) => {
    const kind = info.event.extendedProps?.kind;
    if (kind === 'appointment') {
      setSelectedEvent(info.event.extendedProps.data as Appointment);
    }
  }, []);

  // ---- Diary block creation ----

  const openDiaryModal = (type: string) => {
    setDiaryModalType(type);
    setShowDiaryModal(true);
  };

  const handleCreateDiaryBlock = async (values: Record<string, string>) => {
    if (!selectedOperative) return;
    await schedulingApi.createDiaryBlock({
      operativeId: selectedOperative.id,
      type: values.type || diaryModalType,
      title: values.title,
      start: values.startDate,
      end: values.endDate,
      notes: values.notes || '',
    });
    // Refresh
    fetchScheduleData();
  };

  // ---- Today's appointments for the selected operative ----

  const todaysAppointments = useMemo(() => {
    const todayStr = toDateStr(today);
    return appointments.filter(a => {
      const apptDate = a.start?.split('T')[0];
      const matchDate = apptDate === todayStr;
      const matchOp = selectedOperativeId === 'all' || a.operativeId === selectedOperativeId;
      return matchDate && matchOp;
    });
  }, [appointments, selectedOperativeId, today]);

  // ---- Stats ----

  const jobsToday = todaysAppointments.length;
  const jobsThisWeek = appointments.length;

  // ---- Diary modal fields with default type ----

  const diaryFields = useMemo<ActionField[]>(() =>
    DIARY_BLOCK_FIELDS.map(f =>
      f.id === 'type' ? { ...f, defaultValue: diaryModalType } : f
    ), [diaryModalType]);

  const diaryModalTitle = diaryModalType === 'holiday' ? 'Add Holiday' :
    diaryModalType === 'training' ? 'Add Training' : 'Block Time';

  const diaryModalIcon = diaryModalType === 'holiday' ? <Umbrella size={20} className="text-brand-teal" /> :
    diaryModalType === 'training' ? <BookOpen size={20} className="text-brand-teal" /> :
    <Ban size={20} className="text-brand-teal" />;

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brand-peach flex items-center gap-2">
            <Calendar size={24} /> Scheduling &amp; Diary
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Manage operative diaries, appointments &amp; availability
          </p>
        </div>

        {/* Operative filter */}
        <div className="relative">
          <select
            value={selectedOperativeId}
            onChange={e => setSelectedOperativeId(e.target.value)}
            className="appearance-none bg-surface-card border border-border-default rounded-lg pl-3 pr-8 py-2 text-sm text-text-primary focus-ring min-w-[220px]"
          >
            <option value="all">All Operatives</option>
            {operatives.map(op => (
              <option key={op.id} value={op.id}>
                {op.name} ({op.trade})
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        </div>
      </div>

      {/* ---- Loading ---- */}
      {loading && (
        <div className="flex items-center justify-center p-12">
          <Loader2 size={24} className="animate-spin text-brand-teal mr-3" />
          <span className="text-sm text-text-muted">Loading schedule...</span>
        </div>
      )}

      {/* ---- Error ---- */}
      {error && !loading && (
        <div className="bg-status-critical/10 border border-status-critical/20 rounded-xl p-6 text-center">
          <AlertCircle size={20} className="mx-auto mb-2 text-status-critical" />
          <p className="text-sm text-status-critical mb-2">{error}</p>
          <button
            onClick={() => fetchScheduleData()}
            className="text-xs text-brand-teal hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ---- Main content ---- */}
      {!loading && !error && (
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* LEFT: Calendar (2/3 width) */}
          <div className="lg:w-2/3 w-full">
            <div className="bg-surface-card border border-border-default rounded-xl p-4 scheduling-calendar">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                events={calendarEvents}
                eventClick={handleEventClick}
                slotMinTime="07:00:00"
                slotMaxTime="19:00:00"
                allDaySlot={true}
                weekends={false}
                height="auto"
                nowIndicator={true}
                editable={false}
                selectable={false}
                dayMaxEvents={3}
                eventDisplay="block"
              />
            </div>
          </div>

          {/* RIGHT: Operative details + quick actions (1/3 width) */}
          <div className="lg:w-1/3 w-full space-y-4">
            {/* Operative Info Card */}
            <div className="bg-surface-card border border-border-default rounded-xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <User size={14} className="text-brand-teal" />
                {selectedOperative ? 'Operative Details' : 'Team Overview'}
              </h3>

              {selectedOperative ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal/30 to-brand-deep/30 flex items-center justify-center text-brand-teal text-sm font-bold ring-1 ring-brand-teal/20">
                      {selectedOperative.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-text-primary">{selectedOperative.name}</div>
                      <div className="text-xs text-text-muted">{selectedOperative.trade}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-surface-elevated rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-brand-teal">{jobsToday}</div>
                      <div className="text-[10px] text-text-muted uppercase tracking-wider">Jobs Today</div>
                    </div>
                    <div className="bg-surface-elevated rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-text-primary">{jobsThisWeek}</div>
                      <div className="text-[10px] text-text-muted uppercase tracking-wider">This Week</div>
                    </div>
                  </div>

                  {selectedOperative.skills.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Skills</div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedOperative.skills.map(skill => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 bg-brand-teal/10 text-brand-teal rounded-full text-[10px] font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface-elevated rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-brand-teal">{operatives.length}</div>
                      <div className="text-[10px] text-text-muted uppercase tracking-wider">Operatives</div>
                    </div>
                    <div className="bg-surface-elevated rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-text-primary">{appointments.length}</div>
                      <div className="text-[10px] text-text-muted uppercase tracking-wider">Appointments</div>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted">Select an operative to view their diary and manage time blocks.</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {selectedOperative && (
              <div className="bg-surface-card border border-border-default rounded-xl p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Briefcase size={14} className="text-brand-teal" /> Quick Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => openDiaryModal('holiday')}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-surface-elevated border border-border-default rounded-lg text-xs text-text-primary hover:bg-surface-hover transition-all"
                  >
                    <Umbrella size={13} className="text-status-warning" /> Add Holiday
                  </button>
                  <button
                    onClick={() => openDiaryModal('training')}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-surface-elevated border border-border-default rounded-lg text-xs text-text-primary hover:bg-surface-hover transition-all"
                  >
                    <BookOpen size={13} className="text-brand-teal" /> Add Training
                  </button>
                  <button
                    onClick={() => openDiaryModal('blocked')}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-surface-elevated border border-border-default rounded-lg text-xs text-text-primary hover:bg-surface-hover transition-all"
                  >
                    <Ban size={13} className="text-status-void" /> Block Time
                  </button>
                </div>
              </div>
            )}

            {/* Today's Appointments */}
            <div className="bg-surface-card border border-border-default rounded-xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Clock size={14} className="text-brand-teal" /> Today's Appointments
              </h3>

              {todaysAppointments.length === 0 ? (
                <div className="text-center py-4">
                  <Calendar size={24} className="mx-auto text-text-muted opacity-30 mb-2" />
                  <p className="text-xs text-text-muted">No appointments today</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {todaysAppointments.map(appt => {
                    const time = appt.start ? new Date(appt.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--:--';
                    return (
                      <button
                        key={appt.id}
                        onClick={() => setSelectedEvent(appt)}
                        className="w-full text-left bg-surface-elevated border border-border-default rounded-lg p-3 hover:bg-surface-hover transition-all"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-text-primary flex items-center gap-1.5">
                            <Clock size={11} className="text-text-muted" /> {time}
                          </span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium ${STATUS_COLORS[appt.status] ?? ''}`}>
                            {appt.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-text-secondary flex items-center gap-1">
                          <MapPin size={10} className="text-text-muted flex-shrink-0" />
                          {safeText(appt.propertyAddress)}
                        </div>
                        <div className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1">
                          <Wrench size={10} className="flex-shrink-0" />
                          {safeText(appt.repairType)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Event Detail */}
            {selectedEvent && (
              <div className="bg-surface-card border border-brand-teal/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-text-primary">Appointment Detail</h3>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-xs text-text-muted hover:text-text-primary"
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Repair Type</span>
                    <span className="text-text-primary font-medium">{safeText(selectedEvent.repairType)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Address</span>
                    <span className="text-text-primary font-medium text-right max-w-[180px]">{safeText(selectedEvent.propertyAddress)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Operative</span>
                    <span className="text-text-primary font-medium">{safeText(selectedEvent.operativeName)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Time</span>
                    <span className="text-text-primary font-medium">
                      {selectedEvent.start ? formatDate(selectedEvent.start) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Status</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[selectedEvent.status] ?? ''}`}>
                      {selectedEvent.status}
                    </span>
                  </div>
                  {selectedEvent.repairId && (
                    <a
                      href={`/repairs/${selectedEvent.repairId}`}
                      className="block mt-2 text-center text-xs text-brand-teal hover:underline"
                    >
                      View Repair &rarr;
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Add Diary Block Modal ---- */}
      <ActionModal
        open={showDiaryModal}
        onClose={() => setShowDiaryModal(false)}
        title={diaryModalTitle}
        description={selectedOperative ? `For ${selectedOperative.name}` : 'Select an operative first'}
        icon={diaryModalIcon}
        fields={diaryFields}
        submitLabel="Save"
        onSubmit={handleCreateDiaryBlock}
      />

      {/* ---- Custom FullCalendar dark theme styles ---- */}
      <style>{`
        .scheduling-calendar .fc {
          --fc-border-color: #2D3748;
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: #161B22;
          --fc-list-event-hover-bg-color: #1C2333;
          --fc-today-bg-color: rgba(25, 176, 146, 0.06);
          --fc-now-indicator-color: #19B092;
          font-family: inherit;
        }
        .scheduling-calendar .fc-theme-standard td,
        .scheduling-calendar .fc-theme-standard th {
          border-color: #2D3748;
        }
        .scheduling-calendar .fc-theme-standard .fc-scrollgrid {
          border-color: #2D3748;
        }
        .scheduling-calendar .fc-col-header-cell {
          background: #161B22;
          padding: 8px 0;
        }
        .scheduling-calendar .fc-col-header-cell-cushion {
          color: #8B949E;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-decoration: none;
        }
        .scheduling-calendar .fc-timegrid-slot-label-cushion,
        .scheduling-calendar .fc-daygrid-day-number {
          color: #6B7B8D;
          font-size: 11px;
          text-decoration: none;
        }
        .scheduling-calendar .fc-daygrid-day-number {
          padding: 4px 8px;
        }
        .scheduling-calendar .fc-button {
          background: #1C2333 !important;
          border-color: #2D3748 !important;
          color: #8B949E !important;
          font-size: 12px !important;
          padding: 4px 10px !important;
          text-transform: capitalize !important;
          box-shadow: none !important;
        }
        .scheduling-calendar .fc-button:hover {
          background: #2D3748 !important;
          color: #E6EDF3 !important;
        }
        .scheduling-calendar .fc-button-active {
          background: #19B092 !important;
          border-color: #19B092 !important;
          color: #fff !important;
        }
        .scheduling-calendar .fc-toolbar-title {
          color: #E6EDF3;
          font-size: 16px;
          font-weight: 600;
        }
        .scheduling-calendar .fc-event {
          border-radius: 4px;
          font-size: 11px;
          padding: 1px 4px;
          cursor: pointer;
        }
        .scheduling-calendar .fc-timegrid-event {
          border-radius: 4px;
        }
        .scheduling-calendar .fc-timegrid-now-indicator-line {
          border-color: #19B092;
          border-width: 2px;
        }
        .scheduling-calendar .fc-timegrid-now-indicator-arrow {
          border-color: #19B092;
          border-top-color: transparent;
          border-bottom-color: transparent;
        }
        .scheduling-calendar .fc-day-today {
          background: rgba(25, 176, 146, 0.04) !important;
        }
        .scheduling-calendar .fc-timegrid-slot {
          height: 40px;
        }
        .scheduling-calendar .fc-scrollgrid-section-header > * {
          border-bottom: none;
        }
        .scheduling-calendar .fc-more-link {
          color: #19B092;
          font-size: 11px;
        }
      `}</style>
    </div>
  );
}
