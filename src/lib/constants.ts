/**
 * App-weite Konstanten. Nichts environment-spezifisches hier — fuer das
 * gehoert env.ts. Reine "war frueher hardcoded an 6 Stellen"-Sachen.
 */

/**
 * Lead-Kontakt fuer alle "Schreib uns"-CTAs.
 *
 * `NEXT_PUBLIC_*` prefix is required because this constant is imported by
 * client components (CTA links, footer). A plain `CONTACT_EMAIL` env var
 * would resolve to `undefined` in the browser bundle and silently fall
 * through to the default — confusing if you later try to override the
 * address via Vercel.
 */
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "info@appsales-consulting.de";

/** Mit Subject vorgespannte mailto-Helfer fuer Lab-Tool-CTAs. */
export const CONTACT_MAILTO_TAGESPLAN = `mailto:${CONTACT_EMAIL}?subject=Tagesplan-Briefing`;

/**
 * Aufbewahrungsdauer fuer oeffentliche Briefing-Permalinks (in Tagen).
 *
 * Permalinks tragen echte Kalender-/Personendaten ohne Login. Sie duerfen
 * nicht dauerhaft erreichbar bleiben. Wir nutzen `createdAt + TTL` und pruefen
 * beim Lesen, ob das Briefing abgelaufen ist (On-Read-Check). Ein echter
 * Cleanup-Cron (Loeschen der Zeile) ist Phase 2 — die On-Read-Pruefung stoppt
 * die dauerhafte Datenexposition bereits jetzt.
 */
export const BRIEFING_TTL_DAYS = 30;

/** Abgeleitete TTL in Millisekunden fuer Date-Vergleiche. */
export const BRIEFING_TTL_MS = BRIEFING_TTL_DAYS * 24 * 60 * 60 * 1000;
