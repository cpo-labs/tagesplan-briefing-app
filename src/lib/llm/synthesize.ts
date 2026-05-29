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

// Strukturierte Ausgabe per Tool-Use: das Modell MUSS dieses Tool aufrufen.
// Das SDK liefert ein Objekt — kein fragiles JSON.parse auf LLM-Freitext mehr,
// also auch kein "kein gueltiges JSON"-Mock-Fallback.
const BRIEF_TOOL = {
  name: "emit_meeting_brief",
  description: "Gibt das fertige Termin-Briefing strukturiert zurück.",
  input_schema: {
    type: "object" as const,
    properties: {
      headline: { type: "string", description: "Kompakter Titel des Briefings, max 80 Zeichen." },
      status: { type: "string", description: "Wo stehen wir? 1-2 Sätze: was wissen wir, was nicht." },
      companyContext: { type: "string", description: "Firma: Branche, Größe, Produkt, Standort. 2-4 Sätze. Leer lassen, wenn keine externe Firma im Spiel ist." },
      personContext: { type: "string", description: "Person: Rolle, Hintergrund. Nur wenn wirklich bekannt, sonst weglassen." },
      recentNews: { type: "array", items: { type: "string" }, description: "Relevante News mit Datum, wenn vorhanden. Sonst leer." },
      talkingPoints: { type: "array", items: { type: "string" }, description: "3-5 konkrete Gesprächsanker, keine Plattitüden." },
      conceptProposal: { type: "string", description: "Was könnte das Gespräch bringen, wo gibt es eine Andock-Möglichkeit? 2-4 Sätze, direkt, kein Verkäufer-Sprech." },
      openQuestions: { type: "array", items: { type: "string" }, description: "Was muss vor dem Termin geklärt werden?" },
      citations: {
        type: "array",
        items: { type: "object", properties: { label: { type: "string" }, url: { type: "string" } }, required: ["label", "url"] },
        description: "Nur Quellen aus dem Recherche-Material oben. Keine erfundenen URLs.",
      },
    },
    required: ["headline", "status", "companyContext", "talkingPoints", "conceptProposal", "openQuestions"],
  },
};

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
        tools: [BRIEF_TOOL],
        tool_choice: { type: "tool", name: "emit_meeting_brief" },
        messages: [{ role: "user", content: userMessage }],
      },
      { signal: controller.signal },
    );
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(
        locale === "en"
          ? "Research synthesis took too long. Please try again."
          : "Die Recherche-Synthese hat zu lange gedauert. Bitte nochmal versuchen.",
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  const toolBlock = response.content.find((b) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    return { brief: buildMockBrief(event, research, locale), isMock: true };
  }

  const validated = meetingBriefSchema.safeParse(toolBlock.input);
  if (!validated.success) {
    // eslint-disable-next-line no-console
    console.error("[synthesize] tool input failed schema:", validated.error.flatten());
    return { brief: buildMockBrief(event, research, locale), isMock: true };
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
    lines.push(
      "Create the briefing via the emit_meeting_brief tool. Fields concrete and verifiable, no platitudes. Leave companyContext empty if there is no external company. Use only URLs from the research material above as citations, invent none.",
    );
  } else {
    lines.push("AUFGABE:");
    lines.push(
      "Erstelle das Briefing über das Tool emit_meeting_brief. Felder konkret und nachprüfbar, keine Plattitüden. companyContext leer lassen, wenn keine externe Firma im Spiel ist. Nutze als citations nur URLs aus dem Recherche-Material oben, erfinde keine.",
    );
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
