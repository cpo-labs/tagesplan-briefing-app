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

import { after } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "../db/client";
import { briefingRuns, briefings, dailyCounters } from "../db/schema";
import { env } from "../env";
import type { Locale } from "../i18n";
import { fetchIcal, filterEventsForDate, type CalendarEvent } from "../calendar/ical";
import { researchEvent, type ResearchBundle } from "../research/research";
import { meetingBriefSchema, synthesiseMeeting } from "../llm/synthesize";

/**
 * Free-tier bound: we only ever process the first N events of the day so a
 * single Vercel function invocation (concurrency 3 below) stays inside the
 * 60s budget. The hero form date-picker keeps days realistic, but a busy
 * calendar with 15 meetings would otherwise blow the timeout.
 */
const MAX_EVENTS_PER_DAY = 8;

const meetingHintsSchema = z.object({
  companyGuess: z.string().optional(),
  personGuess: z.string().optional(),
  domainGuess: z.string().optional(),
  externalAttendees: z.array(z.string()).default([]),
});

export const briefingMeetingSchema = z.object({
  uid: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  summary: z.string(),
  location: z.string().optional(),
  attendees: z.array(z.string()).default([]),
  hints: meetingHintsSchema,
  brief: meetingBriefSchema,
  citationsExtra: z
    .array(z.object({ label: z.string(), url: z.string() }))
    .default([]),
});

export const briefingPayloadSchema = z.object({
  date: z.string(),
  generatedAt: z.string(),
  source: z.object({ kind: z.literal("ical-url"), url: z.string() }),
  meetings: z.array(briefingMeetingSchema),
  /** True if the run was a partial mock (no LLM or no research). */
  isMock: z.boolean(),
});

export type BriefingPayload = z.infer<typeof briefingPayloadSchema>;
export type BriefingMeeting = z.infer<typeof briefingMeetingSchema>;

export interface CreateBriefingInput {
  userId?: string | null;
  userEmail?: string | null;
  icalUrl: string;
  date: string; // YYYY-MM-DD
  locale?: Locale;
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
  const locale: Locale = input.locale ?? "de";
  const en = locale === "en";
  const email = input.userEmail ? input.userEmail.toLowerCase() : null;

  // ─── Rate-Limit-Check ────────────────────────────────────────────────
  // Per-E-Mail-Check NUR wenn eine E-Mail vorliegt (anonyme iCal-Laeufe sind
  // barrierefrei). Der globale Tageszaehler greift IMMER.
  if (email) {
    const emailUses = await countSuccessfulRuns(email);
    if (emailUses >= env.limitPerEmail) {
      return {
        ok: false,
        error: en
          ? `You've hit your limit of ${env.limitPerEmail} briefings. Drop us a line if you want more.`
          : `Du hast dein Limit von ${env.limitPerEmail} Briefings erreicht. Schreib uns, wenn du mehr willst.`,
        code: "rate_limit_email",
      };
    }
  }

  const dailyOk = await tryIncrementDailyCounter(env.limitGlobalDaily);
  if (!dailyOk) {
    return {
      ok: false,
      error: en
        ? "Daily limit reached. Try again tomorrow, or drop us a line."
        : "Tageslimit erreicht. Probiere es morgen wieder, oder schreib uns.",
      code: "rate_limit_global",
    };
  }

  // ─── iCal fetch + parse ──────────────────────────────────────────────
  const ical = await fetchIcal(input.icalUrl);
  if (!ical.ok) {
    return { ok: false, error: ical.error, code: "fetch" };
  }

  const allDayEvents = filterEventsForDate(ical.events, input.date);
  if (allDayEvents.length === 0) {
    return {
      ok: false,
      error: en
        ? `No events found for ${formatHumanDate(input.date, locale)} in the calendar.`
        : `Keine Termine fuer ${formatHumanDate(input.date, locale)} im Kalender gefunden.`,
      code: "no_events",
    };
  }

