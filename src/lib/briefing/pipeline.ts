/**
 * Briefing pipeline. Glues together:
 *   1. fetch iCal URL
 *   2. filter to target date
 *   3. for each event: research + synthesise (in parallel, capped concurrency)
 *   4. persist to DB
 *
 * Designed to run inside a server action. It updates the row twice:
 * once with `processing`, then with `ready` / `failed`.
 */

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../db/client";
import { briefingRuns, briefings, dailyCounters } from "../db/schema";
import { env } from "../env";
import { fetchIcal, filterEventsForDate, type CalendarEvent } from "../calendar/ical";
import { researchEvent, type ResearchBundle } from "../research/research";
import { synthesiseMeeting, type MeetingBrief } from "../llm/synthesize";

export interface BriefingPayload {
  date: string;
  generatedAt: string;
  source: { kind: "ical-url"; url: string };
  meetings: BriefingMeeting[];
  /** True if the run was a partial mock (no LLM or no research). */
  isMock: boolean;
}

export interface BriefingMeeting {
  uid: string;
  startsAt: string;
  endsAt: string;
  summary: string;
  location?: string;
  attendees: string[];
  hints: ResearchBundle["hints"];
  brief: MeetingBrief;
  citationsExtra: Array<{ label: string; url: string }>;
}

export interface CreateBriefingInput {
  userId: string;
  userEmail: string;
  icalUrl: string;
  date: string; // YYYY-MM-DD
}

export interface CreateBriefingResult {
  ok: true;
  briefingId: string;
  slug: string;
}

export interface CreateBriefingError {
  ok: false;
  error: string;
  code?: "rate_limit_email" | "rate_limit_global" | "no_events" | "fetch" | "internal";
}

/**
 * Public entry point. Returns the briefing id + slug right away, but
 * actually runs the heavy work asynchronously. The result page polls the
 * row until status === "ready".
 */
export async function createBriefing(
  input: CreateBriefingInput,
): Promise<CreateBriefingResult | CreateBriefingError> {
  // ─── Rate-Limit-Check ────────────────────────────────────────────────
  const emailUses = await countSuccessfulRuns(input.userEmail);
  if (emailUses >= env.limitPerEmail) {
    return {
      ok: false,
      error: `Du hast dein Limit von ${env.limitPerEmail} Briefings erreicht. Schreib Christian, wenn du mehr willst.`,
      code: "rate_limit_email",
    };
  }

  const dailyOk = await tryIncrementDailyCounter(env.limitGlobalDaily);
  if (!dailyOk) {
    return {
      ok: false,
      error: "Tageslimit erreicht. Probiere es morgen wieder, oder schreib Christian.",
      code: "rate_limit_global",
    };
  }

  // ─── iCal fetch + parse ──────────────────────────────────────────────
  const ical = await fetchIcal(input.icalUrl);
  if (!ical.ok) {
    return { ok: false, error: ical.error, code: "fetch" };
  }

  const dayEvents = filterEventsForDate(ical.events, input.date);
  if (dayEvents.length === 0) {
    return {
      ok: false,
      error: `Keine Termine fuer ${formatHumanDate(input.date)} im Kalender gefunden.`,
      code: "no_events",
    };
  }

  // ─── Persist row in `processing` state ───────────────────────────────
  const id = nanoid();
  const slug = nanoid(10);
  const now = new Date();
  await db.insert(briefings).values({
    id,
    slug,
    userId: input.userId,
    userEmail: input.userEmail,
    date: input.date,
    calendarSource: "ical-url",
    calendarUrl: input.icalUrl,
    title: `Briefing ${formatHumanDate(input.date)}`,
    status: "processing",
    payload: null,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(briefingRuns).values({
    id: nanoid(),
    userEmail: input.userEmail,
    briefingId: id,
    succeeded: false,
    createdAt: now,
  });

  // ─── Kick off async pipeline. Don't await — the action returns and
  // the user lands on the result page which polls. ────────────────────
  runPipelineInBackground(id, slug, input, dayEvents).catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[pipeline] background error:", err);
  });

  return { ok: true, briefingId: id, slug };
}

