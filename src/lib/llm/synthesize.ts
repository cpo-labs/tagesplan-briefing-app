/**
 * Synthesise one meeting brief from a CalendarEvent + ResearchBundle.
 * Single LLM call per meeting. We use a structured JSON schema so the
 * Result Page can render typed cards instead of free-form text.
 */

import { z } from "zod";
import type { CalendarEvent } from "../calendar/ical";
import type { ResearchBundle } from "../research/research";
import type { TavilyResult } from "../research/tavily";
import { briefingSystemPrompt, getAnthropic, hasAnthropic } from "./anthropic";
import type { Locale } from "../i18n";
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

function timeFmt(locale: Locale): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  });
}

export async function synthesiseMeeting(
  event: CalendarEvent,
  research: ResearchBundle,
  locale: Locale = "de",
): Promise<SynthesiseResult> {
  if (!hasAnthropic()) {
    return { brief: buildMockBrief(event, research, locale), isMock: true };
  }

  const userMessage = buildUserMessage(event, research, locale);

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
        system: briefingSystemPrompt(locale),
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
    const note =
      locale === "en" ? "LLM response was not valid JSON." : "LLM-Antwort war kein gueltiges JSON.";
    return { brief: buildMockBrief(event, research, locale, note), isMock: true };
  }

  return { brief: scrubSlop(validated.data), isMock: false };
}

function buildUserMessage(event: CalendarEvent, research: ResearchBundle, locale: Locale): string {
  const fmt = timeFmt(locale);
  const start = fmt.format(event.startsAt);
  const end = fmt.format(event.endsAt);
  const lines: string[] = [];
  const en = locale === "en";

  lines.push(`${en ? "Meeting" : "Termin"}: ${event.summary}`);
  lines.push(`${en ? "Time" : "Zeit"}: ${start}–${end}`);
  if (event.location) lines.push(`${en ? "Location" : "Ort"}: ${event.location}`);
  if (event.description)
    lines.push(`${en ? "Description" : "Beschreibung"}: ${truncate(event.description, 400)}`);

  if (research.hints.companyGuess)
    lines.push(`${en ? "Company (guess)" : "Firma (Vermutung)"}: ${research.hints.companyGuess}`);
  if (research.hints.personGuess)
    lines.push(`${en ? "Person (guess)" : "Person (Vermutung)"}: ${research.hints.personGuess}`);
  if (research.hints.externalAttendees.length > 0) {
    lines.push(
      `${en ? "External attendees" : "Externe Teilnehmer"}: ${research.hints.externalAttendees.join(", ")}`,
    );
  }

  lines.push("");
  lines.push(en ? "RESEARCH MATERIAL:" : "RECHERCHE-MATERIAL:");

  if (research.isMock) {
    lines.push(
      en
        ? "(no web research available — use meeting data only)"
        : "(keine Web-Recherche verfuegbar — nutze nur Termin-Daten)",
    );
  } else {
    if (research.companyOverview.length > 0) {
      lines.push(en ? "\n[Company — overview]" : "\n[Firma — Ueberblick]");
      lines.push(formatResults(research.companyOverview));
    }
    if (research.recentNews.length > 0) {
      lines.push(en ? "\n[Company — news (last 90 days)]" : "\n[Firma — News (letzte 90 Tage)]");
      lines.push(formatResults(research.recentNews));
    }
    if (research.personProfile.length > 0) {
      lines.push(en ? "\n[Person — profile]" : "\n[Person — Profil]");
      lines.push(formatResults(research.personProfile));
    }
    if (
      research.companyOverview.length === 0 &&
      research.recentNews.length === 0 &&
      research.personProfile.length === 0
    ) {
      lines.push(en ? "(no sources found)" : "(keine Quellen gefunden)");
    }
  }

  lines.push("");
  if (en) {
    lines.push("TASK:");
    lines.push("Write a JSON briefing for this meeting. Schema:");
    lines.push(`{
  "headline": "Compact briefing title, max 80 chars",
  "status": "Where do we stand? (1-2 sentences) — what we know, what we don't",
  "companyContext": "What is the company? Industry, size, product, location. 2-4 sentences.",
  "personContext": "Who is the person? Role, background. Only if known, otherwise omit.",
  "recentNews": ["Point 1 with date if possible", "Point 2"],
  "talkingPoints": ["3-5 concrete conversation anchors — no platitudes"],
  "conceptProposal": "Proposal: what could the conversation yield? Where is there a hook? 2-4 sentences. Direct, no salesperson-speak.",
  "openQuestions": ["What still needs clarifying before the meeting?"],
  "citations": [{"label": "Source title", "url": "https://..."}]
}`);
    lines.push("");
    lines.push("Respond ONLY with the JSON. No markdown wrapper, no pre-text.");
  } else {
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
  }

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

function buildMockBrief(
  event: CalendarEvent,
  research: ResearchBundle,
  locale: Locale,
  note?: string,
): MeetingBrief {
  const en = locale === "en";
  return {
    headline: event.summary,
    status: note
      ? `${en ? "Mock briefing" : "Mock-Briefing"}: ${note}`
      : en
        ? "Mock briefing: no LLM and/or research sources available."
        : "Mock-Briefing: keine LLM- und/oder Recherche-Quellen verfuegbar.",
    companyContext: research.hints.companyGuess
      ? en
        ? `Company (guess): ${research.hints.companyGuess}. Once a Tavily key is set, this block fills automatically.`
        : `Firma (Vermutung): ${research.hints.companyGuess}. Sobald Tavily-Key gesetzt ist, fuellt sich dieser Block automatisch.`
      : en
        ? "Company unclear — the meeting title gives no domain hint and there are no external attendees."
        : "Firma nicht eindeutig — Termin-Titel liefert keinen Domain-Hint und es gibt keine externen Attendees.",
    personContext: research.hints.personGuess
      ? en
        ? `Person (guess): ${research.hints.personGuess}.`
        : `Person (Vermutung): ${research.hints.personGuess}.`
      : undefined,
    recentNews: [],
    talkingPoints: en
      ? [
          "Check the company's current situation",
          "Who's in the meeting? Clarify role and responsibility",
          "Define the concrete goal of the conversation",
        ]
      : [
          "Aktuelle Situation der Firma checken",
          "Wer sitzt im Termin? Rolle und Zustaendigkeit klaeren",
          "Konkretes Ziel des Gespraechs definieren",
        ],
    conceptProposal: en
      ? "Set the Anthropic and Tavily keys in .env.local so the tool delivers real synthesis. In mock mode this is just a placeholder."
      : "Setze die Anthropic- und Tavily-Keys in .env.local, damit das Tool eine echte Synthese liefert. Im Mock-Modus ist hier nur ein Platzhalter.",
    openQuestions: en
      ? ["What exactly is this meeting about?"]
      : ["Worum geht es genau in diesem Termin?"],
    citations: [],
  };
}
