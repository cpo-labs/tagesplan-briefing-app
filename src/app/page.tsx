import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CONTACT_EMAIL } from "@/lib/constants";
import { LandingEmailGate } from "./LandingEmailGate";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <>
      {/* ─── Pagehero (Sand-Accent, asymmetrisch) ────────────────── */}
      <header className="pagehero accent--sand">
        <span className="pagehero__blob" aria-hidden />
        <SiteHeader cta={{ href: "/login", label: "Login" }} />

        <div className="pagehero__in">
          <p className="pagehero__tag">Werkzeug &middot; AppSales Labs</p>
          <h1 className="pagehero__title">
            Wach auf, <em>jeder Termin</em><br />
            ist schon gebrieft.
          </h1>
          <p className="pagehero__sub">
            Du gibst uns deinen Kalender. Wir liefern ein 1-Pager-Briefing pro
            Termin: Firma, Person, juengste News, Talking Points, Konzept-Idee.
            Recherche von Tavily, Synthese von Claude.
          </p>

          <div style={{ marginTop: "2.4rem", maxWidth: "32rem" }}>
            <LandingEmailGate />
          </div>

          <p
            style={{
              marginTop: "1.4rem",
              fontFamily: "var(--mono)",
              fontSize: "0.74rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(250,247,242,0.62)",
            }}
          >
            Kostenlos &middot; 3 Briefings pro E-Mail &middot; kein Newsletter
          </p>
        </div>
      </header>

      {/* ─── Toolpage: drei Wege ─────────────────────────────────── */}
      <section className="toolpage" id="how">
        <div className="toolpage__in">
          <div className="toolpage__intro">
            <div>
              <p className="eyebrow">Drei Wege rein</p>
              <h2 className="toolpage__heading">
                Such dir aus, wie du uns deinen Kalender gibst.
              </h2>
            </div>
            <p className="toolpage__copy">
              Wir bauen die Pipeline so, wie es fuer dich Sinn ergibt. iCal-Link
              ist am schnellsten, Google-OAuth am bequemsten, Service-Mail am
              sichersten. Alle drei landen am selben Briefing.
            </p>
          </div>

          <div className="calsrc-grid">
            <article className="calsrc accent--petrol">
              <p className="calsrc__cap">
                Variante <b>A</b>
              </p>
              <h3 className="calsrc__title">iCal-URL einkleben</h3>
              <p className="calsrc__copy">
                Google, Apple, Outlook — alle koennen eine geheime, read-only
                iCal-Adresse exportieren. Schnellster Weg, kein OAuth-Eiertanz.
              </p>
              <Link href="/login?from=ical" className="calsrc__meta">
                Sofort starten
              </Link>
            </article>

            <article className="calsrc accent--sand">
              <p className="calsrc__cap">
                Variante <b>B</b>
              </p>
              <h3 className="calsrc__title">Service-Mail einladen</h3>
              <p className="calsrc__copy">
                Du teilst deinen Google-Kalender mit{" "}
                <code
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "0.88em",
                    background: "var(--cream-2)",
                    padding: "0.06em 0.34em",
                    borderRadius: "5px",
                    color: "var(--coral-deep)",
                  }}
                >
                  briefing@appsales-consulting.com
                </code>
                . Read-only. Wir pollen, sobald du ein Briefing willst.
              </p>
              <Link href="/login?from=share" className="calsrc__meta">
                Anleitung sehen
              </Link>
            </article>

            <article className="calsrc accent--coral">
              <p className="calsrc__cap">
                Variante <b>C</b>
              </p>
              <h3 className="calsrc__title">Mit Google verbinden</h3>
              <p className="calsrc__copy">
                OAuth-Login mit Google. Bequemster Weg fuer Workspace-Nutzer.
                Wir lesen ausschliesslich deine Termine — sonst nichts.
              </p>
              <Link href="/login?from=google" className="calsrc__meta">
                Verbinden
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* ─── Was du bekommst ─────────────────────────────────────── */}
      <section
        style={{
          background: "var(--cream-2)",
          padding: "clamp(4rem,8vw,7rem) 0",
        }}
      >
        <div
          className="grid items-start gap-[clamp(2rem,4vw,4rem)] mx-auto md:grid-cols-[1.1fr_1fr]"
          style={{
            maxWidth: "78rem",
            paddingLeft: "var(--gut)",
            paddingRight: "var(--gut)",
          }}
        >
          <div>
            <p className="eyebrow">Pro Termin</p>
            <h2
              className="mt-4"
              style={{
                fontWeight: 600,
                fontSize: "clamp(1.7rem,3.2vw,2.4rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.025em",
                maxWidth: "24ch",
              }}
            >
              Eine Karte, die du wirklich lesen willst.
            </h2>
            <p className="mt-5" style={{ color: "var(--soft)", lineHeight: 1.65, maxWidth: "44ch" }}>
              Keine generischen "Hier sind 7 Punkte ueber das Unternehmen"-Texte.
              Direkte Lage-Einschaetzung, drei bis fuenf Anker fuers Gespraech,
              ein konkreter Vorschlag fuer das Konzept.
            </p>
            <ul className="mt-7 space-y-3" style={{ color: "var(--ink)", fontSize: "0.97rem", lineHeight: 1.55 }}>
              <Feature>Firmenkontext (Branche, Standort, Produkt)</Feature>
              <Feature>Juengste News der letzten 90 Tage</Feature>
              <Feature>Personen-Hinweise (Rolle, Hintergrund)</Feature>
              <Feature>Konkretes Konzept fuer den Termin</Feature>
              <Feature>Offene Fragen vor dem Gespraech</Feature>
              <Feature>Verlinkte Quellen</Feature>
            </ul>
          </div>

          <MockBriefCard />
        </div>
      </section>

      {/* ─── Pipeline-Erklaerung ─────────────────────────────────── */}
      <section style={{ background: "var(--cream)", padding: "clamp(4rem,8vw,7rem) 0" }}>
        <div
          style={{
            maxWidth: "78rem",
            margin: "0 auto",
            paddingLeft: "var(--gut)",
            paddingRight: "var(--gut)",
          }}
        >
          <p className="eyebrow">Pipeline</p>
          <h2
            className="mt-4"
            style={{
              fontWeight: 600,
              fontSize: "clamp(1.7rem,3.2vw,2.4rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.025em",
              maxWidth: "32ch",
            }}
          >
            Drei Schritte zwischen Kalender und Briefing.
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <StepNum
              num="01"
              title="Kalender holen"
              body="iCal-Link, Service-Mail-Share oder OAuth. Wir holen die Termine fuer den gewaehlten Tag, parsen Titel und Attendees, leiten Firma und Person ab."
              tone="petrol"
            />
            <StepNum
              num="02"
              title="Recherche"
              body="Tavily liefert pro Termin saubere Snippets zu Firma, juengsten News und Person. Kein Scraping, keine Bullshit-Quellen — was reinkommt, ist verlinkbar."
              tone="sand"
            />
            <StepNum
              num="03"
              title="Synthese"
              body="Claude Sonnet 4.6 verdichtet zu einem Briefing: Status, Talking Points, Konzept-Vorschlag, offene Fragen. AI-Slop wird gefiltert."
              tone="coral"
            />
          </div>
        </div>
      </section>

      {/* ─── Bottom-CTA (dunkel) ─────────────────────────────────── */}
      <section
        className="grain grain--dark"
        style={{
          background: "var(--ink-deep)",
          color: "var(--cream)",
          padding: "clamp(4rem,8vw,7rem) var(--gut)",
        }}
      >
        <div style={{ maxWidth: "78rem", margin: "0 auto" }}>
          <div className="grid items-end gap-[2.4rem] md:grid-cols-[1.4fr_1fr]">
            <div>
              <p
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "0.78rem",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--coral)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.6rem",
                }}
              >
                <span style={{ width: "1.6rem", height: "2px", background: "var(--coral)" }} />
                Probiers aus
              </p>
              <h2
                style={{
                  marginTop: "1.2rem",
                  fontWeight: 600,
                  fontSize: "clamp(2rem,4vw,3.2rem)",
                  lineHeight: 1.04,
                  letterSpacing: "-0.025em",
                  maxWidth: "20ch",
                }}
              >
                Ein Login, drei Briefings,<br />
                kein Bullshit.
              </h2>
              <p
                style={{
                  marginTop: "1.4rem",
                  color: "rgba(250,247,242,0.78)",
                  lineHeight: 1.6,
                  maxWidth: "42ch",
                }}
              >
                Du bekommst einen Magic Link auf deine Mail. Klicken, drin sein.
                Kein Passwort, kein Tracking, keine Newsletter.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <Link href="/login" className="pill pill--coral pill--arrow">
                Briefing erzeugen
              </Link>
              <Link href={`mailto:${CONTACT_EMAIL}`} className="pill pill--ghost-dark">
                Schreib uns
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────── */

