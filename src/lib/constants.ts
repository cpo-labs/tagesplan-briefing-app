/**
 * App-weite Konstanten. Nichts environment-spezifisches hier — fuer das
 * gehoert env.ts. Reine "war frueher hardcoded an 6 Stellen"-Sachen.
 */

/** Lead-Kontakt fuer alle "Schreib uns"-CTAs. Default kann via ENV ueberschrieben werden. */
export const CONTACT_EMAIL =
  process.env.CONTACT_EMAIL ?? "hello@appsales-consulting.de";

/** Mit Subject vorgespannte mailto-Helfer fuer Lab-Tool-CTAs. */
export const CONTACT_MAILTO_TAGESPLAN = `mailto:${CONTACT_EMAIL}?subject=Tagesplan-Briefing`;
