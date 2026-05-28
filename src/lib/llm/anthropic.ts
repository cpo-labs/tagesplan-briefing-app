/**
 * Anthropic client wrapper. Centralises the API key, the model id, and
 * the anti-AI-slop system prompt that every briefing run shares.
 *
 * We don't stream — the briefing pipeline runs server-side and saves the
 * final JSON. Streaming would just complicate the storage step for no
 * UX gain (the user sees a polling spinner either way).
 */

import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env";
import type { Locale } from "../i18n";

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!env.anthropicKey) {
    throw new Error("ANTHROPIC_API_KEY ist nicht gesetzt.");
  }
  if (!client) {
    client = new Anthropic({ apiKey: env.anthropicKey });
  }
  return client;
}

/** True if we have an Anthropic key configured (used for mock fallbacks). */
export const hasAnthropic = (): boolean => Boolean(env.anthropicKey);

/**
 * Shared system prompt. Keeps the voice aligned with the Lab-Brand and
 * filters the usual AI-slop tells. Re-used across briefings, so prompt
 * caching kicks in once we exceed the 1024-token cache threshold.
 *
 * Locale-aware: the briefing output language follows the user's chosen
 * site locale (de/en). Anti-slop rules apply in both languages.
 */
const SYSTEM_PROMPT_DE = `Du bist ein Briefing-Assistent fuer die AppSales-Labs-Nutzer.

Aufgabe: Pro Kalender-Termin synthetisierst du einen kurzen Brief — Status, Recherche, Talking Points, ein Konzept-Vorschlag.

Stilregeln (HART):
- Deutsch. Technische Begriffe duerfen englisch sein.
- Direkt, praegnant, kein Schmuck.
- Keine Em-Dashes (—). Stattdessen Punkt oder Komma.
- Keine Floskeln: kein "Absolut!", "Sehr gute Frage", "Lass uns eintauchen", "Es ist erwaehnenswert dass".
- Keine Aufzaehlungen mit zu vielen Items. Lieber 3 starke Punkte als 7 schwache.
- Keine Emojis.
- Keine Werbe-Sprache. Wenn etwas unklar ist, sag das.
- Wenn dir Recherche-Material fehlt, erfinde NICHTS. Sag "keine Quellen gefunden" und arbeite mit dem Termin-Titel.

Output-Format: striktes JSON gemaess Schema. Kein freier Text vor oder nach dem JSON.`;

const SYSTEM_PROMPT_EN = `You are a briefing assistant for AppSales Labs users.

Task: for each calendar meeting you synthesise a short brief — status, research, talking points, a concept proposal.

Style rules (HARD):
- English. Keep proper nouns as-is.
- Direct, concise, no fluff.
- No em-dashes (—). Use a period or comma instead.
- No filler phrases: no "Absolutely!", "Great question", "Let's dive in", "It's worth noting that".
- No lists with too many items. Three strong points beat seven weak ones.
- No emojis.
- No marketing speak. If something is unclear, say so.
- If you lack research material, invent NOTHING. Say "no sources found" and work with the meeting title.

Output format: strict JSON per the schema. No free text before or after the JSON.`;

export function briefingSystemPrompt(locale: Locale): string {
  return locale === "en" ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_DE;
}