  // Free-tier cap: only the first MAX_EVENTS_PER_DAY events get processed.
  const dayEvents = allDayEvents.slice(0, MAX_EVENTS_PER_DAY);

  // ─── Persist row in `processing` state ───────────────────────────────
  const id = nanoid();
  const slug = nanoid(10);
  const now = new Date();
  await db.insert(briefings).values({
    id,
    slug,
    userId: input.userId ?? null,
    userEmail: email,
    date: input.date,
    calendarSource: "ical-url",
    calendarUrl: input.icalUrl,
    title: `${en ? "Briefing" : "Briefing"} ${formatHumanDate(input.date, locale)}`,
    status: "processing",
    payload: null,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(briefingRuns).values({
    id: nanoid(),
    userEmail: email,
    briefingId: id,
    succeeded: false,
    createdAt: now,
  });

  // ─── Background pipeline ─────────────────────────────────────────────
  // `after()` schedules the heavy work to run AFTER the response is sent but
  // still inside the function's lifetime on Vercel — far more reliable on the
  // free tier than a bare fire-and-forget promise, which the platform may kill
  // the moment the action returns. Outside a request scope (scripts/tests)
  // `after()` throws, so we fall back to fire-and-forget there.
  const run = () =>
    runPipelineInBackground(id, slug, { ...input, locale }, dayEvents).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[pipeline] background error:", err);
    });

  try {
    after(run);
  } catch {
    void run();
  }

  return { ok: true, briefingId: id, slug };
}

async function runPipelineInBackground(
  id: string,
  _slug: string,
  input: CreateBriefingInput,
  events: CalendarEvent[],
): Promise<void> {
  const locale: Locale = input.locale ?? "de";
  const en = locale === "en";
  try {
    // Cap concurrency at 3 to avoid hammering Tavily + Anthropic. Combined
    // with the MAX_EVENTS_PER_DAY slice upstream this keeps a single Vercel
    // free-tier invocation inside the 60s budget.
    const meetings: BriefingMeeting[] = new Array(events.length);
    let isAnyMock = false;
    const concurrency = 3;
    let cursor = 0;
    // extractHints filters out the user's own email from attendees; empty
    // string is a safe no-op for anonymous runs.
    const researchEmail = input.userEmail ?? "";

    const worker = async () => {
      while (cursor < events.length) {
        const i = cursor++;
        const event = events[i];
        try {
          const research = await researchEvent(event, researchEmail);
          const synth = await synthesiseMeeting(event, research, locale);
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
              status: en
                ? `Research for this meeting failed: ${err instanceof Error ? err.message : "unknown"}`
                : `Recherche fuer diesen Termin fehlgeschlagen: ${err instanceof Error ? err.message : "unbekannt"}`,
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
  // SELECT count(*) ... — kein full table load. Wichtig sobald die Tabelle
  // waechst (jede Mail-Adresse triggert diesen Check pro Briefing).
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(briefingRuns)
    .where(
      and(
        eq(briefingRuns.userEmail, email.toLowerCase()),
        eq(briefingRuns.succeeded, true),
      ),
    );
  return Number(rows[0]?.count ?? 0);
}

/**
 * Increment today's daily counter and return false when we'd exceed cap.
 *
 * Race-Window: dieser Pfad ist NICHT in einer Transaction. libsql/Turso
 * unterstuetzt zwar `db.transaction()`, aber die Implementierung ist
 * cross-driver brittle (Edge-Runtime vs. Node lokal). Konsequenz: zwei
 * gleichzeitige Requests koennen beide den Cap-Check passieren und das
 * Tageslimit um 1 ueberschreiten. Bei `limitGlobalDaily=50` ist der
 * Worst-Case 51 Briefings — akzeptabel fuer ein Lab-Tool und im README
 * dokumentiert.
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

function formatHumanDate(iso: string, locale: Locale = "de"): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(locale === "en" ? "en-GB" : "de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
