import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Clock,
  MapPin,
  Users,
  ShieldAlert,
  ArrowRight,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  fetchCalendarList,
  getOrCreateAVProductionCalendar,
  fetchCalendarEvents,
  buildQuoteCalendarEvent,
  buildShiftCalendarEvent,
  createCalendarEvent,
  deleteCalendarEvent,
  GoogleCalendarListEntry,
  GoogleCalendarItem,
} from '../services/calendarService';
import { ClientQuote, LaborShift } from '../types';

interface GoogleCalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetQuote?: ClientQuote | null;
  targetShift?: LaborShift | null;
}

export const GoogleCalendarSyncModal: React.FC<GoogleCalendarSyncModalProps> = ({
  isOpen,
  onClose,
  targetQuote,
  targetShift,
}) => {
  const {
    quotes,
    shifts,
    googleCalendarToken,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    userHasPermission,
    activeRole,
  } = useApp();

  const [isLoading, setIsLoading] = useState(false);
  const [calendars, setCalendars] = useState<GoogleCalendarListEntry[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('primary');
  const [avCalendarName, setAvCalendarName] = useState<string>('');
  const [existingEvents, setExistingEvents] = useState<GoogleCalendarItem[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Destructive / Mutating Operation User Confirmation Dialog State
  const [pendingAction, setPendingAction] = useState<{
    type: 'create_quote' | 'create_shift' | 'batch_sync' | 'delete_event';
    title: string;
    description: string;
    data?: any;
  } | null>(null);

  // Load calendars when token is available
  useEffect(() => {
    if (isOpen && googleCalendarToken) {
      loadCalendarsAndEvents();
    }
  }, [isOpen, googleCalendarToken]);

  const loadCalendarsAndEvents = async () => {
    if (!googleCalendarToken) return;
    setIsLoading(true);
    setStatusMessage(null);
    try {
      // 1. Fetch available calendars
      const calList = await fetchCalendarList(googleCalendarToken);
      setCalendars(calList);

      // 2. Locate or create dedicated AV Productions calendar
      const avCal = await getOrCreateAVProductionCalendar(googleCalendarToken);
      setSelectedCalendarId(avCal.id);
      setAvCalendarName(avCal.summary);

      // 3. Fetch upcoming events for preview
      const events = await fetchCalendarEvents(googleCalendarToken, avCal.id);
      setExistingEvents(events);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to load Google Calendar data.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Handle Google OAuth authorization
  const handleConnect = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const token = await connectGoogleCalendar();
      if (token) {
        setStatusMessage({
          type: 'success',
          text: 'Connected to Google Calendar successfully.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Google Calendar connection was cancelled or failed.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Confirmation for Syncing Target Quote
  const requestSyncQuote = (quote: ClientQuote) => {
    setPendingAction({
      type: 'create_quote',
      title: `Sync "${quote.eventName}" to Google Calendar?`,
      description: `This will create an event on your Google Calendar (${avCalendarName || 'selected calendar'}) with venue directions, schedule times (${quote.loadInDate || quote.showStartDate} - ${quote.strikeDate || quote.showEndDate}), and equipment manifest notes.`,
      data: quote,
    });
  };

  // Trigger Confirmation for Syncing Target Shift
  const requestSyncShift = (shift: LaborShift) => {
    setPendingAction({
      type: 'create_shift',
      title: `Add Crew Call "${shift.role}: ${shift.staffName}" to Google Calendar?`,
      description: `This will add a dispatched crew call event on ${shift.date} (${shift.startTime} - ${shift.endTime}) with venue details and shift notes.`,
      data: shift,
    });
  };

  // Trigger Confirmation for Batch Sync
  const requestBatchSync = () => {
    const activeQuotes = quotes.filter((q) => q.status === 'Approved' || q.status === 'Sent');
    const confirmedShifts = shifts.filter((s) => s.status === 'Confirmed' || s.status === 'Offered');
    setPendingAction({
      type: 'batch_sync',
      title: `Batch Sync ${activeQuotes.length} Shows and ${confirmedShifts.length} Shifts to Google Calendar?`,
      description: `This will create ${activeQuotes.length + confirmedShifts.length} total calendar entries across the selected calendar. Existing identical events may be duplicated if previously added.`,
      data: { quotes: activeQuotes, shifts: confirmedShifts },
    });
  };

  // Trigger Confirmation for Deleting Calendar Event
  const requestDeleteEvent = (event: GoogleCalendarItem) => {
    setPendingAction({
      type: 'delete_event',
      title: `Delete Calendar Event "${event.summary}"?`,
      description: `Are you sure you want to permanently delete this event from your Google Calendar? This action cannot be undone.`,
      data: event,
    });
  };

  // Execute Confirmed Operation
  const executeConfirmedAction = async () => {
    if (!pendingAction || !googleCalendarToken) return;
    setIsLoading(true);
    setStatusMessage(null);

    try {
      if (pendingAction.type === 'create_quote') {
        const payload = buildQuoteCalendarEvent(pendingAction.data);
        const created = await createCalendarEvent(googleCalendarToken, selectedCalendarId, payload);
        setStatusMessage({
          type: 'success',
          text: `Successfully synced "${pendingAction.data.eventName}" to Google Calendar!`,
        });
        setExistingEvents((prev) => [created, ...prev]);
      } else if (pendingAction.type === 'create_shift') {
        const payload = buildShiftCalendarEvent(pendingAction.data);
        const created = await createCalendarEvent(googleCalendarToken, selectedCalendarId, payload);
        setStatusMessage({
          type: 'success',
          text: `Successfully added call for ${pendingAction.data.staffName} (${pendingAction.data.role}) to Google Calendar!`,
        });
        setExistingEvents((prev) => [created, ...prev]);
      } else if (pendingAction.type === 'batch_sync') {
        const { quotes: qList, shifts: sList } = pendingAction.data;
        let syncedCount = 0;

        for (const q of qList) {
          const p = buildQuoteCalendarEvent(q);
          await createCalendarEvent(googleCalendarToken, selectedCalendarId, p);
          syncedCount++;
        }
        for (const s of sList) {
          const p = buildShiftCalendarEvent(s);
          await createCalendarEvent(googleCalendarToken, selectedCalendarId, p);
          syncedCount++;
        }

        setStatusMessage({
          type: 'success',
          text: `Batch synced ${syncedCount} production events and crew calls to Google Calendar!`,
        });
        // Refresh event list
        const updated = await fetchCalendarEvents(googleCalendarToken, selectedCalendarId);
        setExistingEvents(updated);
      } else if (pendingAction.type === 'delete_event') {
        await deleteCalendarEvent(googleCalendarToken, selectedCalendarId, pendingAction.data.id);
        setStatusMessage({
          type: 'success',
          text: `Event "${pendingAction.data.summary}" removed from Google Calendar.`,
        });
        setExistingEvents((prev) => prev.filter((e) => e.id !== pendingAction.data.id));
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Calendar operation failed.',
      });
    } finally {
      setIsLoading(false);
      setPendingAction(null);
    }
  };

  const activeShowsCount = quotes.filter((q) => q.status === 'Approved' || q.status === 'Sent').length;
  const activeShiftsCount = shifts.filter((s) => s.status === 'Confirmed' || s.status === 'Offered').length;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Google Calendar Integration</h2>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Sync live production shows, venue load-ins, and crew shift calls directly to your calendar.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white cursor-pointer p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                : 'bg-sky-950/30 border-sky-500/40 text-sky-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-sky-400 mt-0.5" />
            )}
            <span className="flex-1">{statusMessage.text}</span>
          </div>
        )}

        {/* Connection State */}
        {!googleCalendarToken ? (
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Connect Google Calendar</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                Authorize Google Calendar to synchronize scheduled AV shows, load-in calls, and crew shift assignments with your devices.
              </p>
            </div>
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-100 hover:bg-white text-neutral-900 font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-neutral-900" />
              ) : (
                <Calendar className="w-4 h-4 text-neutral-900" />
              )}
              <span>Sign in with Google Calendar</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connected Bar */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-white">Connected to Google Calendar</span>
                <span className="text-neutral-500 font-mono text-[11px]">|</span>
                <span className="text-neutral-400">Target:</span>
                <span className="font-mono text-amber-400 font-medium">
                  {avCalendarName || 'In The Wind AV Productions'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadCalendarsAndEvents}
                  disabled={isLoading}
                  title="Refresh calendar events"
                  className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={disconnectGoogleCalendar}
                  className="text-neutral-500 hover:text-rose-400 text-[11px] underline cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            </div>

            {/* Targeted Quick Sync Cards */}
            {targetQuote && (
              <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider font-semibold">
                    Specific Show Selected
                  </span>
                  <span className="text-xs text-neutral-400">
                    {targetQuote.loadInDate || targetQuote.showStartDate} - {targetQuote.strikeDate || targetQuote.showEndDate}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{targetQuote.eventName}</h4>
                <div className="flex items-center gap-4 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                    {targetQuote.venueName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-neutral-500" />
                    {targetQuote.laborItems?.length || 0} crew calls
                  </span>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => requestSyncQuote(targetQuote)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Sync This Show to Google Calendar</span>
                  </button>
                </div>
              </div>
            )}

            {targetShift && (
              <div className="bg-sky-400/5 border border-sky-400/20 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-sky-400 uppercase tracking-wider font-semibold">
                    Specific Crew Call Selected
                  </span>
                  <span className="text-xs text-neutral-400">{targetShift.date}</span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  {targetShift.role}: {targetShift.staffName}
                </h4>
                <div className="flex items-center gap-4 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    {targetShift.startTime} - {targetShift.endTime} ({targetShift.hours} hrs)
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                    {targetShift.venue || 'Main Stage'}
                  </span>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => requestSyncShift(targetShift)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-1.5 bg-sky-400 hover:bg-sky-300 text-neutral-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Sync This Shift to Google Calendar</span>
                  </button>
                </div>
              </div>
            )}

            {/* Batch Sync Action */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-white">Batch Sync All Active Shows & Shifts</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Push {activeShowsCount} approved/sent events and {activeShiftsCount} confirmed shifts to Google Calendar.
                </p>
              </div>
              <button
                onClick={requestBatchSync}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-lg border border-neutral-700 transition-colors cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Batch Sync to Google Calendar</span>
              </button>
            </div>

            {/* Upcoming Calendar Events Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold px-1">
                <span>Current Events on Google Calendar ({existingEvents.length})</span>
                <span className="text-[11px] text-neutral-500 font-normal">Real-time sync</span>
              </div>

              {existingEvents.length === 0 ? (
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center text-xs text-neutral-500">
                  No upcoming events found on this calendar. Click &quot;Batch Sync&quot; above to push production dates.
                </div>
              ) : (
                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                  {existingEvents.slice(0, 10).map((evt) => {
                    const startStr = evt.start.dateTime
                      ? new Date(evt.start.dateTime).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : evt.start.date || 'TBD';

                    return (
                      <div
                        key={evt.id}
                        className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/80 flex items-center justify-between gap-3 text-xs hover:border-neutral-700 transition-all"
                      >
                        <div className="truncate flex-1">
                          <div className="font-semibold text-white truncate">{evt.summary}</div>
                          <div className="text-[11px] text-neutral-400 flex items-center gap-2 truncate mt-0.5">
                            <span className="font-mono text-amber-400/80">{startStr}</span>
                            {evt.location && <span className="truncate">· {evt.location}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {evt.htmlLink && (
                            <a
                              href={evt.htmlLink}
                              target="_blank"
                              rel="noreferrer"
                              title="Open in Google Calendar"
                              className="p-1 text-neutral-400 hover:text-sky-400 rounded transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => requestDeleteEvent(evt)}
                            title="Delete from Google Calendar"
                            className="p-1 text-neutral-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Confirmation Dialog for Destructive / Mutating Operations (MANDATORY REQUIREMENT) */}
        {pendingAction && (
          <div className="fixed inset-0 z-60 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{pendingAction.title}</h3>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    {pendingAction.description}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 font-mono">
                Target: {avCalendarName || 'In The Wind AV Productions (Google Calendar)'}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setPendingAction(null)}
                  disabled={isLoading}
                  className="px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeConfirmedAction}
                  disabled={isLoading}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    pendingAction.type === 'delete_event'
                      ? 'bg-rose-500 hover:bg-rose-600 text-white'
                      : 'bg-amber-400 hover:bg-amber-300 text-neutral-950'
                  }`}
                >
                  {isLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>{pendingAction.type === 'delete_event' ? 'Confirm Deletion' : 'Confirm & Sync'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-xs">
          <span className="text-neutral-500 text-[11px]">
            Active Role: <span className="text-amber-400 font-mono">{activeRole}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
