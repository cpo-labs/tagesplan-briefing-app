/**
 * Synthesise one meeting brief from a CalendarEvent + ResearchBundle.
 * Single LLM call per meeting. We use a structured JSON schema so the
 * Result Page can render typed cards instead of free-form text.
 */

import Anthropic from "@anthropic-ai/sdk";
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
  /**
   * Explizit benannte Recherche-Luecken (z. B. "News-Recherche fehlgeschlagen").
   * Wird gesetzt, wenn einzelne Queries scheitern. Sichtbar im Brief statt
   * still verschluckt.
   */
  gaps: z.array(z.string()).default([]),
});

export type MeetingBrief = z.infer<typeof meetingBriefSchema>;

export interface SynthesiseResult {
  brief: MeetingBrief;
  isMock: boolean;
}

// Token-Budget: 1500 reichte fuer reichhaltige Briefings nicht immer, das
// Tool-JSON kam abgeschnitten an (stop_reason=max_tokens) und fiel dann in den
// Mock. 3000 als Normal-Budget, 4500 fuer den einmaligen Nachschlag bei
// Truncation.
const MAX_TOKENS = 3000;
const MAX_TOKENS_RETRY = 4500;

// Anthropic-Retry auf transiente Fehler (429/Verbindung). Bis zu 3 Versuche.
const ANTHROPIC_MAX_RETRIES = 2;
const ANTHROPIC_BASE_BACKOFF_MS = 800;
const ANTHROPIC_MAX_BACKOFF_MS = 8_000;

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
      gaps: {
        type: "array",
        items: { type: "string" },
        description: "Benenne hier jede Recherche-Luecke, die dir im Material genannt wurde (z. B. 'News-Recherche fehlgeschlagen'), woertlich uebernommen. Erfinde keine Luecken, lass das Feld leer, wenn keine genannt wurden.",
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

  // Erster Versuch mit Normal-Budget. Wenn das Modell wegen max_tokens
  // abbricht (stop_reason="max_tokens"), kann das Tool-JSON abgeschnitten sein
  // -> einmaliger Nachschlag mit groesserem Budget statt Mock-Fallback.
  let response = await callBrief(client, userMessage, locale, MAX_TOKENS);

  if (response.stop_reason === "max_tokens") {
    // eslint-disable-next-line no-console
    console.warn("[synthesize] stop_reason=max_tokens, retry mit hoeherem Budget");
    response = await callBrief(client, userMessage, locale, MAX_TOKENS_RETRY);
  }

  const toolBlock = response.content.find((b) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    // eslint-disable-next-line no-console
    console.error(`[synthesize] kein tool_use Block (stop_reason=${response.stop_reason})`);
    return { brief: buildMockBrief(event, research, locale), isMock: true };
  }

  const validated = meetingBriefSchema.safeParse(toolBlock.input);
  if (!validated.success) {
    // eslint-disable-next-line no-console
    console.error("[synthesize] tool input failed schema:", validated.error.flatten());
    return { brief: buildMockBrief(event, research, locale), isMock: true };
  }

  // Recherche-Luecken aus der research-Schicht IMMER spiegeln, auch wenn das
  // Modell sie nicht aufgegriffen hat. Dedup gegen vom Modell genannte.
  const merged = mergeGaps(scrubSlop(validated.data), research.gaps);
  return { brief: merged, isMock: false };
}

/**
 * Ein Anthropic-Call mit Retry auf transiente Fehler (RateLimit/Connection).
 * 60s-Hardcap pro Versuch ueber AbortController. Permanente Fehler werfen sofort.
 */
async function callBrief(
  client: Anthropic,
  userMessage: string,
  locale: Locale,
  maxTokens: number,
): Promise<Anthropic.Message> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= ANTHROPIC_MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    try {
      return await client.messages.create(
        {
          model: env.anthropicModel,
          max_tokens: maxTokens,
          system: briefingSystemPrompt(locale),
          tools: [BRIEF_TOOL],
          tool_choice: { type: "tool", name: "emit_meeting_brief" },
          messages: [{ role: "user", content: userMessage }],
        },
        { signal: controller.signal },
      );
    } catch (err) {
      lastErr = err;
      if (controller.signal.aborted) {
        throw new Error(
          locale === "en"
            ? "Research synthesis took too long. Please try again."
            : "Die Recherche-Synthese hat zu lange gedauert. Bitte nochmal versuchen.",
        );
      }
      const retryable =
        err instanceof Anthropic.RateLimitError ||
        err instanceof Anthropic.APIConnectionError;
      if (!retryable || attempt === ANTHROPIC_MAX_RETRIES) throw err;

      const wait = Math.min(
        ANTHROPIC_BASE_BACKOFF_MS * 2 ** attempt + Math.random() * ANTHROPIC_BASE_BACKOFF_MS,
        ANTHROPIC_MAX_BACKOFF_MS,
      );
      // eslint-disable-next-line no-console
      console.warn(`[synthesize] Anthropic transient error, retry in ${Math.round(wait)}ms`);
      await new Promise((r) => setTimeout(r, wait));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Anthropic call failed");
}