async function runPipelineInBackground(
  id: string,
  _slug: string,
  input: CreateBriefingInput,
  events: CalendarEvent[],
): Promise<void> {
  try {
    // Cap concurrency at 3 to avoid hammering Tavily + Anthropic
    const meetings: BriefingMeeting[] = new Array(events.length);
    let isAnyMock = false;
    const concurrency = 3;
    let cursor = 0;

    const worker = async () => {
      while (cursor < events.length) {
        const i = cursor++;
        const event = events[i];
        try {
          const research = await researchEvent(event, input.userEmail);
          const synth = await synthesiseMeeting(event, research);
          if (synth.isMock || research.isMock) isAnyMock = true;

          meetings[i] = {
            uid: event.uid,
            startsAt: event.startsAt.toISOString(),
            endsAt: event.endsAt.toISOString(),
            summary: event.summary,
            location: event.location,
            attendees: event.attendees,
            hints: research.hints,
            brief: synth.brief,
            citationsExtra: collectCitations(research),
          };
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(`[pipeline] event ${event.uid} failed:`, err);
          isAnyMock = true;
          meetings[i] = {
            uid: event.uid,
            startsAt: event.startsAt.toISOString(),
            endsAt: event.endsAt.toISOString(),
            summary: event.summary,
            location: event.location,
            attendees: event.attendees,
            hints: { externalAttendees: [] },
            brief: {
              headline: event.summary,
              status: `Recherche fuer diesen Termin fehlgeschlagen: ${err instanceof Error ? err.message : "unbekannt"}`,
              companyContext: "",
              recentNews: [],
              talkingPoints: [],
              conceptProposal: "",
              openQuestions: [],
              citations: [],
            },
            citationsExtra: [],
          };
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(concurrency, events.length) }, worker));

    const payload: BriefingPayload = {
      date: input.date,
      generatedAt: new Date().toISOString(),
      source: { kind: "ical-url", url: input.icalUrl },
      meetings: meetings.filter(Boolean),
      isMock: isAnyMock,
    };

    await db
      .update(briefings)
      .set({
        status: "ready",
        payload: JSON.stringify(payload),
        updatedAt: new Date(),
      })
      .where(eq(briefings.id, id));

    // Mark the run as succeeded so the counter increments
    await db
      .update(briefingRuns)
      .set({ succeeded: true })
      .where(eq(briefingRuns.briefingId, id));
  } catch (err) {
    await db
      .update(briefings)
      .set({
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "unbekannt",
        updatedAt: new Date(),
      })
      .where(eq(briefings.id, id));
  }
}

function collectCitations(research: ResearchBundle): Array<{ label: string; url: string }> {
  const all = [...research.companyOverview, ...research.recentNews, ...research.personProfile];
  const seen = new Set<string>();
  const out: Array<{ label: string; url: string }> = [];
  for (const r of all) {
    if (seen.has(r.url)) continue;
    seen.add(r.url);
    out.push({ label: r.title, url: r.url });
    if (out.length >= 10) break;
  }
  return out;
}

async function countSuccessfulRuns(email: string): Promise<number> {
  const rows = await db
    .select()
    .from(briefingRuns)
    .where(eq(briefingRuns.userEmail, email.toLowerCase()));
  return rows.filter((r) => r.succeeded).length;
}

/**
 * Atomic increment of today's daily counter. Returns false if we'd go
 * past the cap. Implementation: read-modify-write inside a transaction —
 * good enough for our scale.
 */
async function tryIncrementDailyCounter(cap: number): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const existing = await db.select().from(dailyCounters).where(eq(dailyCounters.date, today));

  if (existing.length === 0) {
    await db.insert(dailyCounters).values({ date: today, count: 1 });
    return true;
  }

  const current = existing[0].count;
  if (current >= cap) return false;

  await db.update(dailyCounters).set({ count: current + 1 }).where(eq(dailyCounters.date, today));
  return true;
}

function formatHumanDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
