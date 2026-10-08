import { getCachedAccessToken, setCachedAccessToken } from '../firebase';
import { ClientQuote, LaborShift } from '../types';

export interface GoogleCalendarItem {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
  status?: string;
}

export interface GoogleCalendarListEntry {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole?: string;
}

/**
 * Checks if Google Calendar access token is loaded in memory
 */
export function hasGoogleCalendarToken(): boolean {
  return !!getCachedAccessToken();
}

/**
 * Fetch calendar list for current user
 */
export async function fetchCalendarList(accessToken: string): Promise<GoogleCalendarListEntry[]> {
  const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      setCachedAccessToken(null);
      throw new Error('Google Calendar session expired. Please sign in again with Google.');
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Failed to fetch calendars (${res.status})`);
  }

  const data = await res.json();
  return data.items || [];
}

/**
 * Finds or creates a secondary calendar dedicated to "In The Wind AV Productions"
 */
export async function getOrCreateAVProductionCalendar(
  accessToken: string
): Promise<{ id: string; summary: string; isNew: boolean }> {
  try {
    const list = await fetchCalendarList(accessToken);
    const existing = list.find(
      (c) => c.summary.toLowerCase() === 'in the wind av productions' || c.summary.toLowerCase() === 'in the wind av'
    );
    if (existing) {
      return { id: existing.id, summary: existing.summary, isNew: false };
    }

    // Attempt to create secondary calendar
    const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: 'In The Wind AV Productions',
        description: 'Live show bookings, equipment load-ins, crew shift calls, and venue schedules.',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles',
      }),
    });

    if (createRes.ok) {
      const created = await createRes.json();
      return { id: created.id, summary: created.summary, isNew: true };
    }
  } catch (err) {
    console.warn('Could not create secondary calendar, falling back to primary:', err);
  }

  return { id: 'primary', summary: 'Primary Google Calendar', isNew: false };
}

/**
 * Fetch events from a calendar within a time range
 */
export async function fetchCalendarEvents(
  accessToken: string,
  calendarId: string = 'primary',
  timeMin?: string,
  timeMax?: string
): Promise<GoogleCalendarItem[]> {
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '100');

  if (timeMin) url.searchParams.set('timeMin', timeMin);
  if (timeMax) url.searchParams.set('timeMax', timeMax);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      setCachedAccessToken(null);
      throw new Error('Google Calendar access token expired. Please re-authenticate.');
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Failed to fetch events (${res.status})`);
  }

  const data = await res.json();
  return data.items || [];
}

/**
 * Format a quote into a Google Calendar event payload
 */
export function buildQuoteCalendarEvent(quote: ClientQuote) {
  const startDate = quote.loadInDate || quote.showStartDate || new Date().toISOString().split('T')[0];
  const endDate = quote.strikeDate || quote.showEndDate || startDate;

  // Build clean markdown-style description
  const gearCount = quote.equipmentItems?.length || 0;
  const crewCount = quote.laborItems?.length || 0;
  const description = [
    `🎬 IN THE WIND AV PRODUCTIONS - EVENT DISPATCH`,
    `----------------------------------------------------`,
    `Event: ${quote.eventName}`,
    `Quote #: ${quote.quoteNumber}`,
    `Client: ${quote.clientName} (${quote.clientCompany || 'Direct Client'})`,
    `Contact: ${quote.clientEmail} | ${quote.clientPhone || 'N/A'}`,
    `Venue: ${quote.venueName}`,
    `Address: ${quote.venueAddress || 'See production advance'}`,
    `Status: ${quote.status.toUpperCase()}`,
    ``,
    `📅 SCHEDULE:`,
    `• Load In: ${quote.loadInDate || 'TBD'}`,
    `• Show: ${quote.showStartDate} to ${quote.showEndDate}`,
    `• Strike: ${quote.strikeDate || 'TBD'}`,
    ``,
    `📦 MANIFEST SUMMARY:`,
    `• Equipment lines: ${gearCount} packages allocated`,
    `• Crew members: ${crewCount} call positions booked`,
    quote.clientNotes ? `\nClient Notes: ${quote.clientNotes}` : '',
    quote.internalNotes ? `\nInternal Ops Notes: ${quote.internalNotes}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    summary: `[ITW AV] ${quote.eventName} (${quote.quoteNumber})`,
    location: `${quote.venueName}${quote.venueAddress ? ', ' + quote.venueAddress : ''}`,
    description,
    start: {
      date: startDate,
    },
    end: {
      // Google Calendar all-day event ends are exclusive, so we increment by 1 day if start == end
      date: getNextDay(endDate),
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 24 hours prior
        { method: 'popup', minutes: 120 }, // 2 hours prior
      ],
    },
  };
}

/**
 * Format a labor shift call into a Google Calendar event payload
 */
export function buildShiftCalendarEvent(shift: LaborShift) {
  const startDateTime = `${shift.date}T${shift.startTime || '08:00'}:00`;
  const endDateTime = `${shift.date}T${shift.endTime || '17:00'}:00`;

  const description = [
    `👷 IN THE WIND AV - CREW CALL DISPATCH`,
    `----------------------------------------------------`,
    `Role: ${shift.role}`,
    `Technician: ${shift.staffName}`,
    `Event: ${shift.eventName}`,
    `Call Type: ${shift.callType}`,
    `Call Time: ${shift.startTime} to ${shift.endTime} (${shift.hours} hours scheduled)`,
    `Rate Type: ${shift.rateType} ($${shift.rate}${shift.rateType === 'Hourly' ? '/hr' : '/day'})`,
    `Venue: ${shift.venue || 'Main Stage'}`,
    `Status: ${shift.status.toUpperCase()}`,
    shift.notes ? `\nDispatch Notes: ${shift.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';

  return {
    summary: `[Crew Call] ${shift.role}: ${shift.staffName} @ ${shift.eventName}`,
    location: shift.venue || 'Production Site',
    description,
    start: {
      dateTime: `${startDateTime}`,
      timeZone: tz,
    },
    end: {
      dateTime: `${endDateTime}`,
      timeZone: tz,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 15 },
      ],
    },
  };
}

/**
 * Create an event on Google Calendar
 */
export async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventData: any
): Promise<GoogleCalendarItem> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Failed to create calendar event (${res.status})`);
  }

  return await res.json();
}

/**
 * Delete an event from Google Calendar (Requires User Confirmation!)
 */
export async function deleteCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Failed to delete calendar event (${res.status})`);
  }
}

function getNextDay(dateString: string): string {
  try {
    const d = new Date(dateString + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  } catch {
    return dateString;
  }
}
