import { LaborShift, StaffMember } from '../types';

export interface ShiftConflict {
  id: string;
  type: 'direct_overlap' | 'tight_turnaround' | 'excessive_hours';
  severity: 'error' | 'warning';
  staffId: string;
  staffName: string;
  role: string;
  date: string;
  shiftA: LaborShift;
  shiftB: LaborShift;
  overlapMinutes?: number;
  gapMinutes?: number;
  totalDailyHours?: number;
  title: string;
  description: string;
  recommendation: string;
}

/**
 * Converts "HH:MM" string into minutes from 00:00.
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  return h * 60 + m;
}

/**
 * Format minutes into readable duration like "2h 30m".
 */
export function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Scans all shifts and identifies timeline conflicts:
 * 1. Direct Time Overlaps (same technician booked for overlapping time windows on the same date)
 * 2. Tight Turnaround / Transit conflicts (less than 45 min transit gap between different venues on the same date)
 * 3. Excessive Daily Hours (> 14 total hours scheduled for the same tech in a single date)
 */
export function detectLaborShiftConflicts(shifts: LaborShift[]): ShiftConflict[] {
  const conflicts: ShiftConflict[] = [];
  const processedPairs = new Set<string>();

  // Group shifts by staffId or staffName and date
  const shiftsByStaffAndDate = new Map<string, LaborShift[]>();

  for (const shift of shifts) {
    if (!shift.staffId && !shift.staffName) continue;
    // Key by staff identifier + date
    const techKey = `${shift.staffId || shift.staffName}:::${shift.date}`;
    if (!shiftsByStaffAndDate.has(techKey)) {
      shiftsByStaffAndDate.set(techKey, []);
    }
    shiftsByStaffAndDate.get(techKey)!.push(shift);
  }

  // Evaluate conflicts within each staff member's day
  for (const [, dayShifts] of shiftsByStaffAndDate.entries()) {
    if (dayShifts.length < 2) continue;

    // Check every pair
    for (let i = 0; i < dayShifts.length; i++) {
      for (let j = i + 1; j < dayShifts.length; j++) {
        const shiftA = dayShifts[i];
        const shiftB = dayShifts[j];

        // Ensure pair uniqueness
        const pairKey = [shiftA.id, shiftB.id].sort().join('___');
        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);

        const startA = timeStringToMinutes(shiftA.startTime);
        const endA = timeStringToMinutes(shiftA.endTime);
        const startB = timeStringToMinutes(shiftB.startTime);
        const endB = timeStringToMinutes(shiftB.endTime);

        // Normalize overnight shifts if end < start
        const normEndA = endA < startA ? endA + 1440 : endA;
        const normEndB = endB < startB ? endB + 1440 : endB;

        // Check for direct overlap: max(startA, startB) < min(normEndA, normEndB)
        const overlapStart = Math.max(startA, startB);
        const overlapEnd = Math.min(normEndA, normEndB);
        const overlapDuration = overlapEnd - overlapStart;

        if (overlapDuration > 0) {
          conflicts.push({
            id: `conflict-overlap-${pairKey}`,
            type: 'direct_overlap',
            severity: 'error',
            staffId: shiftA.staffId,
            staffName: shiftA.staffName,
            role: shiftA.role,
            date: shiftA.date,
            shiftA,
            shiftB,
            overlapMinutes: overlapDuration,
            title: `Double-Booking: Direct Overlap (${formatMinutes(overlapDuration)})`,
            description: `${shiftA.staffName} is simultaneously scheduled for "${shiftA.eventName}" (${shiftA.startTime}–${shiftA.endTime}) and "${shiftB.eventName}" (${shiftB.startTime}–${shiftB.endTime}) with an active overlap of ${formatMinutes(overlapDuration)}.`,
            recommendation: `Reassign one shift to another available crew technician or adjust call time windows to eliminate overlap.`,
          });
          continue; // Prioritize direct overlap over transit warning
        }

        // If not directly overlapping, check if different venues with < 45 min transit gap
        const venuesAreDifferent =
          shiftA.venue &&
          shiftB.venue &&
          shiftA.venue.trim().toLowerCase() !== shiftB.venue.trim().toLowerCase();

        if (venuesAreDifferent) {
          // Gap between end of earlier shift and start of later shift
          let gap = 0;
          if (normEndA <= startB) {
            gap = startB - normEndA;
          } else if (normEndB <= startA) {
            gap = startA - normEndB;
          }

          if (gap >= 0 && gap < 45) {
            conflicts.push({
              id: `conflict-transit-${pairKey}`,
              type: 'tight_turnaround',
              severity: 'warning',
              staffId: shiftA.staffId,
              staffName: shiftA.staffName,
              role: shiftA.role,
              date: shiftA.date,
              shiftA,
              shiftB,
              gapMinutes: gap,
              title: `Tight Venue Transit Window (${gap} min gap)`,
              description: `${shiftA.staffName} has only ${gap} minutes to transit between "${shiftA.venue}" and "${shiftB.venue}". Live event traffic may cause call time delay.`,
              recommendation: `Allow at least 45 to 60 minutes travel buffer between distinct production venues.`,
            });
          }
        }
      }
    }

    // Check total hours on this single date
    const totalHours = dayShifts.reduce((sum, s) => sum + (s.hours || 0), 0);
    if (totalHours > 14) {
      const firstShift = dayShifts[0];
      const secondShift = dayShifts[1];
      const fatigueKey = `fatigue-${firstShift.staffId}-${firstShift.date}`;
      if (!processedPairs.has(fatigueKey)) {
        processedPairs.add(fatigueKey);
        conflicts.push({
          id: `conflict-hours-${fatigueKey}`,
          type: 'excessive_hours',
          severity: 'warning',
          staffId: firstShift.staffId,
          staffName: firstShift.staffName,
          role: firstShift.role,
          date: firstShift.date,
          shiftA: firstShift,
          shiftB: secondShift,
          totalDailyHours: totalHours,
          title: `Fatigue Alert: Excessive Daily Call Time (${totalHours}h)`,
          description: `${firstShift.staffName} is scheduled for ${totalHours} total labor hours on ${firstShift.date} across ${dayShifts.length} shifts, exceeding safe labor and OSHA limits.`,
          recommendation: `Split shifts across relief technicians to prevent operator fatigue and safety violations.`,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Checks if a specific proposed shift conflicts with any existing shifts.
 * Useful for real-time validation in the Dispatch Modal.
 */
export function checkProposedShiftConflict(
  proposed: {
    staffId: string;
    staffName?: string;
    date: string;
    startTime: string;
    endTime: string;
    venue?: string;
    id?: string;
  },
  existingShifts: LaborShift[],
  ignoreShiftId?: string
): ShiftConflict | null {
  if (!proposed.staffId && !proposed.staffName) return null;
  if (!proposed.date || !proposed.startTime || !proposed.endTime) return null;

  const startProp = timeStringToMinutes(proposed.startTime);
  const endProp = timeStringToMinutes(proposed.endTime);
  const normEndProp = endProp < startProp ? endProp + 1440 : endProp;

  const matchingShifts = existingShifts.filter(
    (s) =>
      s.id !== (ignoreShiftId || proposed.id) &&
      (s.staffId === proposed.staffId || (proposed.staffName && s.staffName === proposed.staffName)) &&
      s.date === proposed.date
  );

  for (const existing of matchingShifts) {
    const startExist = timeStringToMinutes(existing.startTime);
    const endExist = timeStringToMinutes(existing.endTime);
    const normEndExist = endExist < startExist ? endExist + 1440 : endExist;

    const overlapStart = Math.max(startProp, startExist);
    const overlapEnd = Math.min(normEndProp, normEndExist);
    const overlapDuration = overlapEnd - overlapStart;

    if (overlapDuration > 0) {
      return {
        id: `proposed-conflict-${existing.id}`,
        type: 'direct_overlap',
        severity: 'error',
        staffId: proposed.staffId,
        staffName: proposed.staffName || existing.staffName,
        role: existing.role,
        date: proposed.date,
        shiftA: existing,
        shiftB: {
          ...existing,
          eventName: 'New Dispatched Shift',
          startTime: proposed.startTime,
          endTime: proposed.endTime,
          venue: proposed.venue || '',
        },
        overlapMinutes: overlapDuration,
        title: `Direct Conflict: Overlaps by ${formatMinutes(overlapDuration)}`,
        description: `${existing.staffName} is already booked on ${proposed.date} from ${existing.startTime} to ${existing.endTime} for "${existing.eventName}" at ${existing.venue}.`,
        recommendation: `Select another technician or adjust start/end times to avoid overlapping call time.`,
      };
    }
  }

  return null;
}
