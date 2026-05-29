/**
 * Per-meeting research pipeline. Given a CalendarEvent + hints, we fan
 * out into 2-3 Tavily queries (company overview, recent news, person if
 * known), collect snippets, and pass the bundle into the LLM synthesis.
 *
 * Keep this dumb. The LLM does the thinking — we just feed it good source
 * material with proper citation links.
 */

import type { CalendarEvent } from "../calendar/ical";
import { extractHints, type MeetingHints } from "./extract";
import { tavilySearch, type TavilyResult } from "./tavily";

export interface ResearchBundle {
  hints: MeetingHints;
  companyOverview: TavilyResult[];
  recentNews: TavilyResult[];
  personProfile: TavilyResult[];
  /** True if research was skipped because Tavily key is missing. */
  isMock: boolean;
}

export async function researchEvent(
  event: CalendarEvent,
  userEmail: string,
): Promise<ResearchBundle> {
  const hints = extractHints(event, userEmail);

  const queries: Array<Promise<{ kind: "company" | "news" | "person"; results: TavilyResult[]; mock: boolean }>> = [];

  if (hints.companyGuess) {
    queries.push(
      tavilySearch({
        query: `${hints.companyGuess} Unternehmen Branche Produkte Standort`,
        maxResults: 4,
        topic: "general",
      }).then((r) => ({ kind: "company" as const, results: r.results, mock: r.mock })),
    );

    queries.push(
      tavilySearch({
        query: `${hints.companyGuess} News`,
        maxResults: 4,
        topic: "news",
        days: 90,
      }).then((r) => ({ kind: "news" as const, results: r.results, mock: r.mock })),
    );
  } else if (hints.domainGuess) {
    queries.push(
      tavilySearch({
        query: `site:${hints.domainGuess} OR "${hints.domainGuess}"`,
        maxResults: 4,
      }).then((r) => ({ kind: "company" as const, results: r.results, mock: r.mock })),
    );
  }

  // Person nur MIT Firmen-Kontext recherchieren. Ein nackter Vorname wie
  // "Christian" liefert sonst Müll (Religions-News statt der Person). Ohne
  // Firma lassen wir die Person-Recherche bewusst weg.
  if (hints.personGuess && hints.companyGuess) {
    queries.push(
      tavilySearch({
        query: `${hints.personGuess} ${hints.companyGuess} LinkedIn Position`,
        maxResults: 4,
      }).then((r) => ({ kind: "person" as const, results: r.results, mock: r.mock })),
    );
  }

  const out: ResearchBundle = {
    hints,
    companyOverview: [],
    recentNews: [],
    personProfile: [],
    isMock: queries.length === 0,
  };

  if (queries.length === 0) return out;

  const settled = await Promise.allSettled(queries);
  let anyMock = false;
  let anyReal = false;
  for (const s of settled) {
    if (s.status !== "fulfilled") continue;
    if (s.value.mock) anyMock = true;
    else anyReal = true;
    if (s.value.kind === "company") out.companyOverview.push(...s.value.results);
    if (s.value.kind === "news") out.recentNews.push(...s.value.results);
    if (s.value.kind === "person") out.personProfile.push(...s.value.results);
  }

  out.isMock = anyMock && !anyReal;
  return out;
}
