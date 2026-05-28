/**
 * iCal parsing utilities. Fetches an .ics URL, parses VEVENTs via ical.js,
 * filters down to the requested date, and extracts the bits we need for
 * research (title, attendees, company hints, organiser).
 *
 * Net assumption: the URL is public (Google/Apple/Office "Secret address
 * in iCal format"). We do not handle CalDAV here — out of scope for MVP.
 *
 * Security: every fetch goes through `assertPublicHost()` to reject DNS
 * targets in private, loopback, link-local (incl. AWS metadata), CGNAT
 * and reserved ranges. `redirect: "error"` blocks silent cross-host
 * redirects that would bypass the pre-fetch check.
 */

import ICAL from "ical.js";
import { assertPublicHost, REJECT_MSG } from "./ssrf";

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

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "URL ist nicht wohlgeformt." };
  }

  // SSRF-Schutz: DNS-resolve und Range-Check vor dem fetch.
  try {
    await assertPublicHost(parsed);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : REJECT_MSG,
    };
  }

  let res: Response;
  try {
    res = await fetch(parsed, {
      // .ics endpoints sometimes 404 with non-text/calendar accept
      headers: { Accept: "text/calendar, text/plain, */*" },
      // Don't cache — calendars move
      cache: "no-store",
      // Block silent cross-host redirects; without this, a 30x to an
      // internal IP would bypass our pre-fetch DNS check.
      redirect: "error",
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
    const events: CalendarEvent[] = vevents.map((v) => buildEventWithRecurrence(v));
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
 * Filter events to a single calendar date in the given IANA timezone.
 *
 * Two behaviours folded in here:
 *   1. RRULE expansion: VEVENTs with a recurrence rule are expanded to
 *      occurrences inside a ±1-day window around the target date. Without
 *      this, weekly standups would only ever appear on their original
 *      DTSTART day.
 *   2. Timezone-aware day comparison: we bucket by the user's wall-clock
 *      day via `Intl.DateTimeFormat`, not by `Date#getDate()` which uses
 *      the host process timezone. A late-evening event in Europe/Berlin
 *      that resolves to next-day UTC must still land in the Berlin day.
 */
export function filterEventsForDate(
  events: CalendarEvent[],
  isoDate: string,
  timeZone: string = "Europe/Berlin",
): CalendarEvent[] {
  // `isoDate` is already YYYY-MM-DD in the user's wall-clock TZ. We
  // compare against each event's start as observed in the same TZ.
  const targetBucket = isoDate;
  // RRULE expansion needs the raw VEVENTs, so we walk events that have
  // either a single matching start or a recurrence whose occurrences hit
  // the bucket. Since the public surface only exposes CalendarEvent (not
  // the raw VEVENT components), we re-derive expansion via a wider window.
  const windowStart = isoDateAtUtc(isoDate, -1);
  const windowEnd = isoDateAtUtc(isoDate, 2);

  const expanded: CalendarEvent[] = [];
  for (const e of events) {
    const occurrences = expandOccurrences(e, windowStart, windowEnd);
    for (const occ of occurrences) {
      if (toYmdInTzFromDate(occ.startsAt, timeZone) === targetBucket) {
        expanded.push(occ);
      }
    }
  }

  return expanded.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

/**
 * Given an upstream-parsed CalendarEvent, return all of its occurrences
 * in the [windowStart, windowEnd) range. For non-recurring events this is
 * either [event] or [].
 *
 * NOTE: We re-attach to ical.js' Event by reconstructing the timing from
 * stored Dates. Since the original VEVENT (with its RRULE) isn't on the
 * CalendarEvent type, we stash the iterator handle on a hidden property.
 * The producer (buildEvent) doesn't expose it; instead the iCal entry
 * carries it via a sidecar map kept by `fetchIcal` — simpler approach is
 * to expand at parse time. We do that below by extending `buildEvent`.
 */
function expandOccurrences(
  event: CalendarEvent,
  windowStart: Date,
  windowEnd: Date,
): CalendarEvent[] {
  const occ = (event as InternalRecurring).__occurrences;
  if (!occ) {
    // Non-recurring: include only if it falls in the window.
    if (event.startsAt >= windowStart && event.startsAt < windowEnd) {
      return [event];
    }
    return [];
  }
  return occ(windowStart, windowEnd);
}

interface InternalRecurring extends CalendarEvent {
  __occurrences?: (start: Date, end: Date) => CalendarEvent[];
}

/**
 * Return `YYYY-MM-DD` for a given JS Date as observed in `timeZone`.
 */
function toYmdInTzFromDate(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

/** Return a UTC Date for `isoDate + dayOffset`. */
function isoDateAtUtc(isoDate: string, dayOffset: number): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + dayOffset, 0, 0, 0));
}

/* ─── RRULE expansion wiring ───────────────────────────────────────────
 * To keep the existing `fetchIcal` shape (returns CalendarEvent[]), we
 * attach a hidden `__occurrences(start, end)` callback at parse time on
 * recurring events. `filterEventsForDate` invokes it inside a ±1-day
 * window around the requested date.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * Recurrence-aware builder. Returns the base CalendarEvent unchanged for
 * single events; for VEVENTs with an RRULE, attaches a hidden
 * `__occurrences(start, end)` expander that ical.js drives via
 * `event.iterator()`. We cap at 500 iterations as a sanity guard against
 * pathological RRULEs (`COUNT=999999`).
 */
function buildEventWithRecurrence(v: ICAL.Component): CalendarEvent {
  const event = new ICAL.Event(v);
  const base = buildEvent(v);
  if (!event.isRecurring()) return base;

  const expand = (start: Date, end: Date): CalendarEvent[] => {
    const iter = event.iterator();
    const out: CalendarEvent[] = [];
    let next = iter.next();
    let guard = 0;
    while (next && guard < 500) {
      const occStart = next.toJSDate();
      if (occStart >= end) break;
      if (occStart >= start) {
        const duration = base.endsAt.getTime() - base.startsAt.getTime();
        out.push({
          ...base,
          uid: `${base.uid}@${occStart.toISOString()}`,
          startsAt: occStart,
          endsAt: new Date(occStart.getTime() + duration),
        });
      }
      next = iter.next();
      guard++;
    }
    return out;
  };

  return Object.assign(base, { __occurrences: expand } as Partial<InternalRecurring>);
}
