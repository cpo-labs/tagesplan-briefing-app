/**
 * Synthesise one meeting brief from a CalendarEvent + ResearchBundle.
 * Single LLM call per meeting. We use a structured JSON schema so the
 * Result Page can render typed cards instead of free-form text.
 */

import { z } from "zod";
import type { CalendarEvent } from "../calendar/ical";
import type { ResearchBundle } from "../research/research";
import type { TavilyResult } from "../research/tavily";
import { BRIEFING_SYSTEM_PROMPT, getAnthropic, hasAnthropic } from "./anthropic";
import { env } from "../env";

export const meetingBriefSchema = z.object({
  headline: z.string(),
  status: z.string(),
  companyContext: z.string(),
  personContext: z.string().optional(),
  recentNews: z.array(z.string()).default([]),
  talkingPoints: z.array(z.string()).default([]),
  conceptProposal: z.string(),
  openQuestions: z.array(z.string()).default([]),
  citations: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
});

export type MeetingBrief = z.infer<typeof meetingBriefSchema>;

export interface SynthesiseResult {
  brief: MeetingBrief;
  isMock: boolean;
}

const TIME_FMT = new Intl.DateTimeFormat("de-DE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

export async function synthesiseMeeting(
  event: CalendarEvent,
  research: ResearchBundle,
): Promise<SynthesiseResult> {
  if (!hasAnthropic()) {
    return { brief: buildMockBrief(event, research), isMock: true };
  }

  const userMessage = buildUserMessage(event, research);

  const client = getAnthropic();

  // 60s hard cap. Ohne dieses Limit haengt die Server Action bis der Host
  // sie killt — der User sieht endlos den processing-Spinner.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  let response;
  try {
    response = await client.messages.create(
      {
        model: env.anthropicModel,
        max_tokens: 1500,
        system: BRIEFING_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      },
      { signal: controller.signal },
    );
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(
        "Die Recherche-Synthese hat zu lange gedauert. Bitte nochmal versuchen.",
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Anthropic-Response enthielt keinen Text-Block.");
  }

  const parsed = safeParseJson(textBlock.text);
  const validated = meetingBriefSchema.safeParse(parsed);
  if (!validated.success) {
    // eslint-disable-next-line no-console
    console.error("[synthesize] invalid LLM JSON:", validated.error.flatten());
    return { brief: buildMockBrief(event, research, "LLM-Antwort war kein gueltiges JSON."), isMock: true };
  }

  return { brief: scrubSlop(validated.data), isMock: false };
}

function buildUserMessage(event: CalendarEvent, research: ResearchBundle): string {
  const start = TIME_FMT.format(event.startsAt);
  const end = TIME_FMT.format(event.endsAt);
  const lines: string[] = [];

  lines.push(`Termin: ${event.summary}`);
  lines.push(`Zeit: ${start}–${end}`);
  if (event.location) lines.push(`Ort: ${event.location}`);
  if (event.description) lines.push(`Beschreibung: ${truncate(event.description, 400)}`);

  if (research.hints.companyGuess) lines.push(`Firma (Vermutung): ${research.hints.companyGuess}`);
  if (research.hints.personGuess) lines.push(`Person (Vermutung): ${research.hints.personGuess}`);
  if (research.hints.externalAttendees.length > 0) {
    lines.push(`Externe Teilnehmer: ${research.hints.externalAttendees.join(", ")}`);
  }

  lines.push("");
  lines.push("RECHERCHE-MATERIAL:");

  if (research.isMock) {
    lines.push("(keine Web-Recherche verfuegbar — nutze nur Termin-Daten)");
  } else {
    if (research.companyOverview.length > 0) {
      lines.push("\n[Firma — Ueberblick]");
      lines.push(formatResults(research.companyOverview));
    }
    if (research.recentNews.length > 0) {
      lines.push("\n[Firma — News (letzte 90 Tage)]");
      lines.push(formatResults(research.recentNews));
    }
    if (research.personProfile.length > 0) {
      lines.push("\n[Person — Profil]");
      lines.push(formatResults(research.personProfile));
    }
    if (
      research.companyOverview.length === 0 &&
      research.recentNews.length === 0 &&
      research.personProfile.length === 0
    ) {
      lines.push("(keine Quellen gefunden)");
    }
  }

  lines.push("");
  lines.push("AUFGABE:");
  lines.push("Schreib ein JSON-Briefing fuer diesen Termin. Schema:");
  lines.push(`{
  "headline": "Kompakter Titel des Briefings, max 80 Zeichen",
  "status": "Wo stehen wir? (1-2 Saetze) — was wissen wir, was nicht",
  "companyContext": "Was ist die Firma? Branche, Groesse, Produkt, Standort. 2-4 Saetze.",
  "personContext": "Wer ist die Person? Rolle, Hintergrund. Nur wenn bekannt, sonst weglassen.",
  "recentNews": ["Stichpunkt 1 mit Datum wenn moeglich", "Stichpunkt 2"],
  "talkingPoints": ["3-5 konkrete Gespraechsanker — keine Plattituden"],
  "conceptProposal": "Vorschlag: Was koennte das Gespraech bringen? Wo gibt es eine Andock-Moeglichkeit? 2-4 Saetze. Direkt, kein Verkaeufer-Sprech.",
  "openQuestions": ["Was muss noch geklaert werden vor dem Termin?"],
  "citations": [{"label": "Quellen-Titel", "url": "https://..."}]
}`);
  lines.push("");
  lines.push("Antworte AUSSCHLIESSLICH mit dem JSON. Kein Markdown-Wrapper, kein Pre-Text.");

  return lines.join("\n");
}

function formatResults(results: TavilyResult[]): string {
  return results
    .slice(0, 5)
    .map((r, i) => {
      const date = r.publishedDate ? ` (${r.publishedDate})` : "";
      return `${i + 1}. ${r.title}${date}\n   ${r.url}\n   ${truncate(r.content, 320)}`;
    })
    .join("\n");
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}

function safeParseJson(text: string): unknown {
  // Manchmal verpackt das LLM trotz Anweisung in ```json — wir tolerieren das.
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    // Vielleicht hat das LLM noch Pre-Text geliefert — versuche den
    // ersten {…}-Block zu fischen.
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(cleaned.slice(first, last + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Anti-AI-Slop-Filter: ersetzt typische Tells, wenn sie es trotzdem
 * durchgeschafft haben.
 *
 * Em-Dash: NICHT mehr generell ersetzt. Em-Dash ist ein legitimer
 * deutscher Gedankenstrich und das blinde Ersetzen durch Komma hat in
 * Smoke-Tests Saetze gebrochen. Stattdessen filtern wir nur die wirklich
 * eindeutigen Phrasen-Tells ("Lass uns eintauchen", "Es ist wichtig zu
 * beachten", "Absolut!" etc.).
 */
function scrubSlop(brief: MeetingBrief): MeetingBrief {
  const scrub = (s: string): string =>
    s
      .replace(/\bEs ist wichtig zu beachten,?\s*/gi, "")
      .replace(/\bLass uns eintauchen[.!]?\s*/gi, "")
      .replace(/\bIm Wesentlichen,?\s*/gi, "")
      .replace(/\bUnter dem Strich,?\s*/gi, "")
      .replace(/\bZusammenfassend,?\s*/gi, "")
      .replace(/^Absolut[!.]\s*/gi, "")
      .replace(/^Ich freue mich,?\s*/gi, "")
      .trim();

  return {
    ...brief,
    headline: scrub(brief.headline),
    status: scrub(brief.status),
    companyContext: scrub(brief.companyContext),
    personContext: brief.personContext ? scrub(brief.personContext) : undefined,
    recentNews: brief.recentNews.map(scrub),
    talkingPoints: brief.talkingPoints.map(scrub),
    conceptProposal: scrub(brief.conceptProposal),
    openQuestions: brief.openQuestions.map(scrub),
  };
}

function buildMockBrief(event: CalendarEvent, research: ResearchBundle, note?: string): MeetingBrief {
  return {
    headline: event.summary,
    status: note
      ? `Mock-Briefing: ${note}`
      : "Mock-Briefing: keine LLM- und/oder Recherche-Quellen verfuegbar.",
    companyContext: research.hints.companyGuess
      ? `Firma (Vermutung): ${research.hints.companyGuess}. Sobald Tavily-Key gesetzt ist, fuellt sich dieser Block automatisch.`
      : "Firma nicht eindeutig — Termin-Titel liefert keinen Domain-Hint und es gibt keine externen Attendees.",
    personContext: research.hints.personGuess
      ? `Person (Vermutung): ${research.hints.personGuess}.`
      : undefined,
    recentNews: [],
    talkingPoints: [
      "Aktuelle Situation der Firma checken",
      "Wer sitzt im Termin? Rolle und Zustaendigkeit klaeren",
      "Konkretes Ziel des Gespraechs definieren",
    ],
    conceptProposal:
      "Setze die Anthropic- und Tavily-Keys in .env.local, damit das Tool eine echte Synthese liefert. Im Mock-Modus ist hier nur ein Platzhalter.",
    openQuestions: ["Worum geht es genau in diesem Termin?"],
    citations: [],
  };
}
