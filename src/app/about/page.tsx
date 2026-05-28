import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "So funktioniert's — Tagesplan-Briefing",
};

export default function AboutPage() {
  return (
    <>
      <section
        className="grain"
        style={{ background: "var(--cream)", color: "var(--ink)" }}
      >
        <SiteHeader cta={{ href: "/login", label: "Briefing erzeugen" }} />

        <div className="gut" style={{ padding: "4rem 0 5rem", maxWidth: "62rem", margin: "0 auto" }}>
          <p className="eyebrow">So funktioniert&apos;s</p>
          <h1 className="display mt-6 text-[clamp(2.4rem,5vw,4rem)] leading-[0.95]">
            Was passiert,<br />
            wenn du <em style={{ color: "var(--coral)", fontStyle: "normal" }}>einen Link</em> teilst?
          </h1>
          <p className="lead mt-6">
            Kurz: Wir holen einmalig deinen Kalender ab, picken die Termine fuer den
            gewaehlten Tag, recherchieren pro Termin und schreiben ein Briefing.
            Permalink, teilbar, in deinem Account hinterlegt.
          </p>

          <div className="mt-14 space-y-12">
            <Step
              num="01"
              title="Du gibst uns einen iCal-Link"
              body="Der Link ist read-only. Wir holen den Kalender einmal pro Briefing ab, parsen die .ics-Datei lokal, und vergessen die URL nicht — sie ist mit dem Briefing in der DB, sodass du sie nicht jedes Mal neu eingeben musst. Wir greifen nicht auf andere Kalender oder andere Daten zu."
            />
            <Step
              num="02"
              title="Wir parsen die Termine fuer den Tag"
              body="Pro Termin ziehen wir: Titel, Beschreibung, Ort, Start- und Endzeit, Organizer, Teilnehmer. Aus den Teilnehmer-E-Mail-Domains schliessen wir auf die Firma. Aus dem Titel und der Beschreibung leiten wir Person und Anlass ab. Keine 100% — Heuristik."
            />
            <Step
              num="03"
              title="Recherche via Tavily"
              body="Tavily ist eine LLM-freundliche Suchmaschine. Wir feuern bis zu drei Queries pro Termin (Firma allgemein, Firma News der letzten 90 Tage, Person + Firma fuer Profil-Hint). Wir nutzen nur das, was Tavily uns als clean snippets zurueckgibt — kein Scraping."
            />
            <Step
              num="04"
              title="Synthese via Claude Sonnet 4.6"
              body="Wir geben Claude den Termin und die Recherche-Snippets und bitten um ein striktes JSON: Status, Firma, Person, juengste News, Talking Points, Konzept-Vorschlag, offene Fragen, Quellen. System-Prompt filtert AI-Slop (kein 'Lass uns eintauchen', keine Em-Dash-Inflation)."
            />
            <Step
              num="05"
              title="Permalink-Seite"
              body="Du landest auf einer Seite mit einer Karte pro Termin. Der Permalink ist teilbar, aber niemand kommt ueber Suchmaschinen drauf — kein Sitemap-Eintrag. Das Briefing bleibt in deinem Account abrufbar."
            />
          </div>

          <div className="mt-16 surface p-8 md:p-10">
            <p className="eyebrow">Limits</p>
            <h2 className="h3 mt-3">3 Briefings pro Mail-Adresse. Das ist Absicht.</h2>
            <p className="mt-4 leading-relaxed" style={{ color: "var(--soft)" }}>
              Das Tool ist ein Lead-Magnet, kein SaaS. Christian sponsort die API-Kosten,
              damit du es ausprobieren kannst. Wenn du es danach oefter brauchst, schreib
              ihm — er hebt das Limit hoch, oder ihr ueberlegt, ob daraus etwas richtiges
              wird.
            </p>
            <Link
              href="mailto:c.poral@elunic.com?subject=Tagesplan-Briefing"
              className="pill pill--ink pill--arrow mt-6"
            >
              Christian schreiben
            </Link>
          </div>

          <div className="mt-12">
            <p className="eyebrow">Datenschutz</p>
            <ul
              className="mt-5 space-y-3 text-[0.95rem] leading-relaxed"
              style={{ color: "var(--soft)" }}
            >
              <li>Deine Mail-Adresse: fuer Login und Rate-Limit, nicht fuer Newsletter.</li>
              <li>Dein iCal-Link: im Briefing-Datensatz hinterlegt. Du kannst loeschen lassen (Mail an Christian).</li>
              <li>Recherche-Snippets: nicht persistiert. Nur das gerenderte Briefing bleibt.</li>
              <li>Kein Tracking, kein Analytics-Pixel.</li>
            </ul>
          </div>
        </div>

        <SiteFooter />
      </section>
    </>
  );
}

function Step({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-[5rem_1fr] md:gap-8">
      <span
        className="font-mono text-[1.1rem] font-semibold tracking-wider"
        style={{ color: "var(--coral)" }}
      >
        {num}
      </span>
      <div>
        <h3 className="h3">{title}</h3>
        <p className="mt-3 leading-relaxed" style={{ color: "var(--soft)" }}>
          {body}
        </p>
      </div>
    </div>
  );
}