/** Fuegt research-Luecken in den Brief ein, dedupliziert gegen bereits genannte. */
function mergeGaps(brief: MeetingBrief, researchGaps: string[]): MeetingBrief {
  if (researchGaps.length === 0) return brief;
  // Normalisierung: Trailing-Satzzeichen + Whitespace egal, damit
  // "...(HTTP 429)" und "...(HTTP 429)." als dieselbe Luecke gelten.
  const norm = (g: string): string => g.trim().toLowerCase().replace(/[.!?]+$/, "");
  const existing = new Set(brief.gaps.map(norm));
  const extra = researchGaps.filter((g) => !existing.has(norm(g)));
  if (extra.length === 0) return brief;
  return { ...brief, gaps: [...brief.gaps, ...extra] };
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

  // Recherche-Luecken explizit an das Modell geben, damit sie im Brief landen
  // statt still verloren zu gehen.
  if (research.gaps.length > 0) {
    lines.push("");
    lines.push(en ? "RESEARCH GAPS (name these in the gaps field):" : "RECHERCHE-LUECKEN (im Feld gaps benennen):");
    for (const g of research.gaps) lines.push(`- ${g}`);
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

/**
 * Ehrlicher Demo-Brief, wenn keine Recherche moeglich ist (kein Key). Wird
 * klar als "Demo ohne Recherche" gekennzeichnet und tarnt sich NICHT als
 * echte Talking Points. Kein Entwickler-Jargon im nutzersichtbaren Text.
 */
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
      ? `${en ? "Demo without research" : "Demo ohne Recherche"}: ${note}`
      : en
        ? "Demo without research: this briefing is built from the calendar entry only, with no live web research."
        : "Demo ohne Recherche: dieses Briefing entsteht nur aus dem Kalender-Eintrag, ohne Live-Web-Recherche.",
    companyContext: research.hints.companyGuess
      ? en
        ? `Company (guess from the meeting): ${research.hints.companyGuess}. With research switched on, this block fills with real context.`
        : `Firma (aus dem Termin geraten): ${research.hints.companyGuess}. Mit eingeschalteter Recherche fuellt sich dieser Block mit echtem Kontext.`
      : en
        ? "Company unclear: the meeting title gives no hint and there are no external attendees."
        : "Firma nicht eindeutig: der Termin-Titel liefert keinen Hinweis und es gibt keine externen Teilnehmer.",
    personContext: research.hints.personGuess
      ? en
        ? `Person (guess from the meeting): ${research.hints.personGuess}.`
        : `Person (aus dem Termin geraten): ${research.hints.personGuess}.`
      : undefined,
    recentNews: [],
    talkingPoints: en
      ? [
          "This is a demo view: real talking points appear once research is active.",
          "For now, prep from your own notes on this meeting.",
        ]
      : [
          "Das ist eine Demo-Ansicht: echte Gespraechs-Anker erscheinen, sobald die Recherche aktiv ist.",
          "Bis dahin: bereite dich aus deinen eigenen Notizen zum Termin vor.",
        ],
    conceptProposal: en
      ? "Real research is off for this run, so this is a placeholder view rather than a usable briefing."
      : "Fuer diesen Lauf ist die echte Recherche aus, daher ist dies eine Platzhalter-Ansicht und kein einsatzfertiges Briefing.",
    openQuestions: en
      ? ["What exactly is this meeting about?"]
      : ["Worum geht es genau in diesem Termin?"],
    citations: [],
    gaps: [
      en
        ? "No live web research in this demo view."
        : "Keine Live-Web-Recherche in dieser Demo-Ansicht.",
    ],
  };
}
