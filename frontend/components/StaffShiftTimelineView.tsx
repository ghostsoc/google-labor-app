import React, { useState, useMemo } from 'react';
import { StaffMember, LaborShift } from '../types';
import { ShiftConflict, timeStringToMinutes, formatMinutes } from '../utils/conflictDetection';
import {
  Calendar,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Package,
  Wrench,
  CheckCircle2,
  Users,
} from 'lucide-react';

interface StaffShiftTimelineViewProps {
  shifts: LaborShift[];
  staff: StaffMember[];
  conflicts: ShiftConflict[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onOpenConflictModal: (conflictId?: string) => void;
  onOpenGearModal?: (shift: LaborShift) => void;
}

export const StaffShiftTimelineView: React.FC<StaffShiftTimelineViewProps> = ({
  shifts,
  staff,
  conflicts,
  selectedDate,
  onSelectDate,
  onOpenConflictModal,
  onOpenGearModal,
}) => {
  // Timeline hours from 06:00 (6 AM) to 24:00 (Midnight)
  const startHour = 6;
  const endHour = 24;
  const totalHours = endHour - startHour;

  // Available unique dates that have shifts
  const shiftDates = useMemo(() => {
    const dates = Array.from(new Set(shifts.map((s) => s.date))).sort();
    return dates.length > 0 ? dates : [selectedDate];
  }, [shifts, selectedDate]);

  // Filter shifts on selected date
  const dayShifts = useMemo(() => {
    return shifts.filter((s) => s.date === selectedDate);
  }, [shifts, selectedDate]);

  // Identify staff members who have shifts on this date or are available
  const scheduledStaffIds = useMemo(() => {
    return new Set(dayShifts.map((s) => s.staffId));
  }, [dayShifts]);

  // Map conflicts affecting this specific date
  const dayConflicts = useMemo(() => {
    return conflicts.filter((c) => c.date === selectedDate);
  }, [conflicts, selectedDate]);

  // Set of shift IDs involved in conflicts on this date
  const conflictingShiftIds = useMemo(() => {
    const set = new Set<string>();
    dayConflicts.forEach((c) => {
      set.add(c.shiftA.id);
      set.add(c.shiftB.id);
    });
    return set;
  }, [dayConflicts]);

  const handlePrevDate = () => {
    const idx = shiftDates.indexOf(selectedDate);
    if (idx > 0) {
      onSelectDate(shiftDates[idx - 1]);
    }
  };

  const handleNextDate = () => {
    const idx = shiftDates.indexOf(selectedDate);
    if (idx < shiftDates.length - 1) {
      onSelectDate(shiftDates[idx + 1]);
    }
  };

  // Staff members to show: prioritized by those scheduled, then rest of roster
  const displayStaff = useMemo(() => {
    const active = staff.filter((s) => scheduledStaffIds.has(s.id));
    const others = staff.filter((s) => !scheduledStaffIds.has(s.id));
    return [...active, ...others];
  }, [staff, scheduledStaffIds]);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs space-y-4 p-4">
      {/* Date Header Controls & Conflict Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-1">
            <button
              onClick={handlePrevDate}
              disabled={shiftDates.indexOf(selectedDate) <= 0}
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-2 text-xs font-mono font-bold text-white">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{selectedDate}</span>
            </div>
            <button
              onClick={handleNextDate}
              disabled={shiftDates.indexOf(selectedDate) >= shiftDates.length - 1}
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Date Selector Chips */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto">
            {shiftDates.map((d) => {
              const hasConflictOnDate = conflicts.some((c) => c.date === d);
              return (
                <button
                  key={d}
                  onClick={() => onSelectDate(d)}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded-md border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    selectedDate === d
                      ? 'bg-amber-400 text-neutral-950 font-bold border-amber-400 shadow-xs'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                  }`}
                >
                  <span>{d.slice(5)}</span>
                  {hasConflictOnDate && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Conflict Indicator */}
        <div className="flex items-center gap-2">
          {dayConflicts.length > 0 ? (
            <button
              onClick={() => onOpenConflictModal(dayConflicts[0].id)}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>
                {dayConflicts.length} Conflict{dayConflicts.length > 1 ? 's' : ''} on {selectedDate}
              </span>
              <span className="text-[10px] underline font-mono">Resolve →</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-lg font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>No Conflicts on this Date</span>
            </div>
          )}
        </div>
      </div>

      {/* Visual Gantt Timeline Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[850px] space-y-1">
          {/* Time Ruler (06:00 to 24:00) */}
          <div className="flex items-center text-[10px] font-mono text-neutral-400 border-b border-neutral-800 pb-2">
            <div className="w-48 shrink-0 font-semibold uppercase tracking-wider text-neutral-500 pl-2">
              Technician / Role
            </div>
            <div className="flex-1 grid grid-cols-18 text-center">
              {Array.from({ length: totalHours }).map((_, i) => {
                const hour = startHour + i;
                const formattedHour = `${hour.toString().padStart(2, '0')}:00`;
                return (
                  <div key={hour} className="border-l border-neutral-800/60 first:border-l-0 truncate px-0.5">
                    {formattedHour}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Technician Timeline Rows */}
          <div className="divide-y divide-neutral-800/40">
            {displayStaff.map((member) => {
              const memberShifts = dayShifts.filter((s) => s.staffId === member.id);
              const hasConflict = memberShifts.some((s) => conflictingShiftIds.has(s.id));

              return (
                <div
                  key={member.id}
                  className={`flex items-center py-2.5 hover:bg-neutral-800/20 transition-colors rounded-lg ${
                    hasConflict ? 'bg-rose-950/20 border-l-2 border-rose-500 pl-1' : ''
                  }`}
                >
                  {/* Tech Profile Column */}
                  <div className="w-48 shrink-0 pr-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          hasConflict
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-neutral-800 text-amber-400 border border-neutral-700'
                        }`}
                      >
                        {member.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                          <span>{member.name}</span>
                          {hasConflict && (
                            <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate">{member.role}</div>
                      </div>
                    </div>
                  </div>

                  {/* 18-Hour Timeline Bar Track */}
                  <div className="flex-1 h-10 bg-neutral-950/70 rounded-lg relative overflow-hidden border border-neutral-800/70">
                    {/* Hour grid lines */}
                    <div className="absolute inset-0 grid grid-cols-18 pointer-events-none">
                      {Array.from({ length: totalHours }).map((_, i) => (
                        <div key={i} className="border-r border-neutral-800/40 h-full" />
                      ))}
                    </div>

                    {/* Render member shifts as blocks */}
                    {memberShifts.map((shift) => {
                      const isConflicting = conflictingShiftIds.has(shift.id);

                      const startMin = timeStringToMinutes(shift.startTime);
                      const endMin = timeStringToMinutes(shift.endTime);
                      const normEndMin = endMin < startMin ? endMin + 1440 : endMin;

                      const timelineStartMin = startHour * 60;
                      const timelineEndMin = endHour * 60;
                      const timelineTotalMin = timelineEndMin - timelineStartMin;

                      const leftPercent = Math.max(
                        0,
                        Math.min(100, ((startMin - timelineStartMin) / timelineTotalMin) * 100)
                      );
                      const widthPercent = Math.max(
                        3,
                        Math.min(
                          100 - leftPercent,
                          ((normEndMin - startMin) / timelineTotalMin) * 100
                        )
                      );

                      return (
                        <div
                          key={shift.id}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                          }}
                          className={`absolute top-1 bottom-1 rounded-md px-2 py-0.5 flex flex-col justify-center text-[10px] transition-all group z-10 cursor-pointer overflow-hidden ${
                            isConflicting
                              ? 'bg-rose-900/90 text-rose-100 border-2 border-rose-500 shadow-lg shadow-rose-950/50 animate-pulse'
                              : 'bg-neutral-800 text-amber-300 border border-neutral-700 hover:border-amber-400 hover:bg-neutral-700'
                          }`}
                          onClick={() => {
                            if (isConflicting) {
                              const relatedConflict = dayConflicts.find(
                                (c) => c.shiftA.id === shift.id || c.shiftB.id === shift.id
                              );
                              onOpenConflictModal(relatedConflict?.id);
                            } else if (onOpenGearModal) {
                              onOpenGearModal(shift);
                            }
                          }}
                          title={`${shift.eventName} (${shift.startTime} - ${shift.endTime})\nVenue: ${shift.venue}\n${
                            isConflicting ? '⚠️ TIMELINE CONFLICT DETECTED - CLICK TO RESOLVE' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 leading-tight font-bold truncate">
                            <span className="truncate">{shift.eventName}</span>
                            {isConflicting && (
                              <span className="px-1 py-0.2 bg-rose-950 text-rose-200 border border-rose-600 rounded text-[9px] font-mono shrink-0">
                                CONFLICT
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[9px] opacity-80 font-mono truncate">
                            <span>
                              {shift.startTime}–{shift.endTime} ({shift.hours}h)
                            </span>
                            <span className="truncate">• {shift.venue.split(',')[0]}</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Placeholder when not scheduled */}
                    {memberShifts.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-neutral-600 font-mono">
                        Available / Off Call
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
