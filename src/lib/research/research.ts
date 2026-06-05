/**
 * Per-meeting research pipeline. Given a CalendarEvent + hints, we fan
 * out into 2-3 Tavily queries (company overview, recent news, person if
 * known), collect snippets, and pass the bundle into the LLM synthesis.
 *
 * Keep this dumb. The LLM does the thinking — we just feed it good source
 * material with proper citation links.
 *
 * Wichtig: fehlgeschlagene Einzel-Queries (429/Netz) werden NICHT still
 * verschluckt. Jede gescheiterte Query erzeugt eine explizite Luecken-Notiz
 * in `gaps`, die der Synthesizer dem Modell mitgibt und die im Brief sichtbar
 * wird. Ein Teil-Erfolg (z. B. Firma echt, News verloren) bleibt ein echtes
 * Briefing mit benannter Luecke statt eines stillen Mocks.
 */

import type { CalendarEvent } from "../calendar/ical";
import { extractHints, type MeetingHints } from "./extract";
import { tavilySearch, type TavilyResult } from "./tavily";

type QueryKind = "company" | "news" | "person";

const KIND_LABEL_DE: Record<QueryKind, string> = {
  company: "Firmen-Recherche",
  news: "News-Recherche",
  person: "Personen-Recherche",
};

export interface ResearchBundle {
  hints: MeetingHints;
  companyOverview: TavilyResult[];
  recentNews: TavilyResult[];
  personProfile: TavilyResult[];
  /** True if research was skipped because Tavily key is missing (Demo-Modus). */
  isMock: boolean;
  /**
   * Explizite Luecken: pro fehlgeschlagener Query ein menschlich lesbarer
   * Hinweis ("News-Recherche fehlgeschlagen (HTTP 429)"). Leer = keine Luecke.
   */
  gaps: string[];
}

interface QueryOutcome {
  kind: QueryKind;
  results: TavilyResult[];
  mock: boolean;
  failed: boolean;
  failReason?: string;
}

export async function researchEvent(
  event: CalendarEvent,
  userEmail: string,
): Promise<ResearchBundle> {
  const hints = extractHints(event, userEmail);

  const queries: Array<Promise<QueryOutcome>> = [];

  const run = (kind: QueryKind, opts: Parameters<typeof tavilySearch>[0]) =>
    tavilySearch(opts).then((r) => ({
      kind,
      results: r.results,
      mock: r.mock,
      failed: r.failed,
      failReason: r.failReason,
    }));

  if (hints.companyGuess) {
    queries.push(
      run("company", {
        query: `${hints.companyGuess} Unternehmen Branche Produkte Standort`,
        maxResults: 4,
        topic: "general",
      }),
    );

    queries.push(
      run("news", {
        query: `${hints.companyGuess} News`,
        maxResults: 4,
        topic: "news",
        days: 90,
      }),
    );
  } else if (hints.domainGuess) {
    queries.push(
      run("company", {
        query: `site:${hints.domainGuess} OR "${hints.domainGuess}"`,
        maxResults: 4,
      }),
    );
  }

  // Person nur MIT Firmen-Kontext recherchieren. Ein nackter Vorname wie
  // "Christian" liefert sonst Müll (Religions-News statt der Person). Ohne
  // Firma lassen wir die Person-Recherche bewusst weg.
  if (hints.personGuess && hints.companyGuess) {
    queries.push(
      run("person", {
        query: `${hints.personGuess} ${hints.companyGuess} LinkedIn Position`,
        maxResults: 4,
      }),
    );
  }

  const out: ResearchBundle = {
    hints,
    companyOverview: [],
    recentNews: [],
    personProfile: [],
    isMock: queries.length === 0,
    gaps: [],
  };

  if (queries.length === 0) return out;

  const settled = await Promise.allSettled(queries);
  let anyMock = false;
  let anyReal = false;

  for (const s of settled) {
    if (s.status !== "fulfilled") {
      // Sollte praktisch nie passieren (tavilySearch faengt selbst ab), aber
      // wir verschlucken auch das nicht still.
      out.gaps.push("Recherche fehlgeschlagen (unerwarteter Fehler).");
      continue;
    }
    const v = s.value;

    if (v.failed) {
      const label = KIND_LABEL_DE[v.kind];
      out.gaps.push(
        v.failReason
          ? `${label} fehlgeschlagen (${v.failReason}).`
          : `${label} fehlgeschlagen.`,
      );
      continue;
    }

    if (v.mock) {
      anyMock = true;
      continue;
    }

    anyReal = true;
    if (v.kind === "company") out.companyOverview.push(...v.results);
    if (v.kind === "news") out.recentNews.push(...v.results);
    if (v.kind === "person") out.personProfile.push(...v.results);
  }

  // isMock nur, wenn KEINE echte Query durchkam UND mindestens eine mockte
  // (= kein Key). Ein reiner Fehlerlauf ist NICHT mock, sondern ein echter
  // Lauf mit benannten Luecken.
  out.isMock = anyMock && !anyReal && out.gaps.length === 0;
  return out;
}
