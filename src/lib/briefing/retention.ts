/**
 * Aufbewahrungs-Logik fuer oeffentliche Briefing-Permalinks.
 *
 * Permalinks (`/briefings/[slug]`) tragen echte Kalender-/Personendaten ohne
 * Login. Damit sie nicht dauerhaft erreichbar bleiben, laufen sie nach
 * `BRIEFING_TTL_DAYS` ab `createdAt` ab. Wir berechnen das hier aus dem
 * vorhandenen `createdAt` — keine zusaetzliche Spalte noetig.
 */

import { BRIEFING_TTL_DAYS, BRIEFING_TTL_MS } from "@/lib/constants";

export { BRIEFING_TTL_DAYS };

/** Ablaufzeitpunkt eines Briefings (createdAt + TTL). */
export function expiresAt(createdAt: Date | string | number): Date {
  const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
  return new Date(created.getTime() + BRIEFING_TTL_MS);
}

/**
 * Ist das Briefing abgelaufen? Vergleicht `createdAt + TTL` mit jetzt.
 * `now` ist injizierbar, damit die Logik testbar bleibt.
 */
export function isBriefingExpired(
  createdAt: Date | string | number,
  now: Date = new Date(),
): boolean {
  return now.getTime() >= expiresAt(createdAt).getTime();
}
