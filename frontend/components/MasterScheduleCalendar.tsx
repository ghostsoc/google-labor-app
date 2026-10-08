import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ClientQuote, LaborShift } from '../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Package,
  MapPin,
  ClipboardCheck,
  FileText,
  Plus,
  CheckCircle2,
  AlertCircle,
  Filter,
  ArrowRight,
  ExternalLink,
  CalendarDays,
  List,
  Sparkles,
  Layers,
  X,
  Printer,
} from 'lucide-react';
import { EventDetailModal } from './EventDetailModal';
import { GoogleCalendarSyncModal } from './GoogleCalendarSyncModal';

interface MasterScheduleCalendarProps {
  onOpenNewShift?: (initialDate?: string, eventName?: string) => void;
  onOpenNewQuote?: () => void;
  onOpenEventDetail?: (quote: ClientQuote) => void;
}

export type CalendarViewMode = 'month' | 'week' | 'agenda';
export type CalendarFilterType = 'all' | 'rentals' | 'shifts';

export interface CalendarEventItem {
  id: string;
  type: 'rental' | 'shift';
  date: string; // YYYY-MM-DD
  title: string;
  subtitle: string;
  venue: string;
  badgeText: string;
  status: string;
  rawQuote?: ClientQuote;
  rawShift?: LaborShift;
  milestone?: 'Load-In' | 'Show Day' | 'Strike' | 'Shift';
}

