import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CONTACT_EMAIL } from "@/lib/constants";

export default function LandingPage() {
  return (
    <>
      <section
        className="grain grain--dark relative min-h-svh overflow-hidden"
        style={{ background: "var(--ink-deep)", color: "var(--cream)", isolation: "isolate" }}
      >
        <SiteHeader dark cta={{ href: "/login", label: "Briefing erzeugen" }} />

        {/* Atmosphäre */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-[26vmax] -right-[22vmax] h-[58vmax] w-[58vmax] rounded-full"
          style={{
            background: "var(--coral)",
            filter: "blur(72px)",
            opacity: 0.22,
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-[32vmax] -left-[22vmax] h-[60vmax] w-[60vmax] rounded-full"
          style={{
            background: "var(--petrol)",
            filter: "blur(78px)",
            opacity: 0.18,
          }}
        />

        <div
          className="relative grid items-center gap-12 md:gap-16 md:grid-cols-[1.15fr_1fr]"
          style={{ padding: "4rem var(--gut) 6rem" }}
        >
          {/* Text */}
          <div className="max-w-[36rem]">
            <p
              className="fade-up font-mono uppercase tracking-[0.18em] text-[0.78rem]"
              style={{ color: "var(--coral)" }}
            >
              <span
                aria-hidden
                className="inline-block w-6 h-[2px] align-middle mr-3"
                style={{ background: "var(--coral)" }}
              />
              Lead-Magnet aus den Labs
            </p>
            <h1 className="display fade-up fade-up--delay-1 mt-6">
              Kalender rein.<br />
              <em>Briefing</em> raus.
            </h1>
            <p className="lead fade-up fade-up--delay-2 mt-6 text-cream/85">
              Klebe deinen iCal-Link ein, waehle einen Tag, und du bekommst pro Termin
              ein Briefing: Firma, Person, juengste News, Talking Points, Konzept-Idee.
              Recherche von Tavily, Synthese von Claude.
            </p>
            <div className="fade-up fade-up--delay-3 mt-9 flex flex-wrap items-center gap-4">
              <Link href="/login" className="pill pill--coral pill--arrow">
                Login per Magic Link
              </Link>
              <Link href="#how" className="pill pill--ghost-dark">
                So funktioniert&apos;s
              </Link>
            </div>
            <p className="fade-up fade-up--delay-3 mono-label mt-9" style={{ color: "rgba(250,247,242,0.5)" }}>
              <span className="dot-pulse mr-2 align-middle" />
              MVP &middot; 3 Briefings pro Mail-Adresse frei
            </p>
          </div>

          {/* Visual: stacked cards */}
          <div className="relative h-[28rem] md:h-[32rem]">
            <FloatingCardCalendar />
            <FloatingCardBrief />
            <FloatingCardSnippet />
          </div>
        </div>
      </section>

      {/* Wie es funktioniert */}
      <section
        id="how"
        className="grain"
        style={{ background: "var(--cream)", padding: "clamp(5rem,9vw,9rem) 0" }}
      >
        <div className="gut mb-10 md:mb-16 max-w-[64rem]">
          <p className="eyebrow">Drei Schritte</p>
          <h2 className="h2 mt-4">
            Vom Kalender zum <em style={{ color: "var(--coral)", fontStyle: "normal" }}>Briefing</em> in zwei Minuten.
          </h2>
        </div>

        <div className="gut grid gap-7 md:grid-cols-3">
          <StepCard
            num="01"
            title="iCal-Link einkleben"
            body="Google, Apple, Outlook — alle koennen einen geheimen iCal-Link exportieren. Du gibst ihn dem Tool, sonst nichts. Read-only, kein OAuth-Eiertanz."
            tone="petrol"
          />
          <StepCard
            num="02"
            title="Datum waehlen"
            body="Heute oder morgen. Tool zieht die Termine fuer den Tag, schaut sich Titel und Attendees an und leitet Firma und Person ab."
            tone="sand"
          />
          <StepCard
            num="03"
            title="Briefing lesen"
            body="Pro Termin: Web-Recherche (Tavily) plus Synthese (Claude Sonnet 4.6). Status, juengste News, Talking Points, ein Konzept-Vorschlag. Mit Quellenangabe."
            tone="coral"
          />
        </div>
      </section>

      {/* Was du bekommst */}
      <section
        className="grain"
        style={{ background: "var(--cream-2)", padding: "clamp(5rem,9vw,9rem) 0" }}
      >
        <div className="gut max-w-[78rem] grid gap-12 md:grid-cols-[1.1fr_1fr] items-center">
          <div>
            <p className="eyebrow">Pro Termin</p>
            <h2 className="h2 mt-4">Eine Karte, die du wirklich lesen willst.</h2>
            <p className="lead mt-5">
              Keine generischen "Hier sind 7 Punkte ueber das Unternehmen"-Texte.
              Direkte Lage-Einschaetzung, drei bis fuenf Anker fuer das Gespraech,
              ein konkreter Vorschlag fuers Konzept.
            </p>
            <ul
              className="mt-7 space-y-3 text-[0.96rem] leading-relaxed"
              style={{ color: "var(--ink)" }}
            >
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

      {/* CTA */}
      <section
        className="grain grain--dark relative overflow-hidden text-center"
        style={{
          background: "var(--ink-deep)",
          color: "var(--cream)",
          padding: "clamp(5rem,9vw,9rem) var(--gut)",
        }}
      >
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[40vmax] w-[40vmax] rounded-full pointer-events-none"
          style={{ background: "var(--coral)", filter: "blur(80px)", opacity: 0.2 }}
        />
        <p className="eyebrow relative" style={{ color: "var(--coral)" }}>
          Probiers aus
        </p>
        <h2 className="h2 mt-5 relative">Ein Login, drei Briefings, kein Bullshit.</h2>
        <p className="lead mt-5 mx-auto relative text-cream/80">
          Du bekommst einen Magic Link auf deine Mail-Adresse, klickst, bist drin.
          Kein Passwort, kein Tracking, keine Newsletter.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4 relative">
          <Link href="/login" className="pill pill--coral pill--arrow">
            Briefing erzeugen
          </Link>
          <Link href={`mailto:${CONTACT_EMAIL}`} className="pill pill--ghost-dark">
            Christian schreiben
          </Link>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

/* ─── Sub-components (kept local to keep the landing self-contained) ─ */

function StepCard({
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
  const dot = { coral: "var(--coral)", petrol: "var(--petrol)", sand: "var(--sand)" }[tone];
  return (
    <article className="surface relative p-7 md:p-9 flex flex-col gap-5 transition hover:-translate-y-1 hover:shadow-[0_30px_60px_-32px_rgba(24,20,16,0.35)]">
      <div className="flex items-center justify-between">
        <span
          className="font-mono text-[0.75rem] tracking-[0.18em] uppercase"
          style={{ color: "var(--soft)" }}
        >
          {num}
        </span>
        <span className="block h-2 w-2 rounded-full" style={{ background: dot }} />
      </div>
      <h3 className="h3">{title}</h3>
      <p className="text-[0.96rem] leading-relaxed" style={{ color: "var(--soft)" }}>
        {body}
      </p>
    </article>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden
        className="mt-2 block h-3 w-3 rounded-sm flex-none"
        style={{ background: "var(--coral)" }}
      />
      <span>{children}</span>
    </li>
  );
}

/* Floating card visuals — handgebaut, nicht von shadcn */

function FloatingCardCalendar() {
  return (
    <div
      className="absolute"
      style={{
        top: "8%",
        left: "0%",
        width: "70%",
        transform: "rotate(-3deg)",
        background: "linear-gradient(168deg,#262d33,#171c20)",
        border: "1.5px solid rgba(250,247,242,0.22)",
        borderRadius: "18px",
        boxShadow: "0 50px 96px -40px rgba(0,0,0,0.85), inset 0 1px 0 rgba(250,247,242,0.08)",
        color: "var(--cream)",
      }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ borderBottom: "1px solid rgba(250,247,242,0.1)" }}
      >
        <span className="block h-2 w-2 rounded-full" style={{ background: "#ED6A5E" }} />
        <span className="block h-2 w-2 rounded-full" style={{ background: "#E0B23C" }} />
        <span className="block h-2 w-2 rounded-full" style={{ background: "#5BBF7A" }} />
        <span
          className="ml-3 font-mono text-[0.6rem] tracking-wider"
          style={{ color: "rgba(250,247,242,0.5)" }}
        >
          Kalender · <b style={{ color: "var(--coral)" }}>Mi 28. Mai</b>
        </span>
      </div>
      <div className="px-4 py-4 space-y-3">
        <CalRow time="09:00" title="Briefing-Setup" note="Selbstgespraech" />
        <CalRow time="10:30" title="Howden Group" note="Erstgespraech · DACH-Service" highlight />
        <CalRow time="14:00" title="SATA GmbH" note="Folgegespraech · Pilot" highlight />
        <CalRow time="16:15" title="Fokuszeit" note="Anti-Slop-Filter" />
      </div>
    </div>
  );
}

function CalRow({
  time,
  title,
  note,
  highlight,
}: {
  time: string;
  title: string;
  note: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="font-mono text-[0.66rem] w-12 flex-none"
        style={{ color: highlight ? "var(--coral)" : "rgba(250,247,242,0.5)" }}
      >
        {time}
      </span>
      <div
        className="flex-1 rounded-md px-3 py-2"
        style={{
          background: highlight
            ? "linear-gradient(150deg,rgba(230,80,66,0.22),rgba(230,80,66,0.05))"
            : "rgba(250,247,242,0.05)",
          borderLeft: highlight
            ? "2.5px solid var(--coral)"
            : "2.5px solid rgba(250,247,242,0.18)",
        }}
      >
        <div className="text-[0.86rem] font-semibold">{title}</div>
        <div className="text-[0.7rem] mt-0.5" style={{ color: "rgba(250,247,242,0.6)" }}>
          {note}
        </div>
      </div>
    </div>
  );
}

function FloatingCardBrief() {
  return (
    <div
      className="absolute"
      style={{
        bottom: "0%",
        right: "0%",
        width: "62%",
        transform: "rotate(4deg)",
        background: "linear-gradient(158deg,#443c34 0%,#2f2720 52%,#221b15 100%)",
        border: "1.5px solid rgba(250,247,242,0.22)",
        borderRadius: "16px",
        boxShadow: "0 46px 92px -42px rgba(0,0,0,0.8)",
        color: "var(--cream)",
        padding: "1.1rem 1.2rem 1.3rem",
      }}
    >
      <div
        className="font-mono text-[0.58rem] tracking-[0.1em] uppercase mb-3"
        style={{ color: "var(--coral)" }}
      >
        <span
          aria-hidden
          className="inline-block w-2 h-2 rounded-sm mr-2 align-middle"
          style={{ background: "var(--coral)" }}
        />
        Briefing · 10:30
      </div>
      <h4 className="text-[1rem] font-semibold leading-snug">Howden Group · DACH-Service</h4>
      <p className="mt-2 text-[0.78rem] leading-relaxed text-cream/75">
        Mittelstaendischer Ventilator-Hersteller, Howden hat den Bereich kuerzlich
        in eigene GmbH ueberfuehrt. Ansprechpartner leitet Aftermarket.
      </p>
      <div className="mt-3 space-y-1.5">
        <BriefDot label="Konzept" text="Service-Daten-Layer als gemeinsamer Layer" />
        <BriefDot label="Anker" text="Kommt von SAP-Migration, sucht Mehrwert" />
        <BriefDot label="News" text="Howden-Acquisition durch Chart Industries" />
      </div>
    </div>
  );
}

function BriefDot({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex gap-2 text-[0.72rem]">
      <span
        className="font-mono text-[0.55rem] tracking-wider uppercase flex-none"
        style={{ color: "var(--coral)", paddingTop: "0.1rem" }}
      >
        {label}
      </span>
      <span className="text-cream/85">{text}</span>
    </div>
  );
}

function FloatingCardSnippet() {
  return (
    <div
      className="absolute hidden md:block"
      style={{
        top: "60%",
        left: "44%",
        width: "32%",
        transform: "rotate(-6deg)",
        background: "var(--ink-deep)",
        border: "1.5px solid rgba(95,224,208,0.3)",
        borderRadius: "12px",
        boxShadow: "0 32px 60px -28px rgba(0,0,0,0.8)",
        color: "var(--cream)",
        padding: "0.85rem 0.95rem",
        fontFamily: "var(--mono)",
        fontSize: "0.62rem",
        lineHeight: 1.7,
      }}
    >
      <div className="flex gap-1.5 mb-2">
        <span className="block h-1.5 w-1.5 rounded-full bg-cream/25" />
        <span className="block h-1.5 w-1.5 rounded-full bg-cream/25" />
        <span className="block h-1.5 w-1.5 rounded-full bg-cream/25" />
      </div>
      <div>
        <span style={{ color: "var(--coral)" }}>$</span> tavily
        <span style={{ color: "rgba(250,247,242,0.5)" }}> --query </span>
        <span style={{ color: "var(--sand)" }}>&quot;Howden Group News&quot;</span>
      </div>
      <div style={{ color: "rgba(250,247,242,0.6)" }}>fetching 4 sources...</div>
      <div>
        <span style={{ color: "var(--petrol)" }}>OK</span>{" "}
        <span style={{ color: "rgba(250,247,242,0.8)" }}>4/4 retrieved</span>
      </div>
      <div style={{ color: "rgba(250,247,242,0.5)" }}>
        <span style={{ color: "var(--coral)" }}>claude</span> synthesizing...
        <span
          className="inline-block w-2 h-3 ml-1 align-text-bottom"
          style={{ background: "var(--coral)" }}
        />
      </div>
    </div>
  );
}

function MockBriefCard() {
  return (
    <div
      className="relative"
      style={{
        background: "#fff",
        border: "1px solid rgba(24,20,16,0.08)",
        borderRadius: "var(--rl)",
        padding: "1.8rem",
        boxShadow: "0 26px 60px -34px rgba(24,20,16,0.32)",
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ background: "var(--coral)", borderTopLeftRadius: "var(--rl)", borderBottomLeftRadius: "var(--rl)" }}
      />
      <div className="flex items-center justify-between">
        <span className="mono-label" style={{ color: "var(--coral)" }}>
          10:30 · Howden Group
        </span>
        <span
          className="font-mono text-[0.65rem] tracking-wider uppercase"
          style={{ color: "var(--soft)" }}
        >
          DACH-Service
        </span>
      </div>
      <h3 className="h3 mt-3">Wo stehen wir?</h3>
      <p className="mt-3 text-[0.95rem] leading-relaxed" style={{ color: "var(--ink)" }}>
        Erstgespraech mit Marcus K., Head of Aftermarket. Bereich wurde 2024 in eigene
        GmbH ueberfuehrt, suchen jetzt einen Service-Daten-Layer.
      </p>
      <div
        className="mt-5 pt-5 border-t"
        style={{ borderColor: "rgba(24,20,16,0.08)" }}
      >
        <p className="mono-label">Talking Points</p>
        <ul className="mt-3 space-y-2 text-[0.92rem] leading-relaxed">
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
            <span>Wie liefert Howden heute Wartungspakete an Kunden?</span>
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
