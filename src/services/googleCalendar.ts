import { CalendarEvent } from '../types';

export interface GoogleCalendarEventItem {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
}

// Fetch events from Primary Google Calendar
export async function fetchGoogleCalendarEvents(
  accessToken: string,
  timeMin?: string,
  timeMax?: string
): Promise<CalendarEvent[]> {
  const min = timeMin || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const max = timeMax || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    min
  )}&timeMax=${encodeURIComponent(max)}&singleEvents=true&orderBy=startTime&maxResults=100`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Calendar API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const items: GoogleCalendarEventItem[] = data.items || [];

  return items.map(item => {
    // Determine date and time
    let dateStr = '';
    let startTimeStr = '09:00';
    let endTimeStr = '10:00';

    if (item.start?.dateTime) {
      const startDate = new Date(item.start.dateTime);
      dateStr = startDate.toISOString().split('T')[0];
      const hours = String(startDate.getHours()).padStart(2, '0');
      const mins = String(startDate.getMinutes()).padStart(2, '0');
      startTimeStr = `${hours}:${mins}`;
    } else if (item.start?.date) {
      dateStr = item.start.date;
      startTimeStr = '09:00';
    }

    if (item.end?.dateTime) {
      const endDate = new Date(item.end.dateTime);
      const hours = String(endDate.getHours()).padStart(2, '0');
      const mins = String(endDate.getMinutes()).padStart(2, '0');
      endTimeStr = `${hours}:${mins}`;
    } else if (item.end?.date) {
      endTimeStr = '18:00';
    }

    return {
      id: `gcal-${item.id}`,
      title: item.summary || 'গুগল ক্যালেন্ডার ইভেন্ট',
      description: item.description || '',
      date: dateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
      location: item.location || '',
      type: 'meeting',
      color: '#0284c7', // Sky blue for Google Calendar
    };
  });
}

// Push a new event to Google Calendar
export async function createGoogleCalendarEvent(
  accessToken: string,
  event: {
    title: string;
    description?: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    location?: string;
  }
): Promise<{ id: string; htmlLink?: string }> {
  // Construct RFC3339 datetime strings
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka';
  const startDateTime = `${event.date}T${event.startTime}:00`;
  const endDateTime = `${event.date}T${event.endTime}:00`;

  const body = {
    summary: event.title,
    description: event.description || 'Created from Kroma Productivity Studio',
    location: event.location,
    start: {
      dateTime: new Date(startDateTime).toISOString(),
      timeZone,
    },
    end: {
      dateTime: new Date(endDateTime).toISOString(),
      timeZone,
    },
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Calendar create error (${res.status}): ${errorText}`);
  }

  return await res.json();
}

// Delete an event from Google Calendar
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  googleEventId: string
): Promise<void> {
  const cleanId = googleEventId.replace(/^gcal-/, '');
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(cleanId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const errorText = await res.text();
    throw new Error(`Google Calendar delete error (${res.status}): ${errorText}`);
  }
}