export const MasterScheduleCalendar: React.FC<MasterScheduleCalendarProps> = ({
  onOpenNewShift,
  onOpenNewQuote,
  onOpenEventDetail,
}) => {
  const {
    quotes,
    shifts,
    setActiveTab,
    setSelectedQuoteForPull,
    setActiveQuoteForPrint,
  } = useApp();

  const [selectedEventForModal, setSelectedEventForModal] = useState<ClientQuote | null>(null);
  const [isCalendarSyncOpen, setIsCalendarSyncOpen] = useState(false);
  const [syncTargetQuote, setSyncTargetQuote] = useState<ClientQuote | null>(null);
  const [syncTargetShift, setSyncTargetShift] = useState<LaborShift | null>(null);

  const handleOpenEventDetail = (quote: ClientQuote) => {
    if (onOpenEventDetail) {
      onOpenEventDetail(quote);
    } else {
      setSelectedEventForModal(quote);
    }
  };

  // Initialize view state: default to October 2026 where our active productions & shifts are scheduled
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 9, 2)); // Oct 2, 2026
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [filterType, setFilterType] = useState<CalendarFilterType>('all');
  const [confirmedOnly, setConfirmedOnly] = useState<boolean>(false);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-10-04'); // default selected show load-in date

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleJumpToToday = () => {
    setCurrentDate(new Date(2026, 9, 2));
    setSelectedDateStr('2026-10-04');
  };

  // Helper to format date strings YYYY-MM-DD
  const formatYMD = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to parse YYYY-MM-DD
  const parseYMD = (s: string): Date => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // Aggregate all rental events from QuotesManager into calendar items
  const rentalCalendarItems = useMemo(() => {
    const items: CalendarEventItem[] = [];

    // Filter quotes based on confirmed/approved status
    const targetQuotes = quotes.filter((q) => {
      if (confirmedOnly) {
        return q.status === 'Approved' || q.status === 'Completed';
      }
      return q.status === 'Approved' || q.status === 'Completed' || q.status === 'Sent';
    });

    targetQuotes.forEach((quote) => {
      const isConfirmed = quote.status === 'Approved' || quote.status === 'Completed';

      // 1. Load-In Milestone
      if (quote.loadInDate) {
        items.push({
          id: `${quote.id}-loadin-${quote.loadInDate}`,
          type: 'rental',
          date: quote.loadInDate,
          title: quote.eventName,
          subtitle: `Load-In & Staging (${quote.venueName})`,
          venue: quote.venueName,
          badgeText: 'Load-In',
          status: isConfirmed ? 'Confirmed' : quote.status,
          rawQuote: quote,
          milestone: 'Load-In',
        });
      }

      // 2. Show Dates (can span multiple days)
      if (quote.showStartDate) {
        const start = parseYMD(quote.showStartDate);
        const end = quote.showEndDate ? parseYMD(quote.showEndDate) : start;

        // Iterate through all show days
        const cur = new Date(start);
        let dayCount = 1;
        while (cur <= end) {
          const dateStr = formatYMD(cur);
          // If load-in is on the same date, don't duplicate title or mark as combined
          items.push({
            id: `${quote.id}-show-${dateStr}`,
            type: 'rental',
            date: dateStr,
            title: quote.eventName,
            subtitle: `Show Live Production - Day ${dayCount} (${quote.venueName})`,
            venue: quote.venueName,
            badgeText: 'Show Day',
            status: isConfirmed ? 'Confirmed' : quote.status,
            rawQuote: quote,
            milestone: 'Show Day',
          });
          cur.setDate(cur.getDate() + 1);
          dayCount++;
        }
      }

      // 3. Strike / Load-Out Milestone
      if (quote.strikeDate && quote.strikeDate !== quote.loadInDate) {
        // Only add if not already covered or distinct
        items.push({
          id: `${quote.id}-strike-${quote.strikeDate}`,
          type: 'rental',
          date: quote.strikeDate,
          title: quote.eventName,
          subtitle: `Strike & Truck Pack (${quote.venueName})`,
          venue: quote.venueName,
          badgeText: 'Strike / Out',
          status: isConfirmed ? 'Confirmed' : quote.status,
          rawQuote: quote,
          milestone: 'Strike',
        });
      }
    });

    return items;
  }, [quotes, confirmedOnly]);

  // Aggregate all crew shifts from StaffScheduler into calendar items
  const shiftCalendarItems = useMemo(() => {
    const items: CalendarEventItem[] = [];

    const targetShifts = shifts.filter((s) => {
      if (confirmedOnly) {
        return s.status === 'Confirmed' || s.status === 'Completed';
      }
      return true;
    });

    targetShifts.forEach((shift) => {
      items.push({
        id: `shift-${shift.id}`,
        type: 'shift',
        date: shift.date,
        title: `${shift.role}: ${shift.staffName}`,
        subtitle: `${shift.eventName} · ${shift.startTime} - ${shift.endTime}`,
        venue: shift.venue,
        badgeText: shift.role.split(' ')[0], // e.g. "A1", "L1", "V1"
        status: shift.status,
        rawShift: shift,
        milestone: 'Shift',
      });
    });

    return items;
  }, [shifts, confirmedOnly]);

  // Combined and filtered master list
  const masterCalendarItems = useMemo(() => {
    let combined: CalendarEventItem[] = [];
    if (filterType === 'all') {
      combined = [...rentalCalendarItems, ...shiftCalendarItems];
    } else if (filterType === 'rentals') {
      combined = rentalCalendarItems;
    } else {
      combined = shiftCalendarItems;
    }

    // Sort by date then type
    return combined.sort((a, b) => a.date.localeCompare(b.date));
  }, [rentalCalendarItems, shiftCalendarItems, filterType]);

  // Quick lookup map: date string => items array
  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>();
    masterCalendarItems.forEach((item) => {
      const arr = map.get(item.date) || [];
      arr.push(item);
      map.set(item.date, arr);
    });
    return map;
  }, [masterCalendarItems]);

  // Calendar Month Grid Generator
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    const totalDaysInMonth = lastDay.getDate();

    const days: {
      date: Date;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      items: CalendarEventItem[];
    }[] = [];

    // Leading days from previous month
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      const str = formatYMD(d);
      days.push({
        date: d,
        dateStr: str,
        isCurrentMonth: false,
        isToday: str === '2026-10-02',
        items: itemsByDate.get(str) || [],
      });
    }

    // Current month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(currentYear, currentMonth, day);
      const str = formatYMD(d);
      days.push({
        date: d,
        dateStr: str,
        isCurrentMonth: true,
        isToday: str === '2026-10-02',
        items: itemsByDate.get(str) || [],
      });
    }

    // Trailing days to fill 35 or 42 grid cells
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remainingCells; day++) {
      const d = new Date(currentYear, currentMonth + 1, day);
      const str = formatYMD(d);
      days.push({
        date: d,
        dateStr: str,
        isCurrentMonth: false,
        isToday: str === '2026-10-02',
        items: itemsByDate.get(str) || [],
      });
    }

    return days;
  }, [currentYear, currentMonth, itemsByDate]);

  // Selected Date items & metrics
  const selectedDateItems = useMemo(() => {
    return itemsByDate.get(selectedDateStr) || [];
  }, [itemsByDate, selectedDateStr]);

  const selectedDayRentals = selectedDateItems.filter((i) => i.type === 'rental');
  const selectedDayShifts = selectedDateItems.filter((i) => i.type === 'shift');

  const formattedMonthTitle = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(currentDate);

  const formattedSelectedDate = useMemo(() => {
    if (!selectedDateStr) return '';
    const d = parseYMD(selectedDateStr);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  }, [selectedDateStr]);

  // Month overview metrics
  const monthRentalsCount = useMemo(() => {
    const curMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const seenQuotes = new Set<string>();
    masterCalendarItems
      .filter((i) => i.type === 'rental' && i.date.startsWith(curMonthPrefix) && i.rawQuote)
      .forEach((i) => seenQuotes.add(i.rawQuote!.id));
    return seenQuotes.size;
  }, [masterCalendarItems, currentYear, currentMonth]);

  const monthShiftsCount = useMemo(() => {
    const curMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    return masterCalendarItems.filter(
      (i) => i.type === 'shift' && i.date.startsWith(curMonthPrefix)
    ).length;
  }, [masterCalendarItems, currentYear, currentMonth]);

  const monthCrewHours = useMemo(() => {
    const curMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    return masterCalendarItems
      .filter((i) => i.type === 'shift' && i.date.startsWith(curMonthPrefix) && i.rawShift)
      .reduce((sum, i) => sum + (i.rawShift?.hours || 0), 0);
  }, [masterCalendarItems, currentYear, currentMonth]);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-md">
      {/* Top Header & Master Schedule Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Master Event & Dispatch Schedule</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/60 font-medium">
                  Live Sync
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Aggregated operational calendar of confirmed rental events, load-ins, strikes, and crew shift calls
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher, Filters, and New Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Buttons */}
          <div className="flex items-center bg-neutral-950 p-1 rounded-lg border border-neutral-800">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Agenda</span>
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex items-center bg-neutral-950 p-1 rounded-lg border border-neutral-800">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-amber-400 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setFilterType('rentals')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterType === 'rentals'
                  ? 'bg-amber-400 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Rentals ({rentalCalendarItems.length})
            </button>
            <button
              onClick={() => setFilterType('shifts')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterType === 'shifts'
                  ? 'bg-amber-400 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Crew Shifts ({shiftCalendarItems.length})
            </button>
          </div>

          {/* Confirmed Only Toggle */}
          <button
            onClick={() => setConfirmedOnly(!confirmedOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              confirmedOnly
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
            title="Filter to only show confirmed gigs & shifts"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Confirmed Only</span>
          </button>

          {/* Google Calendar Sync Action */}
          <button
            onClick={() => {
              setSyncTargetQuote(null);
              setSyncTargetShift(null);
              setIsCalendarSyncOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20 transition-all cursor-pointer shadow-xs whitespace-nowrap"
            title="Sync production schedule and crew calls to Google Calendar"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
            <span>Google Calendar Sync</span>
          </button>
        </div>
      </div>

      {/* Month Navigation & Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Date Selector Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleJumpToToday}
              className="px-2.5 py-1 text-xs font-semibold text-neutral-300 hover:text-white rounded hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white">
            {formattedMonthTitle}
          </h3>
        </div>

        {/* Operational Statistics Badges for the Visible Month */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800">
            <Package className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-neutral-400">Productions:</span>
            <span className="font-mono font-bold text-white">{monthRentalsCount} Booked</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-neutral-400">Crew Shifts:</span>
            <span className="font-mono font-bold text-white">{monthShiftsCount} Calls</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-neutral-400">Hours:</span>
            <span className="font-mono font-bold text-white">{monthCrewHours} hrs</span>
          </div>
        </div>
      </div>

      {/* Main Calendar View Area: Month Grid OR Agenda List */}
      {viewMode === 'month' ? (
        <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950/60">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-neutral-800 bg-neutral-900/90 text-center text-xs font-semibold text-neutral-400 py-2.5">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-neutral-800/80">
            {calendarDays.map((dayItem) => {
              const isSelected = selectedDateStr === dayItem.dateStr;
              const hasEvents = dayItem.items.length > 0;
              const rentalEvents = dayItem.items.filter((i) => i.type === 'rental');
              const shiftEvents = dayItem.items.filter((i) => i.type === 'shift');

              return (
                <div
                  key={dayItem.dateStr}
                  onClick={() => setSelectedDateStr(dayItem.dateStr)}
                  className={`min-h-[110px] sm:min-h-[125px] p-1.5 sm:p-2 flex flex-col justify-between transition-all cursor-pointer relative ${
                    !dayItem.isCurrentMonth
                      ? 'bg-neutral-950/40 text-neutral-600'
                      : 'bg-neutral-900/40 hover:bg-neutral-800/40 text-neutral-300'
                  } ${
                    isSelected
                      ? 'ring-2 ring-amber-400 ring-inset bg-amber-500/5'
                      : ''
                  }`}
                >
                  {/* Date Number & Status Indicator */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
                        dayItem.isToday
                          ? 'bg-amber-400 text-neutral-950 font-bold'
                          : isSelected
                          ? 'text-amber-400 font-bold'
                          : dayItem.isCurrentMonth
                          ? 'text-neutral-300'
                          : 'text-neutral-600'
                      }`}
                    >
                      {dayItem.date.getDate()}
                    </span>

                    {/* Indicators */}
                    <div className="flex items-center gap-1">
                      {rentalEvents.length > 0 && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-amber-400"
                          title={`${rentalEvents.length} rental production milestone(s)`}
                        />
                      )}
                      {shiftEvents.length > 0 && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-sky-400"
                          title={`${shiftEvents.length} crew shift(s)`}
                        />
                      )}
                    </div>
                  </div>

                  {/* Event Badges List in Cell */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {/* Rental Milestones (Load-In, Show Day, Strike) */}
                    {rentalEvents.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDateStr(dayItem.dateStr);
                          if (item.rawQuote) {
                            handleOpenEventDetail(item.rawQuote);
                          }
                        }}
                        className="px-1.5 py-0.5 text-[10px] rounded font-medium truncate flex items-center gap-1 bg-amber-950/80 text-amber-200 border border-amber-800/60 hover:bg-amber-900 hover:border-amber-400 transition-colors cursor-pointer"
                        title={`Click to view event details: ${item.title} (${item.milestone})`}
                      >
                        <span className="font-bold text-amber-400 shrink-0">
                          {item.badgeText}:
                        </span>
                        <span className="truncate">{item.title}</span>
                      </div>
                    ))}

                    {/* Crew Shifts */}
                    {shiftEvents.slice(0, 2 - Math.min(2, rentalEvents.length)).map((item) => (
                      <div
                        key={item.id}
                        className="px-1.5 py-0.5 text-[10px] rounded font-medium truncate flex items-center gap-1 bg-sky-950/80 text-sky-200 border border-sky-800/60 hover:bg-sky-900 transition-colors"
                        title={`${item.title} - ${item.subtitle}`}
                      >
                        <span className="font-bold text-sky-400 shrink-0 font-mono">
                          {item.badgeText}
                        </span>
                        <span className="truncate">{item.title.split(': ')[1] || item.title}</span>
                      </div>
                    ))}

                    {/* Overflow count */}
                    {dayItem.items.length > 2 && (
                      <div className="text-[10px] font-mono text-neutral-400 font-semibold px-1">
                        +{dayItem.items.length - 2} more...
                      </div>
                    )}
                  </div>

                  {/* Empty state subtle hover helper */}
                  {!hasEvents && dayItem.isCurrentMonth && (
                    <div className="text-[10px] text-neutral-600 italic opacity-0 hover:opacity-100 transition-opacity">
                      Open date
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Agenda / Timeline View */
        <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950 divide-y divide-neutral-800/70">
          {masterCalendarItems.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">
              <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-neutral-600" />
              <p className="text-sm font-medium text-neutral-300">No scheduled events or shifts match criteria</p>
              <p className="text-xs text-neutral-500 mt-1">Try clearing filters or dispatching new shifts.</p>
            </div>
          ) : (
            masterCalendarItems.map((item) => {
              const isRental = item.type === 'rental';
              const dateObj = parseYMD(item.date);
              const formattedDateStr = new Intl.DateTimeFormat('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              }).format(dateObj);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedDateStr(item.date);
                    if (item.rawQuote) {
                      handleOpenEventDetail(item.rawQuote);
                    }
                  }}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-900/60 transition-colors cursor-pointer ${
                    selectedDateStr === item.date ? 'bg-neutral-900/80 border-l-4 border-l-amber-400' : ''
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Date badge */}
                    <div className="w-16 shrink-0 text-center py-1.5 px-2 bg-neutral-900 border border-neutral-800 rounded-lg">
                      <div className="text-[10px] font-semibold text-neutral-400 uppercase">
                        {formattedDateStr.split(',')[0]}
                      </div>
                      <div className="text-xs font-mono font-bold text-white">
                        {formattedDateStr.split(',')[1]}
                      </div>
                    </div>

                    {/* Icon */}
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isRental
                          ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                          : 'bg-sky-400/10 text-sky-400 border border-sky-400/20'
                      }`}
                    >
                      {isRental ? <Package className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                    </div>

                    {/* Content */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                            isRental
                              ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                              : 'bg-sky-950 text-sky-300 border border-sky-800/80'
                          }`}
                        >
                          {item.badgeText}
                        </span>
                        <h4 className="text-sm font-bold text-white hover:text-amber-300 transition-colors">{item.title}</h4>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">{item.subtitle}</p>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-1 font-mono">
                        <MapPin className="w-3 h-3 text-neutral-400" />
                        <span>{item.venue}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                        item.status === 'Confirmed' || item.status === 'Approved'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {item.status}
                    </span>

                    {item.rawQuote && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEventDetail(item.rawQuote!);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-amber-300 hover:text-neutral-950 bg-amber-400/10 hover:bg-amber-400 rounded border border-amber-400/30 transition-colors cursor-pointer"
                          title="Open Event Details page"
                        >
                          Event Details
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedQuoteForPull(item.rawQuote!);
                            setActiveTab('pullsheet');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700 transition-colors cursor-pointer"
                          title="Open Pull Sheet for this quote"
                        >
                          Pull Sheet
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Selected Day Master Schedule Inspector Panel */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
          <div>
            <div className="text-xs font-mono text-amber-400 flex items-center gap-2">
              <span>DAY SCHEDULE MANIFEST</span>
              <span>·</span>
              <span>{selectedDateStr}</span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              {formattedSelectedDate}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onOpenNewShift) {
                  onOpenNewShift(selectedDateStr, selectedDayRentals[0]?.title);
                } else {
                  setActiveTab('staff');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Dispatch Shift for This Date</span>
            </button>
          </div>
        </div>

        {/* Day Items Content */}
        {selectedDateItems.length === 0 ? (
          <div className="py-8 text-center text-neutral-400">
            <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
            <p className="text-sm font-medium text-neutral-300">No scheduled gigs or shifts on this date</p>
            <p className="text-xs text-neutral-400 mt-1">
              Select another calendar day or click above to dispatch a crew shift.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Section 1: Confirmed AV Production Milestones */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                  <span>AV Rental Events ({selectedDayRentals.length})</span>
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  {selectedDayRentals.length > 0 ? 'Active Staging' : 'None scheduled'}
                </span>
              </div>

              {selectedDayRentals.length === 0 ? (
                <div className="p-4 bg-neutral-900/60 border border-neutral-800/80 rounded-lg text-xs text-neutral-400 text-center">
                  No rental production milestones (load-in/show/strike) on this day.
                </div>
              ) : (
                selectedDayRentals.map((rental) => {
                  const quote = rental.rawQuote;
                  if (!quote) return null;
                  const totalUnits = quote.equipmentItems.reduce((sum, eq) => sum + eq.quantity, 0);

                  return (
                    <div
                      key={rental.id}
                      onClick={() => handleOpenEventDetail(quote)}
                      className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg space-y-3 hover:border-amber-400/60 hover:bg-neutral-900/90 transition-all cursor-pointer group shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-amber-950 text-amber-300 border border-amber-800/80 uppercase">
                              {rental.milestone}
                            </span>
                            <span className="text-xs font-mono text-neutral-400">
                              {quote.quoteNumber}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1.5 group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                            <span>{quote.eventName}</span>
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-amber-400" />
                          </h4>
                          <p className="text-xs text-neutral-300 mt-0.5">{quote.clientCompany}</p>
                        </div>

                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            quote.status === 'Approved' || quote.status === 'Completed'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {quote.status}
                        </span>
                      </div>

                      <div className="text-xs text-neutral-400 space-y-1 bg-neutral-950/70 p-2.5 rounded border border-neutral-800/70 font-mono">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="truncate">{quote.venueName}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-800/60">
                          <span>
                            Dates: {quote.loadInDate} → {quote.strikeDate}
                          </span>
                          <span className="text-amber-400 font-bold">
                            {totalUnits} gear units
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEventDetail(quote);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:text-neutral-950 bg-amber-400/10 hover:bg-amber-400 rounded-lg border border-amber-400/30 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Event Details →</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedQuoteForPull(quote);
                            setActiveTab('pullsheet');
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          <span>Pull Sheet</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveQuoteForPrint(quote);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Section 2: Dispatched Crew Shifts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  <span>Crew Shifts & Technicians ({selectedDayShifts.length})</span>
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  {selectedDayShifts.reduce((acc, s) => acc + (s.rawShift?.hours || 0), 0)} Total Hours
                </span>
              </div>

              {selectedDayShifts.length === 0 ? (
                <div className="p-4 bg-neutral-900/60 border border-neutral-800/80 rounded-lg text-xs text-neutral-400 text-center">
                  No technician shifts dispatched for this date.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {selectedDayShifts.map((shiftItem) => {
                    const shift = shiftItem.rawShift;
                    if (!shift) return null;

                    return (
                      <div
                        key={shift.id}
                        className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-between gap-3 hover:border-neutral-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-amber-400">
                            {shift.staffName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">
                                {shift.staffName}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-amber-400 font-semibold border border-neutral-700">
                                {shift.role}
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-400 mt-0.5">
                              {shift.callType} · {shift.startTime} - {shift.endTime} ({shift.hours}h)
                            </div>
                            {shift.notes && (
                              <div className="text-[10px] text-neutral-400 italic mt-0.5 line-clamp-1">
                                {shift.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              shift.status === 'Confirmed'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                                : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                            }`}
                          >
                            {shift.status}
                          </span>
                          <div className="text-xs font-mono font-medium text-neutral-300 mt-1 tabular-nums">
                            ${shift.rate}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Event Details Comprehensive Modal */}
      {selectedEventForModal && (
        <EventDetailModal
          quote={selectedEventForModal}
          isOpen={!!selectedEventForModal}
          onClose={() => setSelectedEventForModal(null)}
        />
      )}

      {/* Google Calendar Sync Modal */}
      <GoogleCalendarSyncModal
        isOpen={isCalendarSyncOpen}
        onClose={() => {
          setIsCalendarSyncOpen(false);
          setSyncTargetQuote(null);
          setSyncTargetShift(null);
        }}
        targetQuote={syncTargetQuote}
        targetShift={syncTargetShift}
      />
    </div>
  );
};
