/**
 * iCal parsing utilities. Fetches an .ics URL, parses VEVENTs via ical.js,
 * filters down to the requested date, and extracts the bits we need for
 * research (title, attendees, company hints, organiser).
 *
 * Net assumption: the URL is public (Google/Apple/Office "Secret address
 * in iCal format"). We do not handle CalDAV here — out of scope for MVP.
 */

import ICAL from "ical.js";

export interface CalendarEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  startsAt: Date;
  endsAt: Date;
  organizer?: string;
  attendees: string[];
  /** Domains derived from attendee emails — first guess for company. */
  attendeeDomains: string[];
}

export interface FetchIcalResult {
  events: CalendarEvent[];
  ok: true;
}

export interface FetchIcalError {
  ok: false;
  error: string;
}

const MAX_BYTES = 4 * 1024 * 1024; // 4MB safety cap on .ics payload

export async function fetchIcal(url: string): Promise<FetchIcalResult | FetchIcalError> {
  if (!/^https?:\/\//i.test(url)) {
    return { ok: false, error: "URL muss mit http:// oder https:// beginnen." };
  }

  let res: Response;
  try {
    res = await fetch(url, {
      // .ics endpoints sometimes 404 with non-text/calendar accept
      headers: { Accept: "text/calendar, text/plain, */*" },
      // Don't cache — calendars move
      cache: "no-store",
      // 8s soft cap
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? `Kalender nicht erreichbar: ${err.message}` : "Kalender nicht erreichbar.",
    };
  }

  if (!res.ok) {
    return { ok: false, error: `Kalender antwortet mit ${res.status}.` };
  }

  // Reject anything not text-ish to avoid choking on HTML error pages
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("html")) {
    return { ok: false, error: "URL liefert HTML statt iCal. Pruefe den geheimen iCal-Link." };
  }

  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) {
    return { ok: false, error: "Kalender ist zu gross (>4MB). Schraenke den Sichtbarkeitszeitraum ein." };
  }

  const text = new TextDecoder("utf-8").decode(buf);
  if (!text.includes("BEGIN:VCALENDAR")) {
    return { ok: false, error: "Inhalt sieht nicht wie ein iCal-Kalender aus." };
  }

  try {
    const jcal = ICAL.parse(text);
    const comp = new ICAL.Component(jcal);
    const vevents = comp.getAllSubcomponents("vevent");
    const events: CalendarEvent[] = vevents.map((v) => buildEvent(v));
    return { ok: true, events };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? `iCal-Parsing fehlgeschlagen: ${err.message}` : "iCal-Parsing fehlgeschlagen.",
    };
  }
}

function buildEvent(v: ICAL.Component): CalendarEvent {
  const event = new ICAL.Event(v);
  const attendeesProps = v.getAllProperties("attendee");
  const attendees: string[] = [];

  for (const p of attendeesProps) {
    const val = p.getFirstValue();
    if (typeof val === "string") {
      attendees.push(val.replace(/^mailto:/i, "").trim());
    }
  }

  const organizerProp = v.getFirstProperty("organizer");
  const organizer = organizerProp
    ? String(organizerProp.getFirstValue()).replace(/^mailto:/i, "").trim()
    : undefined;

  const startsAt = event.startDate.toJSDate();
  const endsAt = event.endDate ? event.endDate.toJSDate() : new Date(startsAt.getTime() + 30 * 60_000);

  return {
    uid: event.uid ?? `${startsAt.toISOString()}-${event.summary ?? "event"}`,
    summary: event.summary ?? "Termin ohne Titel",
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    startsAt,
    endsAt,
    organizer,
    attendees,
    attendeeDomains: deriveDomains(attendees),
  };
}

function deriveDomains(emails: string[]): string[] {
  const seen = new Set<string>();
  for (const e of emails) {
    const at = e.lastIndexOf("@");
    if (at < 0) continue;
    const dom = e.slice(at + 1).toLowerCase().trim();
    if (!dom) continue;
    if (isPersonalDomain(dom)) continue;
    seen.add(dom);
  }
  return [...seen];
}

const PERSONAL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.de",
  "outlook.com",
  "hotmail.com",
  "hotmail.de",
  "live.com",
  "icloud.com",
  "me.com",
  "gmx.de",
  "gmx.net",
  "web.de",
  "mail.de",
  "t-online.de",
  "freenet.de",
  "posteo.de",
  "protonmail.com",
  "proton.me",
]);

function isPersonalDomain(dom: string): boolean {
  return PERSONAL_DOMAINS.has(dom);
}

/**
 * Filter events to a single calendar date in the given timezone offset.
 * We use a naive same-day comparison in the user's local TZ — adequate
 * for the MVP "Briefing for today/tomorrow" use case.
 */
export function filterEventsForDate(events: CalendarEvent[], isoDate: string): CalendarEvent[] {
  const [y, m, d] = isoDate.split("-").map(Number);
  return events
    .filter((e) => {
      const s = e.startsAt;
      return s.getFullYear() === y && s.getMonth() + 1 === m && s.getDate() === d;
    })
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}
