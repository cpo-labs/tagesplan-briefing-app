/**
 * Fester Demo-Tagesplan fuer den "Beispiel ansehen"-Pfad. Zeigt einen
 * fertigen Tag OHNE Eingabe und OHNE Kalender-Link, damit der erste Aha-Moment
 * vor jeder Trust-Wall kommt.
 *
 * Alle Namen sind erfunden. KEINE echten Kunden, keine realen Personen.
 */

import type { BriefingPayload } from "./pipeline";
import type { Locale } from "../i18n";

function isoToday(hour: number, minute: number): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function buildDemoPayload(locale: Locale): BriefingPayload {
  const en = locale === "en";
  return {
    date: new Date().toISOString().slice(0, 10),
    generatedAt: new Date().toISOString(),
    source: { kind: "ical-url", url: "https://example.com/demo.ics" },
    isMock: false,
    meetings: [
      {
        uid: "demo-1",
        startsAt: isoToday(9, 0),
        endsAt: isoToday(9, 30),
        summary: en ? "Intro call: Nordlicht Maschinenbau" : "Erstgespraech: Nordlicht Maschinenbau",
        location: en ? "Video call" : "Videocall",
        attendees: ["lena.brandt@nordlicht-maschinenbau.example"],
        hints: {
          companyGuess: "Nordlicht Maschinenbau",
          personGuess: "Lena Brandt",
          externalAttendees: ["lena.brandt@nordlicht-maschinenbau.example"],
        },
        brief: {
          headline: en
            ? "First contact with a mid-sized machine builder evaluating automation"
            : "Erstkontakt mit einem mittelstaendischen Maschinenbauer, der Automatisierung prueft",
          status: en
            ? "First call, no prior contact. They reached out after a webinar. Goal of the call: understand where their bottleneck sits."
            : "Erstes Gespraech, kein Vorkontakt. Sie kamen nach einem Webinar auf uns zu. Ziel des Calls: verstehen, wo der Engpass liegt.",
          companyContext: en
            ? "Mid-sized special machine builder, roughly 180 people, two sites. Strong in custom assembly lines, currently expanding their service business."
            : "Mittelstaendischer Sondermaschinenbauer, rund 180 Leute, zwei Standorte. Stark im Sonderanlagenbau, baut gerade das Servicegeschaeft aus.",
          personContext: en
            ? "Lena Brandt leads operations. Engineering background, two years in the role, drives the digitalization topics internally."
            : "Lena Brandt leitet den Betrieb. Ingenieurs-Hintergrund, seit zwei Jahren in der Rolle, treibt intern die Digitalisierungsthemen.",
          recentNews: [
            en
              ? "Announced a new service hub in the south region (last month)."
              : "Hat einen neuen Service-Standort im Sueden angekuendigt (letzter Monat).",
          ],
          talkingPoints: en
            ? [
                "They expand service but still plan it on spreadsheets. Ask how they schedule field technicians today.",
                "The webinar topic was downtime. Tie back to it: where does an unplanned stop hurt them most?",
                "Two sites, one ERP rollout in progress. Good hook for where data is already flowing and where it breaks.",
              ]
            : [
                "Sie bauen Service aus, planen ihn aber noch in Tabellen. Frag, wie sie heute Aussendienst-Techniker einplanen.",
                "Webinar-Thema war Stillstand. Daran andocken: wo tut ein ungeplanter Stopp am meisten weh?",
                "Zwei Standorte, ein ERP-Rollout laeuft. Guter Aufhaenger, wo Daten schon fliessen und wo es bricht.",
              ],
          conceptProposal: en
            ? "Frame the call around their service expansion, not a tool pitch. If scheduling is manual, there is a concrete, small first step worth scoping together."
            : "Das Gespraech um den Service-Ausbau bauen, nicht um ein Tool-Pitch. Wenn die Einsatzplanung manuell ist, gibt es einen konkreten kleinen ersten Schritt, den man gemeinsam abstecken kann.",
          openQuestions: en
            ? ["Who owns the budget for operations tooling?", "Is the ERP rollout blocking new initiatives this year?"]
            : ["Wer hat das Budget fuer Betriebs-Tooling?", "Blockiert der ERP-Rollout dieses Jahr neue Initiativen?"],
          citations: [
            {
              label: en ? "Nordlicht Maschinenbau — company site" : "Nordlicht Maschinenbau — Firmenseite",
              url: "https://example.com/nordlicht",
            },
          ],
          gaps: [],
        },
        citationsExtra: [],
      },
      {
        uid: "demo-2",
        startsAt: isoToday(11, 30),
        endsAt: isoToday(12, 0),
        summary: en ? "Follow-up: Aurum Beratung" : "Folgetermin: Aurum Beratung",
        location: undefined,
        attendees: ["t.keller@aurum-beratung.example"],
        hints: {
          companyGuess: "Aurum Beratung",
          personGuess: "Tobias Keller",
          externalAttendees: ["t.keller@aurum-beratung.example"],
        },
        brief: {
          headline: en
            ? "Second talk with a small consultancy, this time about a concrete pilot"
            : "Zweites Gespraech mit einer kleinen Beratung, diesmal um ein konkretes Pilot-Projekt",
          status: en
            ? "Follow-up after a good first call. They want to see one real workflow before committing."
            : "Folgetermin nach gutem Erstgespraech. Sie wollen einen echten Ablauf sehen, bevor sie sich festlegen.",
          companyContext: en
            ? "Small consultancy, around 12 people, focused on family-owned manufacturers. They sell trust, not headcount."
            : "Kleine Beratung, rund 12 Leute, fokussiert auf familiengefuehrte Hersteller. Sie verkaufen Vertrauen, nicht Mannstaerke.",
          recentNews: [],
          talkingPoints: en
            ? [
                "They asked for one workflow last time. Bring a single, finished example, not a feature tour.",
                "Their clients are conservative. Lead with what stays the same for the end customer, not what changes.",
              ]
            : [
                "Sie wollten letztes Mal einen Ablauf sehen. Bring ein einziges fertiges Beispiel, keine Feature-Tour.",
                "Ihre Kunden sind konservativ. Mit dem anfangen, was fuer den Endkunden gleich bleibt, nicht mit dem, was sich aendert.",
              ],
          conceptProposal: en
            ? "Propose a two-week pilot on one of their own client cases. Small scope, clear before/after, no platform commitment."
            : "Ein zweiwoechiges Pilot-Projekt an einem ihrer eigenen Kundenfaelle vorschlagen. Kleiner Umfang, klares Vorher/Nachher, keine Plattform-Bindung.",
          openQuestions: en
            ? ["Which client case is safe to use as the pilot?"]
            : ["Welcher Kundenfall ist als Pilot unkritisch nutzbar?"],
          citations: [],
          // Eine bewusst sichtbare Luecke, damit der Beispiel-Tag auch das
          // ehrliche "wir erfinden nichts" zeigt.
          gaps: [
            en
              ? "News research returned nothing recent for this company."
              : "Die News-Recherche fand zu dieser Firma nichts Aktuelles.",
          ],
        },
        citationsExtra: [],
      },
    ],
  };
}