function StepNum({
  num,
  title,
  body,
  tone,
}: {
  num: string;
  title: string;
  body: string;
  tone: "coral" | "petrol" | "sand";
}) {
  const accent = { coral: "var(--coral)", petrol: "var(--petrol)", sand: "var(--sand)" }[tone];
  return (
    <article
      style={{
        background: "#fff",
        border: "1px solid rgba(24,20,16,0.08)",
        borderRadius: "var(--rm)",
        padding: "1.8rem 1.9rem 2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: "0.78rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: accent,
          }}
        >
          {num}
        </span>
        <span style={{ display: "block", width: "0.6rem", height: "0.6rem", borderRadius: "100px", background: accent }} />
      </div>
      <h3 style={{ fontWeight: 600, fontSize: "1.2rem", letterSpacing: "-0.015em" }}>{title}</h3>
      <p style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "var(--soft)" }}>{body}</p>
    </article>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden
        className="mt-2 block h-2.5 w-2.5 rounded-sm flex-none"
        style={{ background: "var(--sand)" }}
      />
      <span>{children}</span>
    </li>
  );
}

function MockBriefCard() {
  return (
    <div
      style={{
        position: "relative",
        background: "#fff",
        border: "1px solid rgba(24,20,16,0.08)",
        borderRadius: "var(--rl)",
        padding: "1.8rem",
        boxShadow: "0 26px 60px -34px rgba(24,20,16,0.32)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "4px",
          background: "var(--coral)",
          borderTopLeftRadius: "var(--rl)",
          borderBottomLeftRadius: "var(--rl)",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: "0.7rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--coral)",
          }}
        >
          10:30 &middot; Industriehersteller
        </span>
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: "0.66rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--soft)",
          }}
        >
          DACH-Service
        </span>
      </div>
      <h3 className="h3 mt-3">Wo stehen wir?</h3>
      <p className="mt-3" style={{ color: "var(--ink)", fontSize: "0.95rem", lineHeight: 1.6 }}>
        Erstgespraech mit dem Leiter Aftermarket. Bereich wurde 2024 in eigene
        GmbH ueberfuehrt, suchen jetzt einen Service-Daten-Layer.
      </p>
      <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(24,20,16,0.08)" }}>
        <p className="mono-label">Talking Points</p>
        <ul className="mt-3 space-y-2" style={{ fontSize: "0.92rem", lineHeight: 1.55 }}>
          <li className="flex gap-2">
            <span
              className="mt-2 block h-1.5 w-1.5 rounded-full flex-none"
              style={{ background: "var(--coral)" }}
            />
            <span>Wer eigentlich hat die Service-Daten-Hoheit?</span>
          </li>
          <li className="flex gap-2">
            <span
              className="mt-2 block h-1.5 w-1.5 rounded-full flex-none"
              style={{ background: "var(--coral)" }}
            />
            <span>Wie liefert ihr heute Wartungspakete an Kunden?</span>
          </li>
          <li className="flex gap-2">
            <span
              className="mt-2 block h-1.5 w-1.5 rounded-full flex-none"
              style={{ background: "var(--coral)" }}
            />
            <span>SAP-Migration: blockiert oder Chance?</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
