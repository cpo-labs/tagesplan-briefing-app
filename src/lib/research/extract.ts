/**
 * Pulls company- and person-hints out of a calendar event's title,
 * description, and attendee list. Heuristic, not perfect — but
 * deterministic and cheap. The LLM step gets the raw event plus our hints
 * and decides for itself what to research.
 */

import type { CalendarEvent } from "../calendar/ical";

export interface MeetingHints {
  companyGuess?: string;
  personGuess?: string;
  domainGuess?: string;
  externalAttendees: string[];
}

const SEPARATORS = /[|:\-–—·\/]+/;
const STOPWORDS = new Set([
  "call",
  "meeting",
  "kickoff",
  "kick-off",
  "intro",
  "follow-up",
  "followup",
  "sync",
  "demo",
  "termin",
  "gespraech",
  "besprechung",
  "abstimmung",
  "review",
  "session",
  "with",
  "mit",
  "and",
  "und",
  "vs",
  "the",
  "der",
  "die",
  "das",
]);

export function extractHints(event: CalendarEvent, userEmail: string): MeetingHints {
  const externalAttendees = event.attendees
    .map((a) => a.toLowerCase())
    .filter((a) => a && a !== userEmail.toLowerCase());

  const domainGuess = event.attendeeDomains[0];

  const titleParts = (event.summary ?? "")
    .split(SEPARATORS)
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !STOPWORDS.has(p.toLowerCase()));

  // Title-Heuristik: das erste Segment ist meistens die Firma (so
  // strukturieren Vertriebs-/CRM-Termine: "Howden Group | Marcus Kraft"),
  // ein Personen-Name-aehnliches Segment dahinter ist die Person. Wenn
  // nur ein Segment uebrig ist, ist es die Firma.
  let companyGuess: string | undefined;
  let personGuess: string | undefined;

  for (const part of titleParts) {
    if (!companyGuess) {
      companyGuess = part;
    } else if (!personGuess && looksLikePersonName(part)) {
      personGuess = part;
    }
  }

  // Wenn das erste Segment selbst wie ein Name aussieht und ein zweites
  // Segment existiert, dreh es: das zweite ist die Firma.
  if (
    companyGuess &&
    looksLikePersonName(companyGuess) &&
    titleParts.length > 1 &&
    !looksLikePersonName(titleParts[1])
  ) {
    personGuess = companyGuess;
    companyGuess = titleParts[1];
  }

  // Fallback: wenn nur ein einziger Title-Part und kein Personen-Match,
  // ist der part vermutlich Firma.
  if (!companyGuess && titleParts.length === 1 && !personGuess) {
    companyGuess = titleParts[0];
  }

  // Wenn wir nur Domain haben, aber keine Firma, leiten wir aus Domain ab.
  if (!companyGuess && domainGuess) {
    companyGuess = humanizeDomain(domainGuess);
  }

  return {
    companyGuess,
    personGuess,
    domainGuess,
    externalAttendees,
  };
}

function looksLikePersonName(s: string): boolean {
  // Zwei Worte, beide capitalised, keine Sonderzeichen
  const parts = s.trim().split(/\s+/);
  if (parts.length < 2 || parts.length > 4) return false;
  return parts.every((p) => /^[A-ZÄÖÜ][a-zäöüß'\-]+$/.test(p));
}

function humanizeDomain(dom: string): string {
  const base = dom.replace(/^www\./, "").split(".")[0];
  if (!base) return dom;
  return base.charAt(0).toUpperCase() + base.slice(1);
}
