import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CONTACT_MAILTO_TAGESPLAN } from "@/lib/constants";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "So funktioniert's — Tagesplan-Briefing",
};

export default async function AboutPage() {
  const locale = await getLocale();
  const dict = t(locale);
  return (
    <>
      <header className="pagehero accent--petrol">
        <span className="pagehero__blob" aria-hidden />
        <SiteHeader cta={{ href: "/#calendar-form", label: dict.bottomCta.primary }} locale={locale} />

        <div className="pagehero__in">
          <p className="pagehero__tag">So funktioniert&apos;s</p>
          <h1 className="pagehero__title">
            Was passiert,<br />
            wenn du <em>einen Link</em> teilst?
          </h1>
          <p className="pagehero__sub">
            Kurz: Wir holen einmalig deinen Kalender ab, picken die Termine
            fuer den gewaehlten Tag, recherchieren pro Termin und schreiben
            ein Briefing. Permalink, teilbar, in deinem Account hinterlegt.
          </p>
        </div>
      </header>

      <section className="toolpage">
        <div className="toolpage__in" style={{ maxWidth: "62rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(2rem,3.5vw,3rem)" }}>
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

          <div
            style={{
              marginTop: "clamp(3rem,5vw,5rem)",
              padding: "clamp(2rem,3vw,2.6rem)",
              background: "#fff",
              border: "1px solid rgba(24,20,16,0.1)",
              borderRadius: "var(--rl)",
              boxShadow: "0 18px 40px -28px rgba(24,20,16,0.2)",
            }}
          >
            <p className="eyebrow">Limits</p>
            <h2 className="h3 mt-3">3 Briefings pro Mail-Adresse. Das ist Absicht.</h2>
            <p className="mt-4 leading-relaxed" style={{ color: "var(--soft)" }}>
              Das Tool ist ein Lead-Magnet, kein SaaS. Wir sponsern die
              API-Kosten, damit du es ausprobieren kannst. Wenn du es danach
              oefter brauchst, schreib uns &mdash; wir heben das Limit, oder wir
              ueberlegen gemeinsam, ob daraus etwas Richtiges wird.
            </p>
            <Link href={CONTACT_MAILTO_TAGESPLAN} className="pill pill--ink pill--arrow mt-6">
              Schreib uns
            </Link>
          </div>

          <div style={{ marginTop: "clamp(2.5rem,4vw,3.5rem)" }}>
            <p className="eyebrow">Datenschutz</p>
            <ul
              className="mt-5 space-y-3"
              style={{ color: "var(--soft)", fontSize: "0.95rem", lineHeight: 1.6 }}
            >
              <li>Deine Mail-Adresse: fuer Login und Rate-Limit, nicht fuer Newsletter.</li>
              <li>Dein iCal-Link: im Briefing-Datensatz hinterlegt. Du kannst loeschen lassen (Mail an uns).</li>
              <li>Recherche-Snippets: nicht persistiert. Nur das gerenderte Briefing bleibt.</li>
              <li>Kein Tracking, kein Analytics-Pixel.</li>
            </ul>
          </div>
        </div>
      </section>

      <SiteFooter locale={locale} />
    </>
  );
}

function Step({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div
      style={{
        display: "grid",
        gap: "1rem 2rem",
        gridTemplateColumns: "5rem 1fr",
        alignItems: "start",
      }}
    >
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: "1.1rem",
          fontWeight: 700,
          letterSpacing: "0.06em",
          color: "var(--petrol)",
        }}
      >
        {num}
      </span>
      <div>
        <h3
          style={{
            fontWeight: 600,
            fontSize: "1.25rem",
            letterSpacing: "-0.015em",
          }}
        >
          {title}
        </h3>
        <p className="mt-3" style={{ color: "var(--soft)", lineHeight: 1.65 }}>
          {body}
        </p>
      </div>
    </div>
  );
}
